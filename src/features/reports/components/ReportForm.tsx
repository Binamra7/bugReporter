'use client';

import { useActionState, useEffect, useRef, useState, type ReactNode } from 'react';
import { submitReport } from '../actions';
import { SEVERITIES, SEVERITY } from '../model';
import { HONEYPOT_FIELD, type FormValues, type SubmitState } from '../submit-state';
import { LIMITS, type FieldErrors, type NewReportField } from '../validation';
import { SeverityScale } from './SeverityScale';
import styles from './ReportForm.module.css';

const FIELD_ORDER: NewReportField[] = ['title', 'description', 'severity', 'pageUrl', 'version'];

/** Remounting on "report another" gives a clean form and a fresh action state. */
export function ReportForm({ labelledBy }: { labelledBy: string }) {
    const [round, setRound] = useState(0);
    return <ReportFormRound key={round} labelledBy={labelledBy} onReportAnother={() => setRound(r => r + 1)} />;
}

function ReportFormRound({ labelledBy, onReportAnother }: { labelledBy: string; onReportAnother: () => void }) {
    const [state, formAction, pending] = useActionState<SubmitState, FormData>(submitReport, { status: 'idle' });
    const summaryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (state.status === 'invalid' || state.status === 'failed') summaryRef.current?.focus();
    }, [state]);

    if (state.status === 'received') return <Received state={state} onReportAnother={onReportAnother} />;

    const errors: FieldErrors = state.status === 'invalid' ? state.errors : {};
    const values: FormValues = state.status === 'invalid' || state.status === 'failed' ? state.values : {};
    const errorFields = FIELD_ORDER.filter(field => errors[field]);

    return (
        <form
            action={formAction}
            // aria-disabled keeps the button focusable while sending, so block the repeat submission here.
            onSubmit={event => pending && event.preventDefault()}
            aria-labelledby={labelledBy}
            className={styles.form}
            noValidate
        >
            {state.status === 'invalid' && (
                <div ref={summaryRef} tabIndex={-1} className="notice" data-tone="error" role="alert">
                    <p className="notice-title">
                        {errorFields.length === 1 ? 'One field needs attention' : 'Some fields need attention'}
                    </p>
                    <ul className={styles.errorList}>
                        {errorFields.map(field => (
                            <li key={field}>
                                <a href={`#${field === 'severity' ? 'severity-high' : field}`}>{errors[field]}</a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {state.status === 'failed' && (
                <div ref={summaryRef} tabIndex={-1} className="notice" data-tone="error" role="alert">
                    <p className="notice-title">Not sent</p>
                    <p>{state.message}</p>
                </div>
            )}

            <Field
                name="title"
                label="Title"
                hint="A short summary someone could search for later."
                error={errors.title}
            >
                {props => (
                    <input
                        {...props}
                        className="input"
                        type="text"
                        autoComplete="off"
                        maxLength={LIMITS.title}
                        defaultValue={values.title}
                        required
                    />
                )}
            </Field>

            <Field
                name="description"
                label="What happened?"
                hint="What you did, what you expected, and what happened instead. Steps to reproduce help most."
                error={errors.description}
            >
                {props => (
                    <textarea
                        {...props}
                        className="input"
                        rows={7}
                        maxLength={LIMITS.description}
                        defaultValue={values.description}
                        required
                    />
                )}
            </Field>

            <fieldset
                className={styles.severity}
                aria-describedby={errors.severity ? 'severity-error' : undefined}
                aria-invalid={errors.severity ? true : undefined}
            >
                <legend className="field-label">How severe is it?</legend>
                {errors.severity && (
                    <p id="severity-error" className="field-error">
                        {errors.severity}
                    </p>
                )}
                <div className={styles.options}>
                    {SEVERITIES.map(severity => (
                        <label key={severity} className={styles.option}>
                            <input
                                id={`severity-${severity}`}
                                type="radio"
                                name="severity"
                                value={severity}
                                defaultChecked={values.severity === severity}
                                required
                            />
                            <span className={styles.optionText}>
                                <SeverityScale severity={severity} />
                                <span className={styles.guidance}>{SEVERITY[severity].guidance}</span>
                            </span>
                        </label>
                    ))}
                </div>
            </fieldset>

            <div className={styles.pair}>
                <Field
                    name="pageUrl"
                    label="Page address"
                    optional
                    hint="Where it happened, if it was on the web."
                    error={errors.pageUrl}
                >
                    {props => (
                        <input
                            {...props}
                            className="input mono"
                            type="url"
                            inputMode="url"
                            autoComplete="off"
                            spellCheck={false}
                            placeholder="https://"
                            maxLength={LIMITS.pageUrl}
                            defaultValue={values.pageUrl}
                        />
                    )}
                </Field>
                <Field
                    name="version"
                    label="Version"
                    optional
                    hint="App version, browser or device."
                    error={errors.version}
                >
                    {props => (
                        <input
                            {...props}
                            className="input"
                            type="text"
                            autoComplete="off"
                            spellCheck={false}
                            maxLength={LIMITS.version}
                            defaultValue={values.version}
                        />
                    )}
                </Field>
            </div>

            <div className={styles.honeypot} aria-hidden="true">
                <label>
                    Leave this empty
                    <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
                </label>
            </div>

            <div className={styles.submitRow}>
                <button className="button" data-variant="primary" type="submit" aria-disabled={pending}>
                    {pending ? 'Sending…' : 'Send report'}
                </button>
                <p className={styles.submitNote} aria-live="polite">
                    {pending ? 'Sending your report…' : 'Optional fields can be left blank.'}
                </p>
            </div>
        </form>
    );
}

interface ControlProps {
    id: string;
    name: string;
    'aria-describedby': string;
    'aria-invalid': true | undefined;
}

function Field({
    name,
    label,
    hint,
    error,
    optional = false,
    children,
}: {
    name: string;
    label: string;
    hint: string;
    error?: string;
    optional?: boolean;
    children: (props: ControlProps) => ReactNode;
}) {
    const describedBy = [error && `${name}-error`, `${name}-hint`].filter(Boolean).join(' ');
    return (
        <div className="field">
            <label htmlFor={name} className="field-label">
                {label}
                {optional && <span className="field-optional"> (optional)</span>}
            </label>
            <p id={`${name}-hint`} className="field-hint">
                {hint}
            </p>
            {children({ id: name, name, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
            {error && (
                <p id={`${name}-error`} className="field-error">
                    {error}
                </p>
            )}
        </div>
    );
}

function Received({
    state,
    onReportAnother,
}: {
    state: Extract<SubmitState, { status: 'received' }>;
    onReportAnother: () => void;
}) {
    const headingRef = useRef<HTMLHeadingElement>(null);
    useEffect(() => headingRef.current?.focus(), []);

    return (
        <section className={styles.received} aria-labelledby="received-heading">
            <h2 id="received-heading" ref={headingRef} tabIndex={-1} className={styles.receivedHeading}>
                Report received
            </h2>
            <p className={styles.reference}>
                <span className="visually-hidden">Reference </span>
                <span className="mono">{state.reference}</span>
            </p>
            <dl className={styles.receivedFacts}>
                <dt>Title</dt>
                <dd>{state.title}</dd>
                <dt>Severity</dt>
                <dd>
                    <SeverityScale severity={state.severity} />
                </dd>
            </dl>
            <p>
                It’s in the maintainers’ triage queue now. Keep the reference if you need to mention this report later.
            </p>
            <button className="button" type="button" onClick={onReportAnother}>
                Report another bug
            </button>
        </section>
    );
}
