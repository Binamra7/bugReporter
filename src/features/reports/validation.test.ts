import { LIMITS, parseNewReport } from './validation';

function form(fields: Record<string, string>): FormData {
    const data = new FormData();
    for (const [key, value] of Object.entries(fields)) data.set(key, value);
    return data;
}

const valid = {
    title: 'Export button does nothing',
    description: 'Clicking Export on the invoices page shows no file and no error.',
    severity: 'medium',
    pageUrl: '',
    version: '',
};

describe('parseNewReport', () => {
    it('accepts a complete report and trims text', () => {
        const result = parseNewReport(form({ ...valid, title: '  Export button does nothing  ', version: ' 2.4.1 ' }));
        expect(result).toEqual({
            ok: true,
            data: { ...valid, title: 'Export button does nothing', pageUrl: null, version: '2.4.1' },
        });
    });

    it('turns blank optional fields into null', () => {
        const result = parseNewReport(form({ ...valid, pageUrl: '   ', version: '' }));
        expect(result.ok && result.data).toMatchObject({ pageUrl: null, version: null });
    });

    it('reports every missing required field', () => {
        const result = parseNewReport(form({ title: ' ', description: '' }));
        expect(result.ok).toBe(false);
        expect(!result.ok && Object.keys(result.errors).sort()).toEqual(['description', 'severity', 'title']);
    });

    it('rejects a severity outside the scale', () => {
        const result = parseNewReport(form({ ...valid, severity: 'critical' }));
        expect(!result.ok && result.errors.severity).toBe('Choose how severe the bug is.');
    });

    it.each(['example.com/page', 'javascript:alert(1)', 'ftp://example.com/file'])(
        'rejects %s as a page address',
        url => {
            const result = parseNewReport(form({ ...valid, pageUrl: url }));
            expect(!result.ok && result.errors.pageUrl).toMatch(/http:\/\/ or https:\/\//);
        }
    );

    it('accepts an http(s) page address', () => {
        const result = parseNewReport(form({ ...valid, pageUrl: 'https://app.example.com/invoices?page=2' }));
        expect(result.ok && result.data.pageUrl).toBe('https://app.example.com/invoices?page=2');
    });

    it('enforces length limits', () => {
        const result = parseNewReport(
            form({ ...valid, title: 'x'.repeat(LIMITS.title + 1), description: 'y'.repeat(LIMITS.description + 1) })
        );
        expect(!result.ok && result.errors).toMatchObject({
            title: expect.stringContaining(String(LIMITS.title)),
            description: expect.stringContaining(String(LIMITS.description)),
        });
    });
});
