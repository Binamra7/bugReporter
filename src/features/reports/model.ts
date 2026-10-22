export const SEVERITIES = ['high', 'medium', 'low'] as const;
export type Severity = (typeof SEVERITIES)[number];

export const SEVERITY: Record<Severity, { label: string; level: 1 | 2 | 3; guidance: string }> = {
    high: { label: 'High', level: 3, guidance: 'Blocks work or loses data, and there is no workaround.' },
    medium: { label: 'Medium', level: 2, guidance: 'Something is broken, but there is a way around it.' },
    low: { label: 'Low', level: 1, guidance: 'Cosmetic, a typo, or a minor annoyance.' },
};

export function isSeverity(value: unknown): value is Severity {
    return typeof value === 'string' && (SEVERITIES as readonly string[]).includes(value);
}

export type ReportStatus = 'open' | 'resolved';

export interface Report {
    id: string;
    reference: string;
    title: string;
    description: string;
    severity: Severity;
    status: ReportStatus;
    pageUrl: string | null;
    version: string | null;
    createdAt: Date;
    updatedAt: Date;
    resolvedAt: Date | null;
}

/** The short handle people quote; display only. Routes and queries use the full id. */
export function referenceFor(id: string): string {
    return `BR-${id.slice(-6).toUpperCase()}`;
}
