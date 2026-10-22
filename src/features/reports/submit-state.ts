import type { Severity } from './model';
import type { FieldErrors } from './validation';

export const FORM_FIELDS = ['title', 'description', 'severity', 'pageUrl', 'version'] as const;
export type FormValues = Partial<Record<(typeof FORM_FIELDS)[number], string>>;

/**
 * Hidden from people, tempting to bots. A non-empty value marks the submission as automated. The name means nothing
 * to browser or password-manager autofill, so a real reporter's browser won't fill it in.
 */
export const HONEYPOT_FIELD = 'br_trap_7';

export type SubmitState =
    | { status: 'idle' }
    | { status: 'invalid'; errors: FieldErrors; values: FormValues }
    | { status: 'failed'; message: string; values: FormValues }
    | { status: 'received'; reference: string; title: string; severity: Severity };
