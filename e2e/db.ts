import { MongoClient, ObjectId } from 'mongodb';
import { E2E_ENV } from '../playwright.config';

let client: MongoClient | undefined;

export async function bugs() {
    client ??= await MongoClient.connect(E2E_ENV.MONGODB_URI);
    return client.db(E2E_ENV.MONGODB_DB).collection('bugs');
}

export async function closeDb() {
    await client?.close();
    client = undefined;
}

/** Inserts a report the way the app stores it, so a test can mutate it without disturbing seeded data. */
export async function insertReport(fields: { title: string; severity?: string; resolved?: boolean; pageUrl?: string }) {
    const now = new Date();
    const _id = new ObjectId();
    await (
        await bugs()
    ).insertOne({
        _id,
        bugTitle: fields.title,
        bugDescription: `Created by an end-to-end test: ${fields.title}`,
        bugSeverity: fields.severity ?? 'medium',
        bugResolved: fields.resolved ?? false,
        createdAt: now,
        updatedAt: now,
        resolvedAt: fields.resolved ? now : null,
        pageUrl: fields.pageUrl ?? null,
        version: null,
    });
    return _id.toHexString();
}
