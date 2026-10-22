import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { getAuthConfig } from '@/lib/env';
import { createToken, passwordMatches, verifyToken } from './token';

const COOKIE = 'bugreporter_session';
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

/** Memoised per request. Throws ConfigError when auth isn't configured. */
export const isMaintainer = cache(async (): Promise<boolean> => {
    const { secret, password } = getAuthConfig();
    const token = (await cookies()).get(COOKIE)?.value;
    return token !== undefined && verifyToken(token, secret, password);
});

/**
 * Call at the top of every triage page and server action; the layout alone is not enough because server actions
 * are reachable by direct POST. `returnTo` is where sign-in sends the maintainer afterwards.
 */
export async function requireMaintainer(returnTo = '/triage'): Promise<void> {
    let allowed = false;
    try {
        allowed = await isMaintainer();
    } catch {
        // Missing auth config: the sign-in page explains which variable to set.
    }
    if (!allowed) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
}

export async function startSession(candidate: string): Promise<boolean> {
    const { secret, password } = getAuthConfig();
    if (!passwordMatches(candidate, password)) return false;
    const expires = new Date(Date.now() + SESSION_MS);
    (await cookies()).set(COOKIE, createToken(expires, secret, password), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires,
    });
    return true;
}

export async function endSession(): Promise<void> {
    (await cookies()).delete(COOKIE);
}

/** Only same-site triage paths, so `?next=` can't be used to bounce a maintainer to another site. */
export function safeReturnPath(value: unknown): string {
    return typeof value === 'string' && /^\/triage(?:[/?]|$)/.test(value) ? value : '/triage';
}
