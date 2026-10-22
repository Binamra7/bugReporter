import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ConfigNotice } from '@/components/ConfigNotice';
import { ArrowLeftIcon } from '@/components/icons';
import { FieldFooter, FieldIntro, SplitPage } from '@/components/SplitPage';
import { GuestEntry } from '@/features/auth/GuestEntry';
import { SignInForm } from '@/features/auth/SignInForm';
import { getViewer, safeReturnPath } from '@/lib/auth/session';
import { ConfigError, getAuthConfig } from '@/lib/env';

export const metadata: Metadata = { title: 'Sign in' };

export default async function SignInPage({ searchParams }: PageProps<'/sign-in'>) {
    const returnTo = safeReturnPath((await searchParams).next);

    let configError: ConfigError | null = null;
    let guestAccess = false;
    let isGuest = false;
    try {
        const viewer = await getViewer();
        // Guests stay here so they can sign in as a maintainer; only maintainers skip the form.
        if (viewer === 'maintainer') redirect(returnTo);
        isGuest = viewer === 'guest';
        guestAccess = getAuthConfig().guestAccess;
    } catch (error) {
        if (!(error instanceof ConfigError)) throw error;
        configError = error;
    }

    return (
        <SplitPage
            field={
                <>
                    <FieldIntro
                        id="sign-in-heading"
                        title="Triage"
                        lead="The queue where maintainers sort, resolve and clear bug reports. Reporters don’t need an account."
                    />
                    <FieldFooter>
                        <Link href="/">
                            <ArrowLeftIcon /> Report a bug instead
                        </Link>
                    </FieldFooter>
                </>
            }
        >
            {configError ? (
                <ConfigNotice error={configError} area="Maintainer sign-in" />
            ) : (
                <>
                    <SignInForm returnTo={returnTo} browsingAsGuest={isGuest} />
                    {guestAccess && !isGuest && <GuestEntry returnTo={returnTo} />}
                </>
            )}
        </SplitPage>
    );
}
