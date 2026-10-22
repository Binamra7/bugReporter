import Link from 'next/link';
import { ArrowRightIcon } from '@/components/icons';
import { Wordmark } from '@/components/Wordmark';
import { ReportForm } from '@/features/reports/components/ReportForm';
import styles from './page.module.css';

export default function ReportPage() {
    return (
        <div className={styles.page}>
            <header className={styles.tag}>
                <Wordmark />
                <div className={styles.intro}>
                    <h1 id="report-heading" className={styles.display}>
                        Found a bug?
                    </h1>
                    <p className={styles.lead}>
                        Tell us what broke. Every report goes into the maintainers’ triage queue, where reports are
                        worked through by severity.
                    </p>
                </div>
                <section className={styles.advice} aria-labelledby="advice-heading">
                    <h2 id="advice-heading">A useful report has</h2>
                    <ul>
                        <li>a title someone could search for later</li>
                        <li>what you did, what you expected and what happened instead</li>
                        <li>the page address, if it happened on the web</li>
                    </ul>
                </section>
                <p className={styles.maintainer}>
                    <Link href="/triage">
                        Maintainers: open the triage queue <ArrowRightIcon />
                    </Link>
                </p>
            </header>
            <main id="main" className={styles.main}>
                <ReportForm labelledBy="report-heading" />
            </main>
        </div>
    );
}
