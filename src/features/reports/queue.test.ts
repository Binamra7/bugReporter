import { hasFilters, parseQueueQuery, queueHref } from './queue';

describe('parseQueueQuery', () => {
    it('defaults to open reports by severity', () => {
        expect(parseQueueQuery({})).toEqual({ status: 'open', severity: null, sort: 'severity', q: '' });
    });

    it('defaults resolved reports to most recently resolved', () => {
        expect(parseQueueQuery({ status: 'resolved' }).sort).toBe('resolved');
    });

    it('ignores values it does not recognise', () => {
        expect(parseQueueQuery({ status: 'archived', severity: 'urgent', sort: 'random' })).toEqual({
            status: 'open',
            severity: null,
            sort: 'severity',
            q: '',
        });
    });

    it('does not allow the resolved-date sort on open reports', () => {
        expect(parseQueueQuery({ sort: 'resolved' }).sort).toBe('severity');
    });

    it('takes the first value of a repeated param and trims and caps search', () => {
        const query = parseQueueQuery({ severity: ['low', 'high'], q: `  ${'a'.repeat(150)}  ` });
        expect(query.severity).toBe('low');
        expect(query.q).toHaveLength(100);
    });
});

describe('queueHref', () => {
    it('omits defaults', () => {
        expect(queueHref(parseQueueQuery({}))).toBe('/triage');
        expect(queueHref(parseQueueQuery({ status: 'resolved' }))).toBe('/triage?status=resolved');
    });

    it('round-trips a filtered query', () => {
        const query = parseQueueQuery({ status: 'resolved', severity: 'high', sort: 'oldest', q: 'export csv' });
        const href = queueHref(query);
        expect(href).toBe('/triage?status=resolved&severity=high&sort=oldest&q=export+csv');
        expect(parseQueueQuery(Object.fromEntries(new URL(href, 'http://x').searchParams))).toEqual(query);
    });
});

describe('hasFilters', () => {
    it('is true only for severity or search', () => {
        expect(hasFilters(parseQueueQuery({ sort: 'oldest' }))).toBe(false);
        expect(hasFilters(parseQueueQuery({ q: 'login' }))).toBe(true);
        expect(hasFilters(parseQueueQuery({ severity: 'low' }))).toBe(true);
    });
});
