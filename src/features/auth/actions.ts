'use server';

import { redirect } from 'next/navigation';
import { endSession, safeReturnPath, startGuestSession, startMaintainerSession } from '@/lib/auth/session';
import { ConfigError } from '@/lib/env';
import { consume } from '@/lib/rate-limit';

/** `attempt` changes on every submission so an identical error message is re-announced. */
export type SignInState = { error: string | null; attempt: number };

export async function signIn(previous: SignInState, formData: FormData): Promise<SignInState> {
    const attempt = previous.attempt + 1;
    const password = formData.get('password');
    if (typeof password !== 'string' || password === '') return { error: 'Enter the maintainer password.', attempt };

    // Counted before the check so parallel guesses can't all slip under the limit; a correct password gives it back.
    const usage = await consume('signIn');
    if (usage.limited) {
        return { error: 'Too many wrong passwords from this network. Try again in 15 minutes.', attempt };
    }
    try {
        if (!(await startMaintainerSession(password))) return { error: 'That password isn’t right.', attempt };
    } catch (error) {
        await usage.refund();
        if (error instanceof ConfigError) return { error: `Sign-in isn’t configured: ${error.message}`, attempt };
        throw error;
    }
    await usage.refund();
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
