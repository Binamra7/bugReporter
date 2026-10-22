'use client';

import styles from './triage.module.css';

export default function TriageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div className={styles.state} role="alert">
            <h1>Reports couldn’t be loaded</h1>
            <p>
                The server didn’t get an answer from the report database. This is usually temporary. Nothing has been
                changed.
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
