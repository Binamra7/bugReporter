import { bugs, closeDb, insertReport } from './db';
import { expect, test } from './fixtures';

test.afterAll(closeDb);

const rows = (page: import('@playwright/test').Page) => page.locator('ol > li');

test.describe('triage queue', () => {
    test('shows live counts that match the database', async ({ maintainer: page }) => {
        const collection = await bugs();
        const open = await collection.countDocuments({ bugResolved: { $ne: true } });
        const resolved = await collection.countDocuments({ bugResolved: true });

        await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${open} open reports`);
        await expect(page.getByRole('link', { name: `Open ${open}` })).toHaveAttribute('aria-current', 'page');
        await expect(page.getByRole('link', { name: `Resolved ${resolved}` })).toBeVisible();
        await expect(rows(page)).toHaveCount(open);
    });

    test('lists open reports highest severity first', async ({ maintainer: page }) => {
        const severities = await rows(page)
            .locator('[data-severity]')
            .evaluateAll(nodes => nodes.map(node => node.getAttribute('data-severity')));
        const rank = { high: 0, medium: 1, low: 2 } as Record<string, number>;
        const ranks = severities.map(s => rank[s!]);
        expect(ranks).toEqual([...ranks].sort((a, b) => a! - b!));
        expect(new Set(severities)).toEqual(new Set(['high', 'medium', 'low']));
    });

    test('searches titles and descriptions and says how many match', async ({ maintainer: page }) => {
        await page.getByLabel('Search').fill('invoice');
        await page.getByRole('button', { name: 'Apply' }).click();
        await expect(page).toHaveURL(/q=invoice/);

        const count = await rows(page).count();
        expect(count).toBeGreaterThan(3);
        await expect(page.getByText(new RegExp(`^${count} of \\d+ open reports match “invoice”`))).toBeVisible();
        for (const text of await rows(page).allInnerTexts()) expect(text.toLowerCase()).toContain('invoice');
    });

    test('treats search text literally', async ({ maintainer: page }) => {
        await insertReport({ title: 'Total shows $(amount) placeholder' });
        await page.goto('/triage?q=' + encodeURIComponent('$(amount)'));
        await expect(rows(page)).toHaveCount(1);
        await expect(rows(page).first()).toContainText('Total shows $(amount) placeholder');
    });

    test('filters by severity, shows an empty state and clears filters', async ({ maintainer: page }) => {
        await page.getByLabel('Severity').selectOption('high');
        await page.getByRole('button', { name: 'Apply' }).click();
        await expect(rows(page).locator('[data-severity="high"]')).toHaveCount(await rows(page).count());

        await page.getByLabel('Search').fill('no report contains this phrase');
        await page.getByRole('button', { name: 'Apply' }).click();
        await expect(page.getByText('No open reports match these filters.')).toBeVisible();
        await expect(rows(page)).toHaveCount(0);

        await page.getByRole('link', { name: 'Clear filters' }).first().click();
        await expect(page).toHaveURL('/triage');
        await expect(page.getByLabel('Severity')).toHaveValue('');
    });

    test('sorts oldest first, including reports from the legacy app', async ({ maintainer: page }) => {
        await page.getByLabel('Sort by').selectOption('oldest');
        await page.getByRole('button', { name: 'Apply' }).click();
        await expect(rows(page).first()).toContainText('Invoice numbers skip after deleting a draft');
        await expect(rows(page).first()).toContainText('Reported');
    });

    test('the resolved tab sorts by resolution date and keeps the search', async ({ maintainer: page }) => {
        await page.goto('/triage?q=the');
        await page.getByRole('link', { name: /^Resolved/ }).click();
        await expect(page).toHaveURL('/triage?status=resolved&q=the');
        await expect(page.getByLabel('Sort by')).toHaveValue('resolved');
        await expect(page.getByLabel('Sort by').locator('option')).toHaveText([
            'Recently resolved',
            'Severity, highest first',
            'Newest reported',
            'Oldest reported',
        ]);

        const dates = await rows(page)
            .locator('time')
            .evaluateAll(nodes => nodes.map(node => node.getAttribute('datetime')!));
        expect(dates).toEqual([...dates].sort().reverse());
    });

    test('a bookmarked URL restores the view, and unknown values fall back', async ({ maintainer: page }) => {
        await page.goto('/triage?status=resolved&severity=low&sort=oldest');
        await expect(page.getByLabel('Severity')).toHaveValue('low');
        await expect(page.getByLabel('Sort by')).toHaveValue('oldest');

        await page.goto('/triage?status=bogus&severity=urgent&sort=random');
        await expect(page.getByRole('link', { name: /^Open/ })).toHaveAttribute('aria-current', 'page');
        await expect(page.getByLabel('Severity')).toHaveValue('');
        await expect(page.getByLabel('Sort by')).toHaveValue('severity');
    });

    test('the deleted notice only echoes well-formed references', async ({ maintainer: page }) => {
        await page.goto('/triage?deleted=BR-ABC123');
        await expect(page.getByRole('status').filter({ hasText: 'Deleted BR-ABC123.' })).toBeVisible();
        await page.goto('/triage?deleted=Your+account+is+suspended');
        await expect(page.getByText('suspended')).toHaveCount(0);
    });
});
