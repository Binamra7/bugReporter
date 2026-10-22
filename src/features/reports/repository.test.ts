import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';
import { closeDb } from '@/lib/db';
import { parseQueueQuery } from './queue';
import { countByStatus, createReport, deleteReport, getReport, listReports, setReportStatus } from './repository';
import type { NewReport } from './validation';

let server: MongoMemoryServer;
let raw: MongoClient;

beforeAll(async () => {
    server = await MongoMemoryServer.create();
    process.env.MONGODB_URI = server.getUri();
    process.env.MONGODB_DB = 'bug-reporter-test';
    raw = await MongoClient.connect(server.getUri());
}, 60_000);

afterAll(async () => {
    await closeDb();
    await raw.close();
    await server.stop();
});

beforeEach(async () => {
    await raw.db('bug-reporter-test').collection('bugs').deleteMany({});
});

const base: NewReport = {
    title: 'Search ignores accents',
    description: 'Searching for "cafe" does not find "café".',
    severity: 'low',
    pageUrl: null,
    version: null,
};

async function seed(...reports: Partial<NewReport>[]) {
    const created = [];
    // Sequential so createdAt order is deterministic.
    for (const report of reports) created.push(await createReport({ ...base, ...report }));
    return created;
}

describe('reports repository', () => {
    it('creates a report and reads it back', async () => {
        const [created] = await seed({ title: 'Crash on save', severity: 'high', pageUrl: 'https://a.example/x' });
        const fetched = await getReport(created!.id);
        expect(fetched).toMatchObject({
            title: 'Crash on save',
            severity: 'high',
            status: 'open',
            pageUrl: 'https://a.example/x',
            resolvedAt: null,
        });
        expect(fetched?.reference).toMatch(/^BR-[0-9A-F]{6}$/);
    });

    it('returns null for malformed and unknown ids', async () => {
        expect(await getReport('not-an-id')).toBeNull();
        expect(await getReport(new ObjectId().toHexString())).toBeNull();
    });

    it('sorts open reports by severity, newest first within a level', async () => {
        await seed(
            { title: 'low', severity: 'low' },
            { title: 'high-1', severity: 'high' },
            { title: 'medium', severity: 'medium' },
            { title: 'high-2', severity: 'high' }
        );
        const { reports } = await listReports(parseQueueQuery({}));
        expect(reports.map(r => r.title)).toEqual(['high-2', 'high-1', 'medium', 'low']);
    });

    it('filters by severity and searches title and description case-insensitively', async () => {
        await seed(
            { title: 'Login loops', severity: 'high' },
            { title: 'Typo', description: 'The LOGIN page says "Pasword".', severity: 'low' },
            { title: 'Slow export', severity: 'low' }
        );
        const search = await listReports(parseQueueQuery({ q: 'login' }));
        expect(search.reports.map(r => r.title).sort()).toEqual(['Login loops', 'Typo']);

        const filtered = await listReports(parseQueueQuery({ q: 'login', severity: 'low' }));
        expect(filtered.reports.map(r => r.title)).toEqual(['Typo']);
    });

    it('treats search text literally, not as a pattern', async () => {
        await seed({ title: 'Price shows $(amount)' }, { title: 'Other' });
        const { reports } = await listReports(parseQueueQuery({ q: '$(amount)' }));
        expect(reports.map(r => r.title)).toEqual(['Price shows $(amount)']);
    });

    it('resolves and reopens a report', async () => {
        const [report] = await seed({});
        expect(await setReportStatus(report!.id, 'resolved')).toBe(true);
        const resolved = await getReport(report!.id);
        expect(resolved?.status).toBe('resolved');
        expect(resolved?.resolvedAt).toBeInstanceOf(Date);
        expect(await countByStatus()).toEqual({ open: 0, resolved: 1 });

        await setReportStatus(report!.id, 'open');
        expect(await getReport(report!.id)).toMatchObject({ status: 'open', resolvedAt: null });
    });

    it('reports a missing id instead of pretending to update or delete', async () => {
        const missing = new ObjectId().toHexString();
        expect(await setReportStatus(missing, 'resolved')).toBe(false);
        expect(await deleteReport(missing)).toBe(false);
    });

    it('deletes a report', async () => {
        const [report] = await seed({});
        expect(await deleteReport(report!.id)).toBe(true);
        expect(await getReport(report!.id)).toBeNull();
    });

    it('reads documents written by the legacy Express API', async () => {
        const createdAt = new Date('2022-02-10T09:00:00Z');
        const updatedAt = new Date('2022-02-12T15:30:00Z');
        await raw
            .db('bug-reporter-test')
            .collection('bugs')
            .insertMany([
                {
                    bugTitle: 'Legacy open',
                    bugDescription: 'Written by mongoose',
                    bugSeverity: 'medium',
                    bugResolved: false,
                    createdAt,
                    updatedAt: createdAt,
                    __v: 0,
                },
                {
                    bugTitle: 'Legacy resolved',
                    bugDescription: 'Written by mongoose',
                    bugSeverity: 'high',
                    bugResolved: true,
                    createdAt,
                    updatedAt,
                    __v: 0,
                },
                { bugTitle: 'No status field', bugDescription: 'x', bugSeverity: 'low', createdAt, updatedAt },
            ]);

        const open = await listReports(parseQueueQuery({}));
        expect(open.reports.map(r => r.title)).toEqual(['Legacy open', 'No status field']);

        const resolved = await listReports(parseQueueQuery({ status: 'resolved' }));
        expect(resolved.reports[0]).toMatchObject({ title: 'Legacy resolved', resolvedAt: updatedAt, pageUrl: null });
    });
});
