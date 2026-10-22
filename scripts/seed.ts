/**
 * Loads sample reports for local development: `npm run db:seed`.
 *
 * Seeded documents carry `seed: true`, so a rerun replaces only them and never touches real reports. The app ignores
 * the extra field. Documents use the stored (legacy) field names that `src/features/reports/repository.ts` reads.
 * Dates are relative to now, so the queue always looks recent.
 */
import { MongoClient } from 'mongodb';

type Severity = 'high' | 'medium' | 'low';

interface Sample {
    title: string;
    description: string;
    severity: Severity;
    /** Days before now that the report was filed. */
    daysAgo: number;
    pageUrl?: string;
    version?: string;
    /** Days after filing that it was resolved; absent means still open. */
    resolvedAfter?: number;
    /** Write the shape the original Express API produced: no resolvedAt, pageUrl or version. */
    legacy?: boolean;
}

const APP = 'https://app.example.com';

const SAMPLES: Sample[] = [
    {
        title: 'Checkout fails with "card declined" for every card',
        description:
            'Since this morning every payment on checkout returns "card declined", including test cards that worked yesterday. The payment provider shows no attempts, so the request never leaves our server.\n\nSteps:\n1. Add any item to the basket\n2. Pay with 4242 4242 4242 4242\n3. See "card declined"',
        severity: 'high',
        daysAgo: 0.2,
        pageUrl: `${APP}/checkout`,
        version: '3.4.0',
    },
    {
        title: 'Password reset email never arrives',
        description:
            'Requested a reset three times over an hour. Nothing in the inbox or spam folder. Sign-up confirmation emails do arrive, so it is only the reset email.',
        severity: 'high',
        daysAgo: 0.6,
        pageUrl: `${APP}/account/reset`,
    },
    {
        title: 'Saving an invoice draft deletes its line items',
        description:
            'Created an invoice with 6 line items, clicked "Save draft", reopened it and only the header is left. Happens every time on drafts with more than 5 items.',
        severity: 'high',
        daysAgo: 1.1,
        pageUrl: `${APP}/invoices/new`,
        version: '3.4.0',
    },
    {
        title: 'Team members can see invoices from other workspaces',
        description:
            'A member of our workspace opened /invoices?workspace=2 and saw invoices belonging to a different company. Reporting privately-urgent: this looks like a data leak.',
        severity: 'high',
        daysAgo: 1.4,
        pageUrl: `${APP}/invoices`,
        version: '3.4.0',
    },
    {
        title: 'App crashes when uploading a receipt from the camera',
        description:
            'On Android, taking a photo from the "Add receipt" button closes the app immediately. Choosing an existing photo from the gallery works.',
        severity: 'high',
        daysAgo: 2,
        version: 'Android app 2.9.1, Pixel 8',
    },
    {
        title: 'Login loops back to the sign-in page in Safari',
        description:
            'Entering correct credentials in Safari returns to the sign-in page with no error. Chrome on the same Mac works. Clearing cookies did not help.',
        severity: 'high',
        daysAgo: 2.5,
        pageUrl: `${APP}/sign-in`,
        version: 'Safari 19.1, macOS',
    },
    {
        title: 'Recurring invoices were sent twice on the 1st',
        description:
            'Every customer on a monthly schedule received two identical invoices on the 1st, about 4 minutes apart. Some paid both.',
        severity: 'high',
        daysAgo: 3,
        pageUrl: `${APP}/invoices/recurring`,
        version: '3.3.2',
    },
    {
        title: 'Invoice PDF shows totals in the wrong currency',
        description:
            'The account currency is EUR, but the downloaded PDF shows $ and USD totals. The invoice on screen is correct.',
        severity: 'medium',
        daysAgo: 0.4,
        pageUrl: `${APP}/invoices/INV-2291`,
        version: '3.4.0',
    },
    {
        title: 'Export to CSV stops at 1,000 rows',
        description: 'The customer export ends at exactly 1,000 rows. We have 3,412 customers.',
        severity: 'medium',
        daysAgo: 0.9,
        pageUrl: `${APP}/customers`,
        version: '3.4.0',
    },
    {
        title: 'Date picker opens off-screen on small phones',
        description:
            'On an iPhone SE the due-date picker opens half outside the viewport and the bottom half cannot be scrolled into view.',
        severity: 'medium',
        daysAgo: 1.6,
        pageUrl: `${APP}/invoices/new`,
        version: 'Safari, iOS 19',
    },
    {
        title: 'Search returns nothing for invoice numbers with a dash',
        description: 'Searching "INV-2291" finds nothing. Searching "2291" finds the invoice.',
        severity: 'medium',
        daysAgo: 2.2,
        pageUrl: `${APP}/invoices`,
    },
    {
        title: 'Tax rate resets to 0% when duplicating an invoice',
        description:
            'Duplicate an invoice that uses 20% VAT: the copy shows the right line items but the tax rate is 0% and the total is wrong.',
        severity: 'medium',
        daysAgo: 2.9,
        pageUrl: `${APP}/invoices/INV-2302`,
        version: '3.4.0',
    },
    {
        title: 'Dashboard revenue chart ignores refunds',
        description:
            'Refunded payments still count towards revenue on the dashboard chart. The revenue report under Reports subtracts them correctly, so the two disagree.',
        severity: 'medium',
        daysAgo: 3.5,
        pageUrl: `${APP}/dashboard`,
    },
    {
        title: 'Reminder emails go out in English for French customers',
        description:
            'Customers with language set to French get payment reminders in English. The invoice email itself is in French.',
        severity: 'medium',
        daysAgo: 4,
        pageUrl: `${APP}/settings/reminders`,
        version: '3.3.2',
    },
    {
        title: 'Uploading a logo larger than 2 MB fails without a message',
        description:
            'The spinner stops and nothing happens. No error is shown. A 1.5 MB logo uploads fine, so it looks like a size limit nobody tells you about.',
        severity: 'medium',
        daysAgo: 4.6,
        pageUrl: `${APP}/settings/branding`,
    },
    {
        title: 'Keyboard focus disappears inside the customer dialog',
        description:
            'Tabbing through the "New customer" dialog, focus leaves the dialog after the Email field and goes to the page behind it. Hard to use without a mouse.',
        severity: 'medium',
        daysAgo: 5.2,
        pageUrl: `${APP}/customers`,
        version: 'Firefox 144',
    },
    {
        title: 'Overdue filter includes invoices due today',
        description: 'Invoices due today show up under "Overdue". They should only appear from tomorrow.',
        severity: 'medium',
        daysAgo: 6,
        pageUrl: `${APP}/invoices?status=overdue`,
    },
    {
        title: 'Bank sync shows the same transaction twice',
        description:
            'After reconnecting the bank feed, several transactions from last week appear twice in the reconciliation list.',
        severity: 'medium',
        daysAgo: 7,
        pageUrl: `${APP}/banking`,
        version: '3.3.2',
    },
    {
        title: 'Session expires while typing a long invoice note',
        description:
            'Spent about 40 minutes writing a note on an invoice, clicked Save and was sent to the sign-in page. The note was lost.',
        severity: 'medium',
        daysAgo: 8,
        pageUrl: `${APP}/invoices/INV-2288`,
    },
    {
        title: 'Search ignores accents',
        description: 'Searching "cafe" does not find the customer "Café Noir". Searching with the accent works.',
        severity: 'low',
        daysAgo: 0.8,
        pageUrl: `${APP}/customers`,
    },
    {
        title: 'Typo on the pricing page: "anually"',
        description: 'The third plan says "billed anually".',
        severity: 'low',
        daysAgo: 1.3,
        pageUrl: 'https://www.example.com/pricing',
    },
    {
        title: 'Sidebar icons are blurry on a 4K monitor',
        description: 'The navigation icons look soft at 200% scaling, as if they are low-resolution images.',
        severity: 'low',
        daysAgo: 2.7,
        version: 'Chrome 141, Windows 11',
    },
    {
        title: 'Footer copyright still says 2025',
        description: 'The footer on every page shows "© 2025".',
        severity: 'low',
        daysAgo: 3.2,
        pageUrl: APP,
    },
    {
        title: 'Customer list sorts "Zoë" after "Zy"',
        description: 'Names starting with accented letters sort at the end of the list instead of alphabetically.',
        severity: 'low',
        daysAgo: 4.3,
        pageUrl: `${APP}/customers`,
    },
    {
        title: 'Tooltip on the "Paid" badge is cut off',
        description: 'Hovering the Paid badge in the last table column shows a tooltip clipped by the table edge.',
        severity: 'low',
        daysAgo: 5.5,
        pageUrl: `${APP}/invoices`,
        version: 'Edge 141',
    },
    {
        title: 'Empty state says "No invoices yet" while invoices are loading',
        description:
            'On a slow connection the invoice list shows "No invoices yet" for a second before the list appears.',
        severity: 'low',
        daysAgo: 6.4,
        pageUrl: `${APP}/invoices`,
    },
    {
        title: 'Dark logo is invisible on the invoice email header',
        description: 'Our logo is dark navy and the email header is dark grey, so it can barely be seen.',
        severity: 'low',
        daysAgo: 9,
        pageUrl: `${APP}/settings/branding`,
    },
    {
        title: 'Phone numbers lose the leading plus sign',
        description: 'Saving "+44 20 7946 0000" on a customer stores "44 20 7946 0000".',
        severity: 'low',
        daysAgo: 11,
        pageUrl: `${APP}/customers/C-1043`,
    },
    {
        title: 'Settings page title says "Setings"',
        description: 'The browser tab title on the settings page is misspelled.',
        severity: 'low',
        daysAgo: 13,
        pageUrl: `${APP}/settings`,
    },
    {
        title: 'Newsletter signup button overlaps the footer',
        description: 'On narrow windows the signup button sits on top of the footer links.',
        severity: 'low',
        daysAgo: 980,
        legacy: true,
    },
    {
        title: 'Invoice numbers skip after deleting a draft',
        description:
            'Deleting a draft leaves a gap in the sequence. Accountants keep asking about the missing numbers.',
        severity: 'medium',
        daysAgo: 1000,
        legacy: true,
    },

    // Resolved
    {
        title: 'Basket empties when switching language',
        description: 'Changing the language from the footer clears the basket.',
        severity: 'high',
        daysAgo: 24,
        resolvedAfter: 1.4,
        pageUrl: APP,
        version: '3.2.0',
    },
    {
        title: 'Payments page times out for accounts with many payments',
        description: 'Accounts with more than 10,000 payments get a timeout error on the Payments page.',
        severity: 'high',
        daysAgo: 30,
        resolvedAfter: 2,
        pageUrl: `${APP}/payments`,
        version: '3.1.4',
    },
    {
        title: 'Two-factor codes rejected after the clock change',
        description: 'Authenticator codes were rejected for about an hour after the daylight saving change.',
        severity: 'high',
        daysAgo: 40,
        resolvedAfter: 0.3,
        pageUrl: `${APP}/sign-in`,
    },
    {
        title: 'Order confirmation shows the previous day',
        description: 'Invoices created after 23:00 show yesterday’s date on the confirmation screen.',
        severity: 'medium',
        daysAgo: 32,
        resolvedAfter: 5,
        pageUrl: `${APP}/invoices/new`,
        version: '3.1.4',
    },
    {
        title: 'Discount codes apply twice when the page is refreshed',
        description: 'Refreshing the checkout page after entering a discount code applies it a second time.',
        severity: 'medium',
        daysAgo: 21,
        resolvedAfter: 3,
        pageUrl: `${APP}/checkout`,
        version: '3.2.0',
    },
    {
        title: 'Credit notes missing from the yearly report',
        description: 'The yearly sales report ignores credit notes, so totals are too high.',
        severity: 'medium',
        daysAgo: 18,
        resolvedAfter: 6,
        pageUrl: `${APP}/reports/yearly`,
    },
    {
        title: 'Attachments over 5 MB fail to send with invoices',
        description: 'Attaching a 6 MB PDF to an invoice email shows "sent" but the customer never receives it.',
        severity: 'medium',
        daysAgo: 15,
        resolvedAfter: 4,
        pageUrl: `${APP}/invoices/INV-2244`,
        version: '3.3.0',
    },
    {
        title: 'Customer import breaks on semicolon-separated files',
        description: 'Importing a CSV exported from European Excel (semicolons) puts every column into the name field.',
        severity: 'medium',
        daysAgo: 12,
        resolvedAfter: 2.5,
        pageUrl: `${APP}/customers/import`,
    },
    {
        title: 'Dark product images look washed out',
        description: 'Uploaded images with dark backgrounds look grey since the image CDN change.',
        severity: 'low',
        daysAgo: 20,
        resolvedAfter: 7,
    },
    {
        title: 'Help link in the footer goes to a 404',
        description: 'The "Help" footer link opens a page that no longer exists.',
        severity: 'low',
        daysAgo: 16,
        resolvedAfter: 1,
        pageUrl: APP,
    },
    {
        title: 'Currency symbol placed after the amount for GBP',
        description: 'Amounts show as "120.00£" instead of "£120.00".',
        severity: 'low',
        daysAgo: 10,
        resolvedAfter: 2,
        pageUrl: `${APP}/invoices/INV-2260`,
    },
    {
        title: 'Print view cuts off the last line item',
        description: 'Printing an invoice with exactly 12 lines drops the 12th line onto a blank second page.',
        severity: 'low',
        daysAgo: 9.5,
        resolvedAfter: 3,
        pageUrl: `${APP}/invoices/INV-2271`,
        version: 'Chrome 141',
    },
    {
        title: 'Notification bell count never resets',
        description: 'The unread count stays at 3 after opening every notification.',
        severity: 'low',
        daysAgo: 8.5,
        resolvedAfter: 0.8,
        pageUrl: `${APP}/dashboard`,
    },
    {
        title: 'Export button label overlaps on German locale',
        description: 'The German label "Exportieren" overflows its button in the toolbar.',
        severity: 'low',
        daysAgo: 6.8,
        resolvedAfter: 1.5,
        pageUrl: `${APP}/customers`,
    },
    {
        title: 'Old form: severity radio buttons do not reset after submit',
        description: 'After sending a report the previously chosen severity stays selected.',
        severity: 'low',
        daysAgo: 1010,
        resolvedAfter: 2,
        legacy: true,
    },
];

