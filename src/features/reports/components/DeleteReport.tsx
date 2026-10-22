'use client';

import { useActionState, useRef } from 'react';
import { removeReport, type TriageActionState } from '../triage-actions';
import styles from './ReportDetail.module.css';

/** Deleting is permanent, so it asks first in a modal dialog that keeps focus until answered. */
export function DeleteReport({ id, reference, title }: { id: string; reference: string; title: string }) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const keepRef = useRef<HTMLButtonElement>(null);
    const [state, formAction, pending] = useActionState<TriageActionState, FormData>(removeReport, {
        tone: 'idle',
        message: '',
        attempt: 0,
    });

    function open() {
        dialogRef.current?.showModal();
        // showModal() focuses the first control, which is the destructive one; start on the safe choice instead.
        keepRef.current?.focus();
    }

    return (
        <>
            <button type="button" className="text-button" data-variant="danger" onClick={open}>
                Delete report
            </button>
            <dialog
                ref={dialogRef}
                className={styles.dialog}
                aria-labelledby="delete-heading"
                aria-describedby="delete-body"
            >
                <form action={formAction} onSubmit={event => pending && event.preventDefault()}>
                    <h2 id="delete-heading" className={styles.dialogHeading}>
                        Delete <span className="mono">{reference}</span>?
                    </h2>
                    <p id="delete-body">
                        “{title}” will be removed permanently. Deleted reports can’t be restored. To take it out of the
                        open queue but keep a record, mark it resolved instead.
                    </p>
                    {state.tone === 'error' && (
                        <p key={state.attempt} className="field-error" role="alert">
                            {state.message}
                        </p>
                    )}
                    <input type="hidden" name="id" value={id} />
                    <div className={styles.dialogActions}>
                        <button type="submit" className="button" data-variant="danger" aria-disabled={pending}>
                            {pending ? 'Deleting…' : 'Delete permanently'}
                        </button>
                        <button
                            type="button"
                            className="button"
                            ref={keepRef}
                            onClick={() => dialogRef.current?.close()}
                        >
                            Keep report
                        </button>
                    </div>
                </form>
            </dialog>
        </>
    );
}
