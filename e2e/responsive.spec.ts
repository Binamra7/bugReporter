import type { Page } from '@playwright/test';
import { closeDb, insertReport } from './db';
import { expect, signIn, test } from './fixtures';

test.afterAll(closeDb);

async function expectNoHorizontalScroll(page: Page) {
    const [inner, scroll] = await page.evaluate(() => [window.innerWidth, document.documentElement.scrollWidth]);
    expect(scroll).toBeLessThanOrEqual(inner);
}

test.describe('layouts on narrow screens', () => {
    test('nothing scrolls sideways', async ({ page }) => {
        const id = await insertReport({
            title: 'A very long title without spaces: ExportToCSVDropsRowsAfterOneThousandWhenFilteredByCustomerSegment',
            pageUrl: 'https://app.example.com/a/really/long/path/that/keeps/going/and/going?with=query&params=too',
        });
        await page.goto('/');
        await expectNoHorizontalScroll(page);
        await page.goto('/sign-in');
        await expectNoHorizontalScroll(page);
        await signIn(page);
        await expectNoHorizontalScroll(page);
        await page.goto(`/triage/${id}`);
        await expectNoHorizontalScroll(page);
    });

    test('controls are large enough to tap', async ({ page }) => {
        await page.goto('/');
        for (const name of ['Send report']) {
            const box = await page.getByRole('button', { name }).boundingBox();
            expect(box!.height).toBeGreaterThanOrEqual(44);
        }
        for (const severity of ['High', 'Medium', 'Low']) {
            const option = page
                .locator('label')
                .filter({ has: page.getByRole('radio', { name: new RegExp(severity) }) });
            expect((await option.boundingBox())!.height).toBeGreaterThanOrEqual(44);
        }
    });

    test('the report form is usable end to end', async ({ page }) => {
        await page.goto('/');
        await page.getByLabel('Title').fill(`Phone report ${Date.now()}`);
        await page.getByLabel('What happened?').fill('Filed from a phone-sized screen during end-to-end tests.');
        await page.getByText('Cosmetic, a typo, or a minor annoyance.').click();
        await page.getByRole('button', { name: 'Send report' }).click();
        await expect(page.getByRole('heading', { name: 'Report received' })).toBeVisible();
    });
});
