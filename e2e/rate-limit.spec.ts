import { bugs, closeDb } from './db';
import { expect, test } from './fixtures';

test.afterAll(closeDb);

// Locally the server trusts x-real-ip, so each test gets its own address and its own counters.
// On Vercel the platform sets this header, so clients can't choose their bucket.
function fromAddress(address: string) {
    return { extraHTTPHeaders: { 'x-real-ip': address } };
}

test.describe('rate limits', () => {
    test.describe(() => {
        test.use(fromAddress('203.0.113.10'));

        test('ten wrong passwords lock sign-in for that network', async ({ page }) => {
            await page.goto('/sign-in');
            for (let attempt = 1; attempt <= 10; attempt++) {
                await page.getByLabel('Password').fill(`wrong-${attempt}`);
                await page.getByRole('button', { name: 'Sign in' }).click();
                await expect(page.getByRole('alert').filter({ hasText: 'That password isn’t right.' })).toBeVisible();
            }
            await page.getByLabel('Password').fill('wrong-11');
            await page.getByRole('button', { name: 'Sign in' }).click();
            await expect(page.getByRole('alert').filter({ hasText: 'Too many wrong passwords' })).toBeVisible();
        });
    });

    test.describe(() => {
        test.use(fromAddress('203.0.113.20'));

        test('a network can send 20 reports an hour', async ({ page }) => {
            const prefix = `Flood ${Date.now()}`;
            const send = async (n: number) => {
                await page.goto('/');
                await page.getByLabel('Title').fill(`${prefix} ${n}`);
                await page.getByLabel('What happened?').fill('One of many reports sent quickly from one address.');
                await page.getByRole('radio', { name: /Low/ }).check();
                await page.getByRole('button', { name: 'Send report' }).click();
            };
            for (let n = 1; n <= 20; n++) {
                await send(n);
                await expect(page.getByRole('heading', { name: 'Report received' })).toBeVisible();
            }
            await send(21);
            await expect(page.getByText('This network has sent 20 reports in the last hour.')).toBeVisible();
            expect(await (await bugs()).countDocuments({ bugTitle: { $regex: `^${prefix}` } })).toBe(20);
        });
    });
});
