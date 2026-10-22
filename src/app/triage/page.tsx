import type { Metadata } from 'next';
import { ConfigNotice } from '@/components/ConfigNotice';
import { Queue } from '@/features/reports/components/Queue';
import { parseQueueQuery, queueHref } from '@/features/reports/queue';
import { countByStatus, listReports } from '@/features/reports/repository';
import { requireViewer } from '@/lib/auth/session';
import { ConfigError } from '@/lib/env';

export const metadata: Metadata = { title: 'Triage queue' };

const REFERENCE = /^BR-[0-9A-F]{6}$/;

export default async function QueuePage({ searchParams }: PageProps<'/triage'>) {
    const params = await searchParams;
    const query = parseQueueQuery(params);
    await requireViewer(queueHref(query));

    let data;
    try {
        data = await Promise.all([listReports(query), countByStatus()]);
    } catch (error) {
        if (error instanceof ConfigError) return <ConfigNotice error={error} area="The report database" />;
        throw error;
    }
    const [{ reports, matched }, counts] = data;
    // Only echo a well-formed reference back, so the notice can't be made to say arbitrary things.
    const deleted = typeof params.deleted === 'string' && REFERENCE.test(params.deleted) ? params.deleted : null;
    return <Queue query={query} reports={reports} matched={matched} counts={counts} deleted={deleted} />;
}
