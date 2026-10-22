import Link from 'next/link';
import { FieldIntro, SplitPage, splitStyles } from '@/components/SplitPage';

export default function NotFound() {
    return (
        <SplitPage
            field={
                <FieldIntro
                    id="not-found-heading"
                    title="Not here."
                    lead="This page or report doesn’t exist. A report that has been deleted can’t be restored."
                />
            }
        >
            <ul aria-labelledby="not-found-heading" className={splitStyles.links}>
                <li>
                    <Link href="/">Report a bug</Link>
                </li>
                <li>
                    <Link href="/triage">Go to the triage queue</Link>
                </li>
            </ul>
        </SplitPage>
    );
}
