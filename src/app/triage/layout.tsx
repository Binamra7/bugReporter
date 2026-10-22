import Link from 'next/link';
import type { ReactNode } from 'react';
import { Wordmark } from '@/components/Wordmark';
import { signOut } from '@/features/auth/actions';
import { getViewer } from '@/lib/auth/session';
import styles from './triage.module.css';

export default async function TriageLayout({ children }: { children: ReactNode }) {
    // Display only; every page and action checks access itself.
    const viewer = await getViewer().catch(() => null);
    return (
        <>
            <header className={styles.band}>
                <div className={styles.bandInner}>
                    <Wordmark href="/triage" suffix="Triage" />
                    <nav aria-label="Triage" className={styles.nav}>
                        <Link href="/triage">Queue</Link>
                        <Link href="/">Report form</Link>
                        {viewer === 'guest' && <span className={styles.role}>Guest, read-only</span>}
                        <form action={signOut}>
                            <button type="submit" className="text-button">
                                {viewer === 'guest' ? 'Leave' : 'Sign out'}
                            </button>
                        </form>
                    </nav>
                </div>
            </header>
            <main id="main" className={styles.content}>
                {children}
            </main>
        </>
    );
}
