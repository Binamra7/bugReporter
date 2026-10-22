import 'server-only';
import { createHmac } from 'node:crypto';
import { headers } from 'next/headers';
import { getDb } from './db';

/**
 * Fixed-window counters in MongoDB. Serverless instances share no memory, so an in-process limiter would reset with
 * every cold start; the app already has a database, so the counters live there. A TTL index deletes expired windows.
 *
 * Each call increments first and decides from the new count in one atomic update, so parallel requests can't all
 * read a count below the limit. The limiter fails open: if the database is slow or unreachable the request goes
 * ahead, because blocking sign-in or reporting on a counter outage is worse than briefly not limiting.
 *
 * Client addresses come from `x-real-ip`, which Vercel sets and clients can't override. Anywhere else (plain
 * `next start`, or behind another proxy) the header is client-controlled or missing; without an address nothing is
 * limited, rather than lumping every visitor into one shared bucket.
 */
interface Bucket {
    _id: string;
    count: number;
    expiresAt: Date;
}

export const LIMITS = {
    signIn: { max: 10, windowMs: 15 * 60 * 1000 },
    report: { max: 20, windowMs: 60 * 60 * 1000 },
} as const;
type Action = keyof typeof LIMITS;

const OPERATION_TIMEOUT_MS = 1500;

let ttlIndex: Promise<unknown> | undefined;

async function buckets() {
    const collection = (await getDb()).collection<Bucket>('rate_limits');
    // Once per instance; failure (e.g. a database user without index rights) only means expired windows linger.
    ttlIndex ??= collection
        .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, timeoutMS: OPERATION_TIMEOUT_MS })
        .catch((error: unknown) => console.error('Could not create the rate_limits TTL index', error));
    await ttlIndex;
    return collection;
}

/** IPv6 clients usually control a whole /64, so they share one bucket per /64. */
export function networkOf(ip: string): string {
    if (!ip.includes(':')) return ip;
    const [head = '', tail = ''] = ip.split('::');
    const left = head ? head.split(':') : [];
    const right = tail ? tail.split(':') : [];
    const groups = ip.includes('::') ? [...left, ...Array(8 - left.length - right.length).fill('0'), ...right] : left;
    return `${groups.slice(0, 4).join(':')}::/64`;
}

async function clientKey(): Promise<string | null> {
    const ip = (await headers()).get('x-real-ip')?.trim();
    if (!ip) return null;
    // Keyed, so the stored value can't be reversed by hashing every IPv4 address.
    const key = process.env.SESSION_SECRET ?? 'bugreporter-rate-limit';
    return createHmac('sha256', key).update(networkOf(ip)).digest('base64url').slice(0, 22);
}

/**
 * Counts one use of `action` for this client and reports whether it was over the allowance. Returns a function that
 * gives the use back, for callers that only want to count failures.
 */
export async function consume(action: Action): Promise<{ limited: boolean; refund: () => Promise<void> }> {
    const none = { limited: false, refund: async () => {} };
    const client = await clientKey();
    if (!client) return none;

    const now = Date.now();
    const { max, windowMs } = LIMITS[action];
    const window = Math.floor(now / windowMs);
    const _id = `${action}:${client}:${window}`;
    try {
        const collection = await buckets();
        const bucket = await collection.findOneAndUpdate(
            { _id },
            { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 1) * windowMs) } },
            { upsert: true, returnDocument: 'after', timeoutMS: OPERATION_TIMEOUT_MS }
        );
        return {
            limited: (bucket?.count ?? 0) > max,
            refund: async () => {
                await collection
                    .updateOne({ _id }, { $inc: { count: -1 } }, { timeoutMS: OPERATION_TIMEOUT_MS })
                    .catch((error: unknown) => console.error(`Could not refund a ${action} rate-limit use`, error));
            },
        };
    } catch (error) {
        console.error(`Rate limit check for ${action} failed; allowing the request`, error);
        return none;
    }
}
