import { defineConfig, devices } from '@playwright/test';

const PORT = 3210;

/**
 * End-to-end tests run against a production build and a real MongoDB, using the isolated `bug-reporter-e2e`
 * database, which global setup resets and seeds. Tests share that database, so they run one at a time.
 */
export const E2E_ENV = {
    MONGODB_URI: process.env.E2E_MONGODB_URI ?? 'mongodb://localhost:27017',
    MONGODB_DB: 'bug-reporter-e2e',
    ADMIN_PASSWORD: 'e2e-maintainer-password',
    SESSION_SECRET: 'e2e-session-secret-at-least-32-characters-long',
    GUEST_ACCESS: 'on',
};

export default defineConfig({
    testDir: './e2e',
    globalSetup: './e2e/global-setup.ts',
    fullyParallel: false,
    workers: 1,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
    use: {
        baseURL: `http://localhost:${PORT}`,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'desktop',
            use: { ...devices['Desktop Chrome'], channel: process.env.CI ? undefined : 'chrome' },
        },
        {
            name: 'phone',
            use: { ...devices['Pixel 7'], channel: process.env.CI ? undefined : 'chrome' },
            testMatch: /responsive\.spec\.ts/,
        },
    ],
    webServer: {
        command: `npm run build && npx next start -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        timeout: 180_000,
        reuseExistingServer: false,
        env: E2E_ENV,
    },
});
