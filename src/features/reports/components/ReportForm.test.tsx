// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { submitReport } from '../actions';
import { ReportForm } from './ReportForm';

vi.mock('../actions', () => ({ submitReport: vi.fn() }));

function renderForm() {
    render(
        <>
            <h1 id="heading">Found a bug?</h1>
            <ReportForm labelledBy="heading" />
        </>
    );
    return userEvent.setup();
}

beforeEach(() => vi.mocked(submitReport).mockReset());

describe('ReportForm', () => {
    it('explains each severity level', () => {
        renderForm();
        expect(screen.getByRole('radio', { name: /High.*no workaround/ })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: /Medium.*way around it/ })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: /Low.*typo/ })).toBeInTheDocument();
    });

    it('lists and focuses validation errors, keeping what was typed', async () => {
        vi.mocked(submitReport).mockResolvedValue({
            status: 'invalid',
            errors: { description: 'Describe what happened in at least 10 characters.' },
            values: { title: 'Export broken', description: 'broken', severity: 'medium' },
        });
        const user = renderForm();
        await user.type(screen.getByLabelText('Title'), 'Export broken');
        await user.click(screen.getByRole('button', { name: 'Send report' }));

        const summary = await screen.findByText('One field needs attention');
        await waitFor(() => expect(summary.closest('[role="alert"]')).toHaveFocus());
        expect(screen.getByLabelText('What happened?')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByLabelText('What happened?')).toHaveAccessibleDescription(
            expect.stringContaining('at least 10 characters')
        );
        expect(screen.getByLabelText('Title')).toHaveValue('Export broken');
        expect(screen.getByRole('radio', { name: /Medium/ })).toBeChecked();
    });

    it('shows a server failure without losing the report', async () => {
        vi.mocked(submitReport).mockResolvedValue({
            status: 'failed',
            message: 'Your report wasn’t saved because the server couldn’t reach its database. Try sending it again.',
            values: { title: 'Export broken' },
        });
        const user = renderForm();
        await user.click(screen.getByRole('button', { name: 'Send report' }));

        expect(await screen.findByText('Not sent')).toBeInTheDocument();
        expect(screen.getByLabelText('Title')).toHaveValue('Export broken');
    });

    it('confirms with a reference and starts over on request', async () => {
        vi.mocked(submitReport).mockResolvedValue({
            status: 'received',
            reference: 'BR-1E23BB',
            title: 'Export broken',
            severity: 'high',
        });
        const user = renderForm();
        await user.click(screen.getByRole('button', { name: 'Send report' }));

        const heading = await screen.findByRole('heading', { name: 'Report received' });
        await waitFor(() => expect(heading).toHaveFocus());
        expect(screen.getByText('BR-1E23BB')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Report another bug' }));
        expect(screen.getByLabelText('Title')).toHaveValue('');
    });
});
