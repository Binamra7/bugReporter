import 'server-only';
import { ObjectId, type Collection, type Document, type Filter } from 'mongodb';
import { getDb } from '@/lib/db';
import { isSeverity, referenceFor, SEVERITIES, type QueueItem, type Report, type ReportStatus } from './model';
import { QUEUE_LIMIT, type QueueQuery } from './queue';
import type { NewReport } from './validation';

/**
 * Field names match the documents the original Express/Mongoose API wrote to the `bugs` collection, so existing
 * data keeps working. `resolvedAt`, `pageUrl` and `version` were added later and are absent on old documents.
 */
interface BugDocument {
    _id: ObjectId;
    bugTitle: string;
    bugDescription: string;
    bugSeverity: string;
    bugResolved?: boolean;
    createdAt: Date;
    updatedAt: Date;
    resolvedAt?: Date | null;
    pageUrl?: string | null;
    version?: string | null;
}

async function bugs(): Promise<Collection<BugDocument>> {
    return (await getDb()).collection<BugDocument>('bugs');
}

// Legacy documents were written without validation; fall back to the id's embedded time rather than crash a page.
function dateOr(value: unknown, fallback: Date): Date {
    return value instanceof Date && !Number.isNaN(value.getTime()) ? value : fallback;
}

function toReport(doc: BugDocument): Report | null {
    if (!isSeverity(doc.bugSeverity)) {
        console.warn(`Skipping bug ${doc._id.toHexString()} with unknown severity "${doc.bugSeverity}"`);
        return null;
    }
    const id = doc._id.toHexString();
    const resolved = doc.bugResolved === true;
    const createdAt = dateOr(doc.createdAt, doc._id.getTimestamp());
    const updatedAt = dateOr(doc.updatedAt, createdAt);
    return {
        id,
        reference: referenceFor(id),
        title: doc.bugTitle,
        description: doc.bugDescription,
        severity: doc.bugSeverity,
        status: resolved ? 'resolved' : 'open',
        pageUrl: doc.pageUrl ?? null,
        version: doc.version ?? null,
        createdAt,
        updatedAt,
        // Legacy documents have no resolvedAt; the old UI showed updatedAt as the resolved date.
        resolvedAt: resolved ? dateOr(doc.resolvedAt, updatedAt) : null,
    };
}

function parseId(id: string): ObjectId | null {
    return /^[0-9a-f]{24}$/i.test(id) ? new ObjectId(id) : null;
}

/**
 * Legacy open reports may store bugResolved as false or omit it, so "open" means "not true". Documents with a
 * severity outside the scale can't be shown, so they are left out of counts too, keeping tab counts and rows equal.
 */
function statusFilter(status: ReportStatus): Filter<BugDocument> {
    const severity = { bugSeverity: { $in: [...SEVERITIES] } };
    return status === 'resolved' ? { ...severity, bugResolved: true } : { ...severity, bugResolved: { $ne: true } };
}

function escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const SORT_STAGES: Record<QueueQuery['sort'], Document> = {
    severity: { severityRank: 1, createdAt: -1 },
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    resolved: { resolvedSortAt: -1 },
};

export async function createReport(input: NewReport): Promise<Report> {
    const now = new Date();
    const doc: BugDocument = {
        _id: new ObjectId(),
        bugTitle: input.title,
        bugDescription: input.description,
        bugSeverity: input.severity,
        bugResolved: false,
        createdAt: now,
        updatedAt: now,
        resolvedAt: null,
        pageUrl: input.pageUrl,
        version: input.version,
    };
    await (await bugs()).insertOne(doc);
    return toReport(doc)!;
}

export const EXCERPT_LENGTH = 240;

/** `matched` counts every report the query matches; `reports` holds at most QUEUE_LIMIT of them. */
export async function listReports(query: QueueQuery): Promise<{ reports: QueueItem[]; matched: number }> {
    const match: Filter<BugDocument> = statusFilter(query.status);
    if (query.severity) match.bugSeverity = query.severity;
    if (query.q) {
        const pattern = new RegExp(escapeRegex(query.q), 'i');
        match.$or = [{ bugTitle: pattern }, { bugDescription: pattern }];
    }

    const collection = await bugs();
    const docsPromise = collection
        .aggregate<BugDocument>([
            { $match: match },
            {
                $addFields: {
                    severityRank: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$bugSeverity', 'high'] }, then: 0 },
                                { case: { $eq: ['$bugSeverity', 'medium'] }, then: 1 },
                                { case: { $eq: ['$bugSeverity', 'low'] }, then: 2 },
                            ],
                            default: 3,
                        },
                    },
                    resolvedSortAt: { $ifNull: ['$resolvedAt', '$updatedAt'] },
                },
            },
            { $sort: { ...SORT_STAGES[query.sort], _id: -1 } },
            { $limit: QUEUE_LIMIT },
            // Rows show two lines of the description; don't ship up to 5,000 characters per row.
            { $addFields: { bugDescription: { $substrCP: ['$bugDescription', 0, EXCERPT_LENGTH] } } },
        ])
        .toArray();
    const [docs, matched] = await Promise.all([docsPromise, collection.countDocuments(match)]);

    const reports = docs.flatMap(doc => {
        const report = toReport(doc);
        if (!report) return [];
        const { description: excerpt, ...rest } = report;
        return [{ ...rest, excerpt: excerpt.length < EXCERPT_LENGTH ? excerpt : `${excerpt.trimEnd()}…` }];
    });
    return { reports, matched };
}

export async function countByStatus(): Promise<Record<ReportStatus, number>> {
    const collection = await bugs();
    const [open, resolved] = await Promise.all([
        collection.countDocuments(statusFilter('open')),
        collection.countDocuments(statusFilter('resolved')),
    ]);
    return { open, resolved };
}

export async function getReport(id: string): Promise<Report | null> {
    const _id = parseId(id);
    if (!_id) return null;
    const doc = await (await bugs()).findOne({ _id });
    return doc ? toReport(doc) : null;
}

/**
 * Returns false when no report has this id. Only a real change is written, so a second "Mark resolved" from a stale
 * tab keeps the original resolution date.
 */
export async function setReportStatus(id: string, status: ReportStatus): Promise<boolean> {
    const _id = parseId(id);
    if (!_id) return false;
    const now = new Date();
    const resolving = status === 'resolved';
    const collection = await bugs();
    const result = await collection.updateOne(
        { _id, bugResolved: resolving ? { $ne: true } : true },
        { $set: { bugResolved: resolving, resolvedAt: resolving ? now : null, updatedAt: now } }
    );
    return result.matchedCount === 1 || (await collection.countDocuments({ _id }, { limit: 1 })) === 1;
}

/** Returns false when no report has this id. */
export async function deleteReport(id: string): Promise<boolean> {
    const _id = parseId(id);
    if (!_id) return false;
    const result = await (await bugs()).deleteOne({ _id });
    return result.deletedCount === 1;
}
