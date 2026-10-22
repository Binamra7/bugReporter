'use client';

import styles from './triage.module.css';

export default function TriageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div className={styles.state} role="alert">
            <h1>This page couldn’t be loaded</h1>
            <p>
                Something failed on the server, most often a slow or unreachable database. Nothing was changed. Trying
                again usually works.
            </p>
            {error.digest && (
                <p>
                    Error reference: <code>{error.digest}</code>
                </p>
            )}
            <button type="button" className="button" data-variant="primary" onClick={reset}>
                Try again
            </button>
        </div>
    );
}
