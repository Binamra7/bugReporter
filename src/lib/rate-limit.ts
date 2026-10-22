import 'server-only';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { getDb } from './db';

/**
 * Fixed-window counters in MongoDB. Serverless instances share no memory, so an in-process limiter would reset with
 * every cold start; the app already has a database, so the counters live there. A TTL index deletes expired windows.
 * Client addresses are hashed before they are stored.
 */
interface Bucket {
    _id: string;
    count: number;
    expiresAt: Date;
}

export const LIMITS = {
    failedSignIn: { max: 10, windowMs: 15 * 60 * 1000 },
    report: { max: 20, windowMs: 60 * 60 * 1000 },
} as const;
type Action = keyof typeof LIMITS;

let ttlIndex: Promise<unknown> | undefined;

async function buckets() {
    const collection = (await getDb()).collection<Bucket>('rate_limits');
    ttlIndex ??= collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch((error: unknown) => {
        ttlIndex = undefined;
        throw error;
    });
    await ttlIndex;
    return collection;
}

// On Vercel these headers are set by the platform, not the client.
async function clientKey(): Promise<string> {
    const h = await headers();
    const ip = h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    return createHash('sha256').update(ip).digest('base64url').slice(0, 22);
}

async function bucketId(action: Action, now: number) {
    return `${action}:${await clientKey()}:${Math.floor(now / LIMITS[action].windowMs)}`;
}

/** True once this client has used up `action`'s allowance in the current window. */
export async function isLimited(action: Action): Promise<boolean> {
    const bucket = await (await buckets()).findOne({ _id: await bucketId(action, Date.now()) });
    return (bucket?.count ?? 0) >= LIMITS[action].max;
}

export async function record(action: Action): Promise<void> {
    const now = Date.now();
    const { windowMs } = LIMITS[action];
    const windowEnd = new Date((Math.floor(now / windowMs) + 1) * windowMs);
    await (
        await buckets()
    ).updateOne(
        { _id: await bucketId(action, now) },
        { $inc: { count: 1 }, $setOnInsert: { expiresAt: windowEnd } },
        { upsert: true }
    );
}
