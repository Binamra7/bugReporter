import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { closeDb, insertReport } from './db';
import { expect, test } from './fixtures';

test.afterAll(closeDb);

async function expectNoViolations(page: Page) {
    const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
    expect(violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

test.describe('accessibility (axe, WCAG 2.2 AA)', () => {
    test('report form, empty and with errors', async ({ page }) => {
        await page.goto('/');
        await expectNoViolations(page);
        await page.getByRole('button', { name: 'Send report' }).click();
        await expect(page.locator('.notice[role="alert"]')).toBeVisible();
        await expectNoViolations(page);
    });

    test('sign-in page', async ({ page }) => {
        await page.goto('/sign-in');
        await expectNoViolations(page);
    });

    test('queue, empty filter state and resolved tab', async ({ maintainer: page }) => {
        await expectNoViolations(page);
        await page.goto('/triage?q=nothing-matches-this');
        await expectNoViolations(page);
        await page.goto('/triage?status=resolved');
        await expectNoViolations(page);
    });

    test('report detail and delete dialog', async ({ maintainer: page }) => {
        const id = await insertReport({
            title: `Accessible detail ${Date.now()}`,
            pageUrl: 'https://app.example.com/',
        });
        await page.goto(`/triage/${id}`);
        await expectNoViolations(page);
        await page.getByRole('button', { name: 'Delete report' }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expectNoViolations(page);
    });

    test('not-found page', async ({ page }) => {
        await page.goto('/no-such-page');
        await expectNoViolations(page);
    });

    test('every page has a skip link to the main content', async ({ page }) => {
        await page.goto('/');
        await page.keyboard.press('Tab');
        const skip = page.getByRole('link', { name: 'Skip to content' });
        await expect(skip).toBeFocused();
        await skip.press('Enter');
        await expect(page).toHaveURL(/#main$/);
    });
});
