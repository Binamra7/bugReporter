import { test as base, expect, type Page } from '@playwright/test';
import { E2E_ENV } from '../playwright.config';

export async function signIn(page: Page, path = '/triage') {
    await page.goto(path);
    await expect(page).toHaveURL(/\/sign-in/);
    await page.getByLabel('Password').fill(E2E_ENV.ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).not.toHaveURL(/\/sign-in/);
}

/** A page that is already signed in as a maintainer. */
export const test = base.extend<{ maintainer: Page }>({
    maintainer: async ({ page }, use) => {
        await signIn(page);
        await use(page);
    },
});

export { expect };