const DAY = 24 * 60 * 60 * 1000;

function isLocal(uri: string): boolean {
    return /^mongodb:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/.test(uri);
}

async function main() {
    const uri = process.env.MONGODB_URI?.trim();
    if (!uri) throw new Error('MONGODB_URI is not set. Copy .env.example to .env.local first.');
    if (!isLocal(uri) && process.env.SEED_ALLOW_REMOTE !== '1') {
        throw new Error('MONGODB_URI is not a local database. Set SEED_ALLOW_REMOTE=1 to seed it anyway.');
    }

    const now = Date.now();
    const docs = SAMPLES.map(sample => {
        const createdAt = new Date(now - sample.daysAgo * DAY);
        const resolvedAt =
            sample.resolvedAfter === undefined ? null : new Date(createdAt.getTime() + sample.resolvedAfter * DAY);
        const base = {
            bugTitle: sample.title,
            bugDescription: sample.description,
            bugSeverity: sample.severity,
            bugResolved: resolvedAt !== null,
            createdAt,
            updatedAt: resolvedAt ?? createdAt,
            seed: true,
        };
        return sample.legacy
            ? { ...base, __v: 0 }
            : { ...base, resolvedAt, pageUrl: sample.pageUrl ?? null, version: sample.version ?? null };
    });

    const client = await MongoClient.connect(uri, { serverSelectionTimeoutMS: 5000 });
    try {
        const db = client.db(process.env.MONGODB_DB?.trim() || undefined);
        const bugs = db.collection('bugs');
        const removed = await bugs.deleteMany({ seed: true });
        await bugs.insertMany(docs);
        const open = docs.filter(doc => !doc.bugResolved).length;
        console.log(
            `Seeded ${docs.length} reports (${open} open, ${docs.length - open} resolved) into ${db.databaseName}.bugs` +
                (removed.deletedCount ? `, replacing ${removed.deletedCount} earlier sample reports.` : '.')
        );
    } finally {
        await client.close();
    }
}

main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
