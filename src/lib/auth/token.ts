import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Stateless session tokens: `v2.<role>.<expiresAtMs>.<hmac>`. There are no user accounts, so there is nothing to look
 * up; the signature proves the holder signed in (as a maintainer with the password, or as a guest) before `expiresAt`.
 *
 * The signing key mixes in the password, so changing ADMIN_PASSWORD signs every existing session out. Signing out
 * only deletes the cookie; a copied token stays valid until it expires or a secret rotates.
 */
const VERSION = 'v2';

export const ROLES = ['maintainer', 'guest'] as const;
export type Role = (typeof ROLES)[number];

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

export function createToken(role: Role, expiresAt: Date, secret: string, password: string): string {
    const payload = `${VERSION}.${role}.${expiresAt.getTime()}`;
    return `${payload}.${signature(payload, secret, password)}`;
}

/** The token's role if it is genuine and unexpired, otherwise null. */
export function verifyToken(token: string, secret: string, password: string, now = new Date()): Role | null {
    const [version, role, expires, sig, ...rest] = token.split('.');
    if (version !== VERSION || !role || !expires || !sig || rest.length > 0) return null;
    if (!(ROLES as readonly string[]).includes(role) || !/^\d+$/.test(expires)) return null;
    if (Number(expires) <= now.getTime()) return null;
    return safeEqual(sig, signature(`${version}.${role}.${expires}`, secret, password)) ? (role as Role) : null;
}

/** Compares digests so the time taken doesn't reveal the password's length or matching prefix. */
export function passwordMatches(candidate: string, password: string): boolean {
    const digest = (value: string) => createHash('sha256').update(value).digest();
    return timingSafeEqual(digest(candidate), digest(password));
}
