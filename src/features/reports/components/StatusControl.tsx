'use client';

import { useActionState } from 'react';
import type { ReportStatus } from '../model';
import { changeStatus, type TriageActionState } from '../triage-actions';
import styles from './ReportDetail.module.css';

export function StatusControl({ id, status }: { id: string; status: ReportStatus }) {
    const [state, formAction, pending] = useActionState<TriageActionState, FormData>(changeStatus, {
        tone: 'idle',
        message: '',
    });
    const next: ReportStatus = status === 'open' ? 'resolved' : 'open';

    return (
        <form action={formAction} onSubmit={event => pending && event.preventDefault()} className={styles.control}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value={next} />
            <button
                type="submit"
                className="button"
                data-variant={next === 'resolved' ? 'primary' : undefined}
                aria-disabled={pending}
            >
                {pending ? 'Saving…' : next === 'resolved' ? 'Mark resolved' : 'Reopen'}
            </button>
            <p role="status" className={styles.feedback} data-tone={state.tone}>
                {state.message}
            </p>
        </form>
    );
}
