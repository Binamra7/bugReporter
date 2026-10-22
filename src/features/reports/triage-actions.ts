'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireMaintainer } from '@/lib/auth/session';
import { referenceFor } from './model';
import { deleteReport, setReportStatus } from './repository';

export type TriageActionState = { tone: 'idle' | 'success' | 'error'; message: string };

function readId(formData: FormData): string {
    const id = formData.get('id');
    return typeof id === 'string' ? id : '';
}

const GONE = 'This report no longer exists. It may have been deleted in another tab.';
const UNREACHABLE = 'The change wasn’t saved because the database didn’t respond. Try again.';

export async function changeStatus(_previous: TriageActionState, formData: FormData): Promise<TriageActionState> {
    const id = readId(formData);
    await requireMaintainer(`/triage/${id}`);
    const status = formData.get('status') === 'resolved' ? 'resolved' : 'open';

    try {
        if (!(await setReportStatus(id, status))) return { tone: 'error', message: GONE };
    } catch (error) {
        console.error('Failed to change report status', error);
        return { tone: 'error', message: UNREACHABLE };
    }
    revalidatePath('/triage', 'layout');
    return { tone: 'success', message: status === 'resolved' ? 'Marked resolved.' : 'Reopened.' };
}

export async function removeReport(_previous: TriageActionState, formData: FormData): Promise<TriageActionState> {
    const id = readId(formData);
    await requireMaintainer(`/triage/${id}`);

    try {
        if (!(await deleteReport(id))) return { tone: 'error', message: GONE };
    } catch (error) {
        console.error('Failed to delete report', error);
        return { tone: 'error', message: UNREACHABLE };
    }
    revalidatePath('/triage', 'layout');
    redirect(`/triage?deleted=${referenceFor(id)}`);
}
