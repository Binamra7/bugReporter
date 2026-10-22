'use server';

import { redirect } from 'next/navigation';
import { endSession, safeReturnPath, startGuestSession, startMaintainerSession } from '@/lib/auth/session';
import { ConfigError } from '@/lib/env';
import { isLimited, record } from '@/lib/rate-limit';

/** `attempt` changes on every submission so an identical error message is re-announced. */
export type SignInState = { error: string | null; attempt: number };

async function overLimit(): Promise<boolean> {
    try {
        return await isLimited('failedSignIn');
    } catch (error) {
        // Sign-in doesn't need the database; a limiter outage shouldn't lock maintainers out.
        console.error('Sign-in rate limit check failed', error);
        return false;
    }
}

async function recordFailure(): Promise<void> {
    try {
        await record('failedSignIn');
    } catch (error) {
        console.error('Recording a failed sign-in failed', error);
    }
}

export async function signIn(previous: SignInState, formData: FormData): Promise<SignInState> {
    const attempt = previous.attempt + 1;
    const password = formData.get('password');
    if (typeof password !== 'string' || password === '') return { error: 'Enter the maintainer password.', attempt };

    if (await overLimit()) {
        return { error: 'Too many wrong passwords from this network. Try again in 15 minutes.', attempt };
    }
    try {
        if (!(await startMaintainerSession(password))) {
            await recordFailure();
            return { error: 'That password isn’t right.', attempt };
        }
    } catch (error) {
        if (error instanceof ConfigError) return { error: `Sign-in isn’t configured: ${error.message}`, attempt };
        throw error;
    }
    redirect(safeReturnPath(formData.get('next')));
}

export async function signInAsGuest(formData: FormData): Promise<void> {
    if (!(await startGuestSession())) redirect('/sign-in');
    redirect(safeReturnPath(formData.get('next')));
}

export async function signOut(): Promise<void> {
    await endSession();
    redirect('/sign-in');
}
