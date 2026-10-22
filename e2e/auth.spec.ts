import { E2E_ENV } from '../playwright.config';
import { closeDb, insertReport } from './db';
import { expect, signIn, test } from './fixtures';

test.afterAll(closeDb);

test.describe('maintainer access', () => {
    test('triage pages redirect to sign-in and return to the requested view', async ({ page }) => {
        await page.goto('/triage?severity=high&q=checkout');
        await expect(page).toHaveURL('/sign-in?next=%2Ftriage%3Fseverity%3Dhigh%26q%3Dcheckout');

        await page.getByLabel('Password').fill('not the password');
        await page.getByRole('button', { name: 'Sign in' }).click();
        await expect(page.getByRole('alert').filter({ hasText: 'That password isn’t right.' })).toBeVisible();
        await expect(page.getByLabel('Password')).toHaveAttribute('aria-invalid', 'true');

        await page.getByLabel('Password').fill(E2E_ENV.ADMIN_PASSWORD);
        await page.getByRole('button', { name: 'Sign in' }).click();
        await expect(page).toHaveURL('/triage?severity=high&q=checkout');
        await expect(page.getByLabel('Search')).toHaveValue('checkout');
    });

    test('report pages are protected too', async ({ page }) => {
        const id = await insertReport({ title: `Protected report ${Date.now()}` });
        const response = await page.request.get(`/triage/${id}`, { maxRedirects: 0 });
        expect(response.status()).toBe(307);
        expect(response.headers().location).toBe(`/sign-in?next=%2Ftriage%2F${id}`);
    });

    test('sign-in never redirects off the site', async ({ page }) => {
        await page.goto('/sign-in?next=https://evil.example/triage');
        await page.getByLabel('Password').fill(E2E_ENV.ADMIN_PASSWORD);
        await page.getByRole('button', { name: 'Sign in' }).click();
        await expect(page).toHaveURL('/triage');
    });

    test('a forged or tampered session cookie is rejected', async ({ page, context, baseURL }) => {
        await context.addCookies([
            { name: 'bugreporter_session', value: `v1.${Date.now() + 86_400_000}.forged`, url: baseURL! },
        ]);
        await page.goto('/triage');
        await expect(page).toHaveURL(/\/sign-in/);
    });

    test('the session cookie is httpOnly and SameSite=Lax', async ({ page, context }) => {
        await signIn(page);
        const cookie = (await context.cookies()).find(c => c.name === 'bugreporter_session');
        expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'Lax' });
    });

    test('signing out ends the session', async ({ page }) => {
        await signIn(page);
        await page.getByRole('button', { name: 'Sign out' }).click();
        await expect(page).toHaveURL('/sign-in');
        await page.goto('/triage');
        await expect(page).toHaveURL(/\/sign-in\?next=/);
    });

    test('a signed-in maintainer visiting sign-in goes straight to the queue', async ({ page }) => {
        await signIn(page);
        await page.goto('/sign-in');
        await expect(page).toHaveURL('/triage');
    });
});
