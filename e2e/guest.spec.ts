import { E2E_ENV } from '../playwright.config';
import { closeDb, insertReport } from './db';
import { expect, test } from './fixtures';

test.afterAll(closeDb);

test.describe('guest access (GUEST_ACCESS=on)', () => {
    test('a guest can browse the queue and reports but not change them', async ({ page }) => {
        const id = await insertReport({ title: `Guest can read ${Date.now()}` });
        await page.goto(`/triage/${id}`);
        await expect(page).toHaveURL(/\/sign-in\?next=/);

        await page.getByRole('button', { name: 'Look around as a guest' }).click();
        await expect(page).toHaveURL(`/triage/${id}`);
        await expect(page.getByText('Guest, read-only')).toBeVisible();
        await expect(
            page.getByText('You’re browsing as a guest, so resolving and deleting are turned off.')
        ).toBeVisible();
        await expect(page.getByRole('button', { name: 'Mark resolved' })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Delete report' })).toHaveCount(0);

        await page.getByRole('link', { name: 'Queue', exact: true }).click();
        await expect(page.getByRole('heading', { level: 1 })).toContainText('open reports');
        await expect(page.locator('ol > li').first()).toBeVisible();
    });

    test('leaving the guest view ends the session', async ({ page }) => {
        await page.goto('/sign-in');
        await page.getByRole('button', { name: 'Look around as a guest' }).click();
        await expect(page).toHaveURL('/triage');
        await page.getByRole('button', { name: 'Leave' }).click();
        await expect(page).toHaveURL('/sign-in');
        await page.goto('/triage');
        await expect(page).toHaveURL(/\/sign-in\?next=/);
    });

    test('a guest can still sign in as a maintainer', async ({ page }) => {
        await page.goto('/sign-in');
        await page.getByRole('button', { name: 'Look around as a guest' }).click();
        await expect(page).toHaveURL('/triage');

        await page.goto('/sign-in');
        await expect(page.getByText('You’re browsing as a guest.')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Look around as a guest' })).toHaveCount(0);
        await page.getByLabel('Password').fill(E2E_ENV.ADMIN_PASSWORD);
        await page.getByRole('button', { name: 'Sign in' }).click();
        await expect(page).toHaveURL('/triage');
        await expect(page.getByText('Guest, read-only')).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
    });
});
