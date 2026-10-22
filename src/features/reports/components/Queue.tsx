import Link from 'next/link';
import { Timestamp } from '@/components/Timestamp';
import { SEVERITIES, SEVERITY, type QueueItem, type ReportStatus } from '../model';
import { hasFilters, QUEUE_LIMIT, queueHref, SEARCH_MAX, SORTS, SORTS_FOR, type QueueQuery } from '../queue';
import { FocusOnArrival } from './FocusOnArrival';
import { SeverityScale } from './SeverityScale';
import styles from './Queue.module.css';

const NOUN: Record<ReportStatus, [string, string]> = {
    open: ['open report', 'open reports'],
    resolved: ['resolved report', 'resolved reports'],
};

function plural(count: number, status: ReportStatus) {
    return NOUN[status][count === 1 ? 0 : 1];
}

interface QueueProps {
    query: QueueQuery;
    reports: QueueItem[];
    matched: number;
    counts: Record<ReportStatus, number>;
    deleted: string | null;
}

export function Queue({ query, reports, matched, counts, deleted }: QueueProps) {
    const total = counts[query.status];
    const filtered = hasFilters(query);

    return (
        <div className={styles.queue}>
            {deleted && (
                // After a delete the dialog that held focus is gone; land on the confirmation instead of <body>.
                <FocusOnArrival className="notice">
                    <p>
                        Deleted <span className="mono">{deleted}</span>.
                    </p>
                </FocusOnArrival>
            )}

            <h1 className={styles.title}>
                <span className={`${styles.count} numeric`}>{total}</span> {plural(total, query.status)}
            </h1>

            <nav aria-label="Report status" className={styles.tabs}>
                {(['open', 'resolved'] as const).map(status => (
                    <Link
                        key={status}
                        href={queueHref({ status, severity: query.severity, q: query.q, sort: SORTS_FOR[status][0]! })}
                        aria-current={status === query.status ? 'page' : undefined}
                        className={styles.tab}
                    >
                        {status === 'open' ? 'Open' : 'Resolved'} <span className="numeric">{counts[status]}</span>
                    </Link>
                ))}
            </nav>

            {/* Uncontrolled inputs keep stale values across client navigations; remount when the view changes. */}
            <Filters key={queueHref(query)} query={query} />

            {filtered && (
                <p className={styles.summary}>
                    {matched} of {total} {plural(total, query.status)} match
                    {query.q && (
                        <>
                            {' '}
                            “<strong>{query.q}</strong>”
                        </>
                    )}
                    {query.severity && <> at {SEVERITY[query.severity].label.toLowerCase()} severity</>}.
                </p>
            )}

            {reports.length > 0 ? (
                <ol className={styles.list}>
                    {reports.map(report => (
                        <QueueRow key={report.id} report={report} />
                    ))}
                </ol>
            ) : (
                <EmptyState query={query} filtered={filtered} />
            )}

            {matched > reports.length && (
                <p className={styles.summary}>
                    Showing the first {QUEUE_LIMIT} of {matched}. Narrow the list with search or a severity filter to
                    see the rest.
                </p>
            )}
        </div>
    );
}

function Filters({ query }: { query: QueueQuery }) {
    return (
        <form action="/triage" method="get" className={styles.filters} role="search" aria-label="Filter reports">
            {query.status !== 'open' && <input type="hidden" name="status" value={query.status} />}
            <div className={`field ${styles.search}`}>
                <label htmlFor="q" className="field-label">
                    Search
                </label>
                <input
                    id="q"
                    name="q"
                    type="search"
                    className="input"
                    defaultValue={query.q}
                    maxLength={SEARCH_MAX}
                    placeholder="Words in the title or description"
                />
            </div>
            <div className="field">
                <label htmlFor="severity" className="field-label">
                    Severity
                </label>
                <select id="severity" name="severity" className="input" defaultValue={query.severity ?? ''}>
                    <option value="">All severities</option>
                    {SEVERITIES.map(severity => (
                        <option key={severity} value={severity}>
                            {SEVERITY[severity].label}
                        </option>
                    ))}
                </select>
            </div>
            <div className="field">
                <label htmlFor="sort" className="field-label">
                    Sort by
                </label>
                <select id="sort" name="sort" className="input" defaultValue={query.sort}>
                    {SORTS_FOR[query.status].map(sort => (
                        <option key={sort} value={sort}>
                            {SORTS[sort]}
                        </option>
                    ))}
                </select>
            </div>
            <div className={styles.filterActions}>
                <button type="submit" className="button">
                    Apply
                </button>
                {hasFilters(query) && (
                    <Link href={queueHref({ ...query, severity: null, q: '' })} className={styles.clear}>
                        Clear filters
                    </Link>
                )}
            </div>
        </form>
    );
}

function QueueRow({ report }: { report: QueueItem }) {
    return (
        <li className={styles.row}>
            <div className={styles.severity}>
                <SeverityScale severity={report.severity} />
            </div>
            <div className={styles.body}>
                <Link href={`/triage/${report.id}`} className={styles.rowTitle}>
                    {report.title}
                </Link>
                <p className={styles.excerpt}>{report.excerpt}</p>
            </div>
            <p className={styles.meta}>
                <span className="mono">{report.reference}</span>
                <span>
                    {report.resolvedAt ? 'Resolved ' : 'Reported '}
                    <Timestamp date={report.resolvedAt ?? report.createdAt} />
                </span>
            </p>
        </li>
    );
}

function EmptyState({ query, filtered }: { query: QueueQuery; filtered: boolean }) {
    if (filtered) {
        return (
            <div className={styles.empty}>
                <p className={styles.emptyTitle}>No {NOUN[query.status][1]} match these filters.</p>
                <Link href={queueHref({ ...query, severity: null, q: '' })}>Clear filters</Link>
            </div>
        );
    }
    return query.status === 'open' ? (
        <div className={styles.empty}>
            <p className={styles.emptyTitle}>The queue is clear.</p>
            <p>New reports from the report form will appear here, highest severity first.</p>
        </div>
    ) : (
        <div className={styles.empty}>
            <p className={styles.emptyTitle}>Nothing resolved yet.</p>
            <p>Reports you mark resolved move here, most recent first.</p>
        </div>
    );
}
