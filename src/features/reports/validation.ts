import { z } from 'zod';
import { SEVERITIES } from './model';

export const LIMITS = { title: 120, description: 5000, pageUrl: 2000, version: 60 } as const;

const optionalText = (max: number, tooLong: string) =>
    z
        .string()
        .trim()
        .max(max, { error: tooLong })
        .transform(value => value || null);

export const newReportSchema = z.object({
    title: z
        .string()
        .trim()
        .min(3, { error: 'Give the bug a short title, at least 3 characters.' })
        .max(LIMITS.title, { error: `Keep the title under ${LIMITS.title} characters.` }),
    description: z
        .string()
        .trim()
        .min(10, { error: 'Describe what happened in at least 10 characters.' })
        .max(LIMITS.description, { error: `Keep the description under ${LIMITS.description} characters.` }),
    severity: z.enum(SEVERITIES, { error: 'Choose how severe the bug is.' }),
    pageUrl: optionalText(LIMITS.pageUrl, 'That address is too long.').refine(
        value => value === null || isHttpUrl(value),
        { error: 'Enter a full web address starting with http:// or https://.' }
    ),
    version: optionalText(LIMITS.version, `Keep the version under ${LIMITS.version} characters.`),
});

export type NewReport = z.infer<typeof newReportSchema>;
export type NewReportField = keyof NewReport;
export type FieldErrors = Partial<Record<NewReportField, string>>;

export function isHttpUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

export type ParseResult = { ok: true; data: NewReport } | { ok: false; errors: FieldErrors };

export function parseNewReport(formData: FormData): ParseResult {
    const result = newReportSchema.safeParse({
        title: formData.get('title') ?? '',
        description: formData.get('description') ?? '',
        severity: formData.get('severity') ?? undefined,
        pageUrl: formData.get('pageUrl') ?? '',
        version: formData.get('version') ?? '',
    });
    if (result.success) return { ok: true, data: result.data };

    const errors: FieldErrors = {};
    for (const issue of result.error.issues) {
        const field = issue.path[0] as NewReportField;
        errors[field] ??= issue.message;
    }
    return { ok: false, errors };
}
