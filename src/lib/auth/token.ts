import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Stateless session tokens: `v1.<expiresAtMs>.<hmac>`. There is one maintainer role and no user table, so there is
 * nothing to look up; the signature proves the holder knew the password before `expiresAt`.
 *
 * The signing key mixes in the password, so changing ADMIN_PASSWORD signs every existing session out.
 */
const VERSION = 'v1';

function signingKey(secret: string, password: string): Buffer {
    return createHmac('sha256', secret).update(`session-key:${password}`).digest();
}

function signature(payload: string, secret: string, password: string): string {
    return createHmac('sha256', signingKey(secret, password)).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
}

export function createToken(expiresAt: Date, secret: string, password: string): string {
    const payload = `${VERSION}.${expiresAt.getTime()}`;
    return `${payload}.${signature(payload, secret, password)}`;
}

export function verifyToken(token: string, secret: string, password: string, now = new Date()): boolean {
    const [version, expires, sig, ...rest] = token.split('.');
    if (version !== VERSION || !expires || !sig || rest.length > 0 || !/^\d+$/.test(expires)) return false;
    if (Number(expires) <= now.getTime()) return false;
    return safeEqual(sig, signature(`${version}.${expires}`, secret, password));
}

/** Compares digests so the time taken doesn't reveal the password's length or matching prefix. */
export function passwordMatches(candidate: string, password: string): boolean {
    const digest = (value: string) => createHash('sha256').update(value).digest();
    return timingSafeEqual(digest(candidate), digest(password));
}
