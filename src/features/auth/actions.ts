'use server';

import { redirect } from 'next/navigation';
import { endSession, safeReturnPath, startSession } from '@/lib/auth/session';
import { ConfigError } from '@/lib/env';

export type SignInState = { error: string | null };

export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
    const password = formData.get('password');
    if (typeof password !== 'string' || password === '') return { error: 'Enter the maintainer password.' };

    try {
        if (!(await startSession(password))) return { error: 'That password isn’t right.' };
    } catch (error) {
        if (error instanceof ConfigError) return { error: `Sign-in isn’t configured: ${error.message}` };
        throw error;
    }
    redirect(safeReturnPath(formData.get('next')));
}

export async function signOut(): Promise<void> {
    await endSession();
    redirect('/sign-in');
}
