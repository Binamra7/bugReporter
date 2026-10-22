import '@fontsource-variable/schibsted-grotesk';
import '@fontsource-variable/jetbrains-mono';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
    title: { default: 'Report a bug · BugReporter', template: '%s · BugReporter' },
    description: 'Report a bug in a few fields. Maintainers triage every report by severity.',
};

export const viewport: Viewport = {
    themeColor: '#ff8547',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body>
                <a className="skip-link" href="#main">
                    Skip to content
                </a>
                {children}
            </body>
        </html>
    );
}
