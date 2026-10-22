import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { getAuthConfig } from '@/lib/env';
import { createToken, passwordMatches, verifyToken, type Role } from './token';

const COOKIE = 'bugreporter_session';
const SESSION_MS: Record<Role, number> = { maintainer: 7 * 24 * 60 * 60 * 1000, guest: 24 * 60 * 60 * 1000 };

/**
 * Who is looking at triage: a maintainer, a read-only guest, or nobody. Memoised per request. Guest sessions stop
 * counting the moment GUEST_ACCESS is turned off. Throws ConfigError when auth isn't configured.
 */
export const getViewer = cache(async (): Promise<Role | null> => {
    const { secret, password, guestAccess } = getAuthConfig();
    const token = (await cookies()).get(COOKIE)?.value;
    const role = token === undefined ? null : verifyToken(token, secret, password);
    return role === 'guest' && !guestAccess ? null : role;
});

async function viewerOrNull(): Promise<Role | null> {
    try {
        return await getViewer();
    } catch {
        // Missing auth config: the sign-in page explains which variable to set.
        return null;
    }
}

/**
 * Guards a triage page: maintainers and guests may read. Call it at the top of every triage page; the layout is not
 * enough because layouts don't re-run on client navigation. `returnTo` is where sign-in sends the visitor afterwards.
 */
export async function requireViewer(returnTo = '/triage'): Promise<Role> {
    const role = await viewerOrNull();
    if (!role) redirect(`/sign-in?next=${encodeURIComponent(safeReturnPath(returnTo))}`);
    return role;
}

/**
 * Guards every server action that changes data. Server actions are public POST endpoints, so this check, not the
 * hidden buttons, is what keeps guests and strangers out.
 */
export async function requireMaintainer(returnTo = '/triage'): Promise<void> {
    if ((await viewerOrNull()) !== 'maintainer') {
        redirect(`/sign-in?next=${encodeURIComponent(safeReturnPath(returnTo))}`);
    }
}

async function setSession(role: Role): Promise<void> {
    const { secret, password } = getAuthConfig();
    const expires = new Date(Date.now() + SESSION_MS[role]);
    (await cookies()).set(COOKIE, createToken(role, expires, secret, password), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires,
    });
}

export async function startMaintainerSession(candidate: string): Promise<boolean> {
    if (!passwordMatches(candidate, getAuthConfig().password)) return false;
    await setSession('maintainer');
    return true;
}

/** Returns false when guest access is turned off for this deployment. */
export async function startGuestSession(): Promise<boolean> {
    if (!getAuthConfig().guestAccess) return false;
    await setSession('guest');
    return true;
}

export async function endSession(): Promise<void> {
    (await cookies()).delete(COOKIE);
}

const BASE = 'http://bugreporter.invalid';

/**
 * Only same-site triage paths, so `?next=` can't send anyone to another site. The value is resolved first, because
 * a path like `/triage/..//evil.example` passes a prefix check and then normalises to the protocol-relative
 * `//evil.example`.
 */
export function safeReturnPath(value: unknown): string {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
        return '/triage';
    }
    let url: URL;
    try {
        url = new URL(value, BASE);
    } catch {
        return '/triage';
    }
    const inTriage = url.pathname === '/triage' || url.pathname.startsWith('/triage/');
    return url.origin === BASE && inTriage ? url.pathname + url.search : '/triage';
}
