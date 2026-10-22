import Link from 'next/link';
import { ArrowRightIcon } from '@/components/icons';
import { FieldFooter, FieldIntro, SplitPage, splitStyles } from '@/components/SplitPage';
import { ReportForm } from '@/features/reports/components/ReportForm';

export default function ReportPage() {
    return (
        <SplitPage
            field={
                <>
                    <FieldIntro
                        id="report-heading"
                        title="Found a bug?"
                        lead="Tell us what broke. Every report goes into the maintainers’ triage queue, where reports are worked through by severity."
                    />
                    <section className={splitStyles.advice} aria-labelledby="advice-heading">
                        <h2 id="advice-heading">A useful report has</h2>
                        <ul>
                            <li>a title someone could search for later</li>
                            <li>what you did, what you expected and what happened instead</li>
                            <li>the page address, if it happened on the web</li>
                        </ul>
                    </section>
                    <FieldFooter>
                        <Link href="/triage">
                            Maintainers: open the triage queue <ArrowRightIcon />
                        </Link>
                    </FieldFooter>
                </>
            }
        >
            <ReportForm labelledBy="report-heading" />
        </SplitPage>
    );
}
