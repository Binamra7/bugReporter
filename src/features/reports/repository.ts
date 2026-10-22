import 'server-only';
import { ObjectId, type Collection, type Document, type Filter } from 'mongodb';
import { getDb } from '@/lib/db';
import { isSeverity, referenceFor, type Report, type ReportStatus } from './model';
import type { QueueQuery } from './queue';
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

export const QUEUE_LIMIT = 200;

async function bugs(): Promise<Collection<BugDocument>> {
    return (await getDb()).collection<BugDocument>('bugs');
}

function toReport(doc: BugDocument): Report | null {
    if (!isSeverity(doc.bugSeverity)) {
        console.warn(`Skipping bug ${doc._id.toHexString()} with unknown severity "${doc.bugSeverity}"`);
        return null;
    }
    const id = doc._id.toHexString();
    const resolved = doc.bugResolved === true;
    return {
        id,
        reference: referenceFor(id),
        title: doc.bugTitle,
        description: doc.bugDescription,
        severity: doc.bugSeverity,
        status: resolved ? 'resolved' : 'open',
        pageUrl: doc.pageUrl ?? null,
        version: doc.version ?? null,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        // Legacy documents have no resolvedAt; the old UI showed updatedAt as the resolved date.
        resolvedAt: resolved ? (doc.resolvedAt ?? doc.updatedAt) : null,
    };
}

function parseId(id: string): ObjectId | null {
    return /^[0-9a-f]{24}$/i.test(id) ? new ObjectId(id) : null;
}

// Legacy open reports may store bugResolved as false or omit it, so "open" means "not true".
function statusFilter(status: ReportStatus): Filter<BugDocument> {
    return status === 'resolved' ? { bugResolved: true } : { bugResolved: { $ne: true } };
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

export async function listReports(query: QueueQuery): Promise<{ reports: Report[]; truncated: boolean }> {
    const match: Filter<BugDocument> = statusFilter(query.status);
    if (query.severity) match.bugSeverity = query.severity;
    if (query.q) {
        const pattern = new RegExp(escapeRegex(query.q), 'i');
        match.$or = [{ bugTitle: pattern }, { bugDescription: pattern }];
    }

    const docs = await (
        await bugs()
    )
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
            { $limit: QUEUE_LIMIT + 1 },
        ])
        .toArray();

    const reports = docs.slice(0, QUEUE_LIMIT).flatMap(doc => toReport(doc) ?? []);
    return { reports, truncated: docs.length > QUEUE_LIMIT };
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

/** Returns false when no report has this id. */
export async function setReportStatus(id: string, status: ReportStatus): Promise<boolean> {
    const _id = parseId(id);
    if (!_id) return false;
    const now = new Date();
    const result = await (
        await bugs()
    ).updateOne(
        { _id },
        { $set: { bugResolved: status === 'resolved', resolvedAt: status === 'resolved' ? now : null, updatedAt: now } }
    );
    return result.matchedCount === 1;
}

/** Returns false when no report has this id. */
export async function deleteReport(id: string): Promise<boolean> {
    const _id = parseId(id);
    if (!_id) return false;
    const result = await (await bugs()).deleteOne({ _id });
    return result.deletedCount === 1;
}
