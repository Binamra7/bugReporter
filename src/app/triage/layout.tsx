import Link from 'next/link';
import type { ReactNode } from 'react';
import { Wordmark } from '@/components/Wordmark';
import { signOut } from '@/features/auth/actions';
import styles from './triage.module.css';

export default function TriageLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <header className={styles.band}>
                <div className={styles.bandInner}>
                    <Wordmark href="/triage" suffix="Triage" />
                    <nav aria-label="Triage" className={styles.nav}>
                        <Link href="/triage">Queue</Link>
                        <Link href="/">Report form</Link>
                        <form action={signOut}>
                            <button type="submit" className="text-button">
                                Sign out
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
