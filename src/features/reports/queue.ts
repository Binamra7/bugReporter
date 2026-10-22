import { isSeverity, type ReportStatus, type Severity } from './model';

export const SORTS = {
    severity: 'Severity, highest first',
    newest: 'Newest reported',
    oldest: 'Oldest reported',
    resolved: 'Recently resolved',
} as const;
export type Sort = keyof typeof SORTS;

/** Sorts offered per tab. "Recently resolved" means nothing for open reports. */
export const SORTS_FOR: Record<ReportStatus, readonly Sort[]> = {
    open: ['severity', 'newest', 'oldest'],
    resolved: ['resolved', 'severity', 'newest', 'oldest'],
};

const DEFAULT_SORT: Record<ReportStatus, Sort> = { open: 'severity', resolved: 'resolved' };

export const SEARCH_MAX = 100;

/** Upper bound on rows rendered at once; the queue says so when a filter would show more. */
export const QUEUE_LIMIT = 200;

export interface QueueQuery {
    status: ReportStatus;
    severity: Severity | null;
    sort: Sort;
    q: string;
}

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value;
}

/** Turns untrusted URL search params into a query, falling back to defaults for anything unrecognised. */
export function parseQueueQuery(params: SearchParams): QueueQuery {
    const status: ReportStatus = first(params.status) === 'resolved' ? 'resolved' : 'open';
    const severity = first(params.severity);
    const sort = first(params.sort);
    return {
        status,
        severity: isSeverity(severity) ? severity : null,
        sort: SORTS_FOR[status].find(s => s === sort) ?? DEFAULT_SORT[status],
        q: (first(params.q) ?? '').trim().slice(0, SEARCH_MAX),
    };
}

/** The canonical URL for a query, omitting defaults so links stay short. */
export function queueHref(query: QueueQuery): string {
    const params = new URLSearchParams();
    if (query.status !== 'open') params.set('status', query.status);
    if (query.severity) params.set('severity', query.severity);
    if (query.sort !== DEFAULT_SORT[query.status]) params.set('sort', query.sort);
    if (query.q) params.set('q', query.q);
    const search = params.toString();
    return search ? `/triage?${search}` : '/triage';
}

export function hasFilters(query: QueueQuery): boolean {
    return query.severity !== null || query.q !== '';
}
