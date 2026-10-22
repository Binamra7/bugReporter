import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ConfigNotice } from '@/components/ConfigNotice';
import { ArrowLeftIcon } from '@/components/icons';
import { ReportDetail } from '@/features/reports/components/ReportDetail';
import { referenceFor } from '@/features/reports/model';
import { parseQueueQuery, queueHref } from '@/features/reports/queue';
import { getReport } from '@/features/reports/repository';
import { requireViewer } from '@/lib/auth/session';
import { ConfigError } from '@/lib/env';

export async function generateMetadata({ params }: PageProps<'/triage/[id]'>): Promise<Metadata> {
    const { id } = await params;
    return { title: `Report ${referenceFor(id)}` };
}

export default async function ReportPage({ params }: PageProps<'/triage/[id]'>) {
    const { id } = await params;
    const viewer = await requireViewer(`/triage/${id}`);

    let report;
    try {
        report = await getReport(id);
    } catch (error) {
        if (error instanceof ConfigError) return <ConfigNotice error={error} area="The report database" />;
        throw error;
    }
    if (!report) notFound();

    const backTo = parseQueueQuery({ status: report.status });
    return (
        <>
            <Link href={queueHref(backTo)} className="back-link">
                <ArrowLeftIcon /> {report.status === 'open' ? 'Open' : 'Resolved'} reports
            </Link>
            <ReportDetail report={report} canEdit={viewer === 'maintainer'} />
        </>
    );
}
