'use server';

import { ConfigError } from '@/lib/env';
import { createReport } from './repository';
import { FORM_FIELDS, HONEYPOT_FIELD, type FormValues, type SubmitState } from './submit-state';
import { parseNewReport } from './validation';

function echoValues(formData: FormData): FormValues {
    const values: FormValues = {};
    for (const field of FORM_FIELDS) {
        const value = formData.get(field);
        if (typeof value === 'string') values[field] = value;
    }
    return values;
}

export async function submitReport(_previous: SubmitState, formData: FormData): Promise<SubmitState> {
    const values = echoValues(formData);

    if (formData.get(HONEYPOT_FIELD)) {
        return { status: 'failed', message: 'This report couldn’t be accepted.', values };
    }

    const parsed = parseNewReport(formData);
    if (!parsed.ok) return { status: 'invalid', errors: parsed.errors, values };

    try {
        const report = await createReport(parsed.data);
        return { status: 'received', reference: report.reference, title: report.title, severity: report.severity };
    } catch (error) {
        if (error instanceof ConfigError) {
            console.error(`Report submission is unavailable: ${error.message}`);
            return {
                status: 'failed',
                message: 'Reports can’t be accepted right now because this site isn’t fully set up. Please try later.',
                values,
            };
        }
        console.error('Failed to save report', error);
        return {
            status: 'failed',
            message: 'Your report wasn’t saved because the server couldn’t reach its database. Try sending it again.',
            values,
        };
    }
}
