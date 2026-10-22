import { changeStatus, removeReport } from './triage-actions';
import { deleteReport, setReportStatus } from './repository';
import { requireMaintainer } from '@/lib/auth/session';

vi.mock('./repository', () => ({ setReportStatus: vi.fn(), deleteReport: vi.fn() }));
vi.mock('@/lib/auth/session', () => ({ requireMaintainer: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({
    redirect: vi.fn((url: string) => {
        throw new Error(`redirect:${url}`);
    }),
}));

const id = '6ad98c8948046d09951e23bb';
const idle = { tone: 'idle', message: '' } as const;

function form(fields: Record<string, string>) {
    const data = new FormData();
    for (const [key, value] of Object.entries(fields)) data.set(key, value);
    return data;
}

beforeEach(() => vi.clearAllMocks());

describe('triage actions', () => {
    it('never touches data when the caller is not a maintainer', async () => {
        vi.mocked(requireMaintainer)
            .mockRejectedValueOnce(new Error('redirect:/sign-in'))
            .mockRejectedValueOnce(new Error('redirect:/sign-in'));

        await expect(changeStatus(idle, form({ id, status: 'resolved' }))).rejects.toThrow('redirect:/sign-in');
        await expect(removeReport(idle, form({ id }))).rejects.toThrow('redirect:/sign-in');
        expect(setReportStatus).not.toHaveBeenCalled();
        expect(deleteReport).not.toHaveBeenCalled();
    });

    it('resolves a report and confirms it', async () => {
        vi.mocked(setReportStatus).mockResolvedValue(true);
        await expect(changeStatus(idle, form({ id, status: 'resolved' }))).resolves.toEqual({
            tone: 'success',
            message: 'Marked resolved.',
        });
        expect(setReportStatus).toHaveBeenCalledWith(id, 'resolved');
    });

    it('treats any status other than resolved as reopening', async () => {
        vi.mocked(setReportStatus).mockResolvedValue(true);
        await changeStatus(idle, form({ id, status: 'archived' }));
        expect(setReportStatus).toHaveBeenCalledWith(id, 'open');
    });

    it('says so when the report is gone or the database fails', async () => {
        vi.mocked(setReportStatus).mockResolvedValueOnce(false);
        expect((await changeStatus(idle, form({ id, status: 'resolved' }))).message).toMatch(/no longer exists/);

        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(deleteReport).mockRejectedValueOnce(new Error('connection reset'));
        expect(await removeReport(idle, form({ id }))).toMatchObject({ tone: 'error' });
    });

    it('returns to the queue with the deleted reference', async () => {
        vi.mocked(deleteReport).mockResolvedValue(true);
        await expect(removeReport(idle, form({ id }))).rejects.toThrow('redirect:/triage?deleted=BR-1E23BB');
    });
});
