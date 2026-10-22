import { bugs, closeDb, insertReport } from './db';
import { expect, test } from './fixtures';

test.afterAll(closeDb);

test.describe('report detail', () => {
    test('shows the report and links its page safely', async ({ maintainer: page }) => {
        const id = await insertReport({
            title: `Detail view ${Date.now()}`,
            severity: 'high',
            pageUrl: 'https://app.example.com/settings',
        });
        await page.goto(`/triage/${id}`);

        await expect(page.getByRole('heading', { level: 1 })).toContainText('Detail view');
        await expect(page.locator('header').getByText(`BR-${id.slice(-6).toUpperCase()}`)).toBeVisible();
        const details = page.getByRole('complementary', { name: 'Details' });
        await expect(details).toContainText('Open');
        await expect(details).toContainText('High');
        await expect(details).toContainText('Not given');
        const link = details.getByRole('link', { name: /app\.example\.com\/settings/ });
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', 'noopener noreferrer nofollow');
    });

    test('opens from the queue and returns to it', async ({ maintainer: page }) => {
        await page.locator('ol > li a').first().click();
        await expect(page).toHaveURL(/\/triage\/[0-9a-f]{24}$/);
        await page.getByRole('link', { name: 'Open reports' }).click();
        await expect(page).toHaveURL('/triage');
    });

    test('resolving moves a report to the resolved tab, and reopening brings it back', async ({ maintainer: page }) => {
        const title = `Resolve me ${Date.now()}`;
        const id = await insertReport({ title });
        await page.goto(`/triage/${id}`);

        await page.getByRole('button', { name: 'Mark resolved' }).click();
        await expect(page.getByRole('status').filter({ hasText: 'Marked resolved.' })).toBeVisible();
        await expect(page.getByRole('complementary', { name: 'Details' })).toContainText('Resolved');
        expect(await (await bugs()).findOne({ bugTitle: title })).toMatchObject({ bugResolved: true });

        await page.goto('/triage?status=resolved&q=' + encodeURIComponent(title));
        await expect(page.locator('ol > li')).toHaveCount(1);

        await page.goto(`/triage/${id}`);
        await page.getByRole('button', { name: 'Reopen' }).click();
        await expect(page.getByRole('status').filter({ hasText: 'Reopened.' })).toBeVisible();
        expect(await (await bugs()).findOne({ bugTitle: title })).toMatchObject({
            bugResolved: false,
            resolvedAt: null,
        });
    });

    test('delete asks first; Escape and "Keep report" both cancel', async ({ maintainer: page }) => {
        const title = `Keep me ${Date.now()}`;
        const id = await insertReport({ title });
        await page.goto(`/triage/${id}`);

        await page.getByRole('button', { name: 'Delete report' }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole('button', { name: 'Keep report' })).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();

        await page.getByRole('button', { name: 'Delete report' }).click();
        await dialog.getByRole('button', { name: 'Keep report' }).click();
        await expect(dialog).toBeHidden();
        expect(await (await bugs()).countDocuments({ bugTitle: title })).toBe(1);
    });

    test('confirming a delete removes the report and leaves a 404', async ({ maintainer: page }) => {
        const title = `Delete me ${Date.now()}`;
        const id = await insertReport({ title });
        await page.goto(`/triage/${id}`);

        await page.getByRole('button', { name: 'Delete report' }).click();
        await page.getByRole('dialog').getByRole('button', { name: 'Delete permanently' }).click();
        const reference = `BR-${id.slice(-6).toUpperCase()}`;
        await expect(page).toHaveURL(`/triage?deleted=${reference}`);
        await expect(page.getByRole('status').filter({ hasText: `Deleted ${reference}.` })).toBeVisible();
        expect(await (await bugs()).countDocuments({ bugTitle: title })).toBe(0);

        const response = await page.goto(`/triage/${id}`);
        expect(response?.status()).toBe(404);
        await expect(page.getByRole('heading', { name: 'Not here.' })).toBeVisible();
    });

    test('a report deleted in another tab gives a clear message, not a crash', async ({ maintainer: page }) => {
        const title = `Gone elsewhere ${Date.now()}`;
        const id = await insertReport({ title });
        await page.goto(`/triage/${id}`);
        await (await bugs()).deleteOne({ bugTitle: title });

        await page.getByRole('button', { name: 'Mark resolved' }).click();
        await expect(page.getByRole('status').filter({ hasText: 'no longer exists' })).toBeVisible();
    });

    test('malformed and unknown ids are a 404', async ({ maintainer: page }) => {
        expect((await page.goto('/triage/not-an-id'))?.status()).toBe(404);
        expect((await page.goto('/triage/0123456789abcdef01234567'))?.status()).toBe(404);
    });
});
