import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
    ...nextVitals,
    ...nextTs,
    // Playwright fixtures call a `use` callback that the React hooks rule mistakes for React's `use`.
    { files: ['e2e/**'], rules: { 'react-hooks/rules-of-hooks': 'off' } },
    globalIgnores(['.next/**', 'coverage/**', 'next-env.d.ts', 'playwright-report/**', 'test-results/**']),
]);
