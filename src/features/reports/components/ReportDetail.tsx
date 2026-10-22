import { ExternalIcon } from '@/components/icons';
import { Timestamp } from '@/components/Timestamp';
import type { Report } from '../model';
import { isHttpUrl } from '../validation';
import { DeleteReport } from './DeleteReport';
import { SeverityScale } from './SeverityScale';
import { StatusControl } from './StatusControl';
import styles from './ReportDetail.module.css';

export function ReportDetail({ report }: { report: Report }) {
    return (
        <article className={styles.detail} aria-labelledby="report-title">
            <header className={styles.header}>
                <p className={`mono ${styles.reference}`}>{report.reference}</p>
                <h1 id="report-title" className={styles.title}>
                    {report.title}
                </h1>
            </header>

            <div className={styles.columns}>
                <section aria-labelledby="description-heading" className={styles.description}>
                    <h2 id="description-heading" className={styles.sectionHeading}>
                        What happened
                    </h2>
                    <p className={styles.descriptionText}>{report.description}</p>
                </section>

                <aside aria-labelledby="details-heading" className={styles.aside}>
                    <h2 id="details-heading" className={styles.sectionHeading}>
                        Details
                    </h2>
                    <dl className={styles.facts}>
                        <dt>Status</dt>
                        <dd className={styles.status} data-status={report.status}>
                            {report.status === 'open' ? 'Open' : 'Resolved'}
                        </dd>
                        <dt>Severity</dt>
                        <dd>
                            <SeverityScale severity={report.severity} />
                        </dd>
                        <dt>Reported</dt>
                        <dd>
                            <Timestamp date={report.createdAt} precise />
                        </dd>
                        {report.resolvedAt && (
                            <>
                                <dt>Resolved</dt>
                                <dd>
                                    <Timestamp date={report.resolvedAt} precise />
                                </dd>
                            </>
                        )}
                        <dt>Page</dt>
                        <dd>
                            {report.pageUrl && isHttpUrl(report.pageUrl) ? (
                                <a
                                    href={report.pageUrl}
                                    className={`mono ${styles.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer nofollow"
                                >
                                    {report.pageUrl}
                                    <ExternalIcon />
                                    <span className="visually-hidden"> (opens in a new tab)</span>
                                </a>
                            ) : (
                                <span className={styles.none}>Not given</span>
                            )}
                        </dd>
                        <dt>Version</dt>
                        <dd>
                            {report.version ? (
                                <span className="mono">{report.version}</span>
                            ) : (
                                <span className={styles.none}>Not given</span>
                            )}
                        </dd>
                    </dl>

                    <div className={styles.actions}>
                        <StatusControl id={report.id} status={report.status} />
                        <DeleteReport id={report.id} reference={report.reference} title={report.title} />
                    </div>
                </aside>
            </div>
        </article>
    );
}
