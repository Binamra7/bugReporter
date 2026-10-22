'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireMaintainer } from '@/lib/auth/session';
import { referenceFor } from './model';
import { deleteReport, setReportStatus } from './repository';

/** `attempt` changes on every submission so a repeated message is announced again. */
export type TriageActionState = { tone: 'idle' | 'success' | 'error'; message: string; attempt: number };

function readId(formData: FormData): string {
    const id = formData.get('id');
    return typeof id === 'string' ? id : '';
}

const GONE = 'This report no longer exists. It may have been deleted in another tab.';
const UNREACHABLE = 'The change wasn’t saved because the database didn’t respond. Try again.';

export async function changeStatus(previous: TriageActionState, formData: FormData): Promise<TriageActionState> {
    const attempt = previous.attempt + 1;
    const id = readId(formData);
    await requireMaintainer(`/triage/${id}`);
    const status = formData.get('status') === 'resolved' ? 'resolved' : 'open';

    try {
        if (!(await setReportStatus(id, status))) return { tone: 'error', message: GONE, attempt };
    } catch (error) {
        console.error('Failed to change report status', error);
        return { tone: 'error', message: UNREACHABLE, attempt };
    }
    revalidatePath('/triage', 'layout');
    return { tone: 'success', message: status === 'resolved' ? 'Marked resolved.' : 'Reopened.', attempt };
}

export async function removeReport(previous: TriageActionState, formData: FormData): Promise<TriageActionState> {
    const attempt = previous.attempt + 1;
    const id = readId(formData);
    await requireMaintainer(`/triage/${id}`);

    try {
        if (!(await deleteReport(id))) return { tone: 'error', message: GONE, attempt };
    } catch (error) {
        console.error('Failed to delete report', error);
        return { tone: 'error', message: UNREACHABLE, attempt };
    }
    revalidatePath('/triage', 'layout');
    redirect(`/triage?deleted=${referenceFor(id)}`);
}
