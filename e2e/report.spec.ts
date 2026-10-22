import { bugs, closeDb } from './db';
import { expect, test } from './fixtures';

test.afterAll(closeDb);

test.describe('reporting a bug', () => {
    test('an empty submission lists every problem and focuses the summary', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: 'Send report' }).click();

        const summary = page.locator('.notice[role="alert"]');
        await expect(summary).toBeFocused();
        await expect(summary).toContainText('Some fields need attention');
        await expect(summary.getByRole('link')).toHaveText([
            'Give the bug a short title, at least 3 characters.',
            'Describe what happened in at least 10 characters.',
            'Choose how severe the bug is.',
        ]);
        await expect(page.getByLabel('Title')).toHaveAttribute('aria-invalid', 'true');

        await summary.getByRole('link', { name: /short title/ }).click();
        await expect(page).toHaveURL(/#title$/);
    });

    test('fixing errors keeps what was typed, then saves the report', async ({ page }) => {
        const title = `Totals round down on invoices ${Date.now()}`;
        await page.goto('/');
        await page.getByLabel('Title').fill(title);
        await page.getByLabel('What happened?').fill('too short');
        await page.getByLabel('Page address').fill('javascript:alert(1)');
        await page.getByRole('button', { name: 'Send report' }).click();

        await expect(
            page.getByText('Enter a full web address starting with http:// or https://.').first()
        ).toBeVisible();
        await expect(page.getByLabel('Title')).toHaveValue(title);
        await expect(page.getByLabel('Page address')).toHaveValue('javascript:alert(1)');

        await page
            .getByLabel('What happened?')
            .fill('An invoice for 10.005 EUR shows a total of 10.00 instead of 10.01.');
        await page.getByLabel('Page address').fill('https://app.example.com/invoices/INV-9');
        await page.getByLabel('Version').fill('3.4.0');
        await page.getByRole('radio', { name: /Medium/ }).check();
        await page.getByRole('button', { name: 'Send report' }).click();

        const received = page.getByRole('region', { name: 'Report received' });
        await expect(received).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Report received' })).toBeFocused();
        const reference = (await received.locator('.mono').first().innerText()).trim();
        expect(reference).toMatch(/^BR-[0-9A-F]{6}$/);

        const stored = await (await bugs()).findOne({ bugTitle: title });
        expect(stored).toMatchObject({
            bugSeverity: 'medium',
            bugResolved: false,
            pageUrl: 'https://app.example.com/invoices/INV-9',
            version: '3.4.0',
        });
        expect(stored!._id.toHexString().slice(-6).toUpperCase()).toBe(reference.slice(3));

        await page.getByRole('button', { name: 'Report another bug' }).click();
        await expect(page.getByLabel('Title')).toHaveValue('');
        await expect(page.getByRole('radio', { name: /Medium/ })).not.toBeChecked();
    });

    test('works with the keyboard alone', async ({ page }) => {
        const title = `Keyboard-only report ${Date.now()}`;
        await page.goto('/');
        await page.getByLabel('Title').focus();
        await page.keyboard.type(title);
        await page.keyboard.press('Tab');
        await page.keyboard.type('Filed without touching the mouse, to check focus order.');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Space');
        await expect(page.getByRole('radio', { name: /High/ })).toBeChecked();
        await page.keyboard.press('ArrowDown');
        await expect(page.getByRole('radio', { name: /Medium/ })).toBeChecked();
        await page.getByLabel('Version').focus();
        await page.keyboard.press('Enter');

        await expect(page.getByRole('heading', { name: 'Report received' })).toBeVisible();
        expect(await (await bugs()).countDocuments({ bugTitle: title, bugSeverity: 'medium' })).toBe(1);
    });

    test('a filled honeypot is refused and nothing is stored', async ({ page }) => {
        const title = `Bot submission ${Date.now()}`;
        await page.goto('/');
        await page.getByLabel('Title').fill(title);
        await page.getByLabel('What happened?').fill('Automated text that fills every field it can find.');
        await page.getByRole('radio', { name: /Low/ }).check();
        await page.locator('input[name="fax_number"]').evaluate((input: HTMLInputElement) => (input.value = '555'));
        await page.getByRole('button', { name: 'Send report' }).click();

        await expect(page.getByText('This report couldn’t be accepted.')).toBeVisible();
        expect(await (await bugs()).countDocuments({ bugTitle: title })).toBe(0);
    });

    test('links maintainers to the triage queue', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('link', { name: /open the triage queue/ }).click();
        await expect(page).toHaveURL(/\/sign-in\?next=%2Ftriage$/);
    });
});
