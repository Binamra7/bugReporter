// Pinned to UTC: these render on the server, which runs in UTC on Vercel, and must not shift during hydration.
const dateFormat = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
});
const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
});

export function formatDate(date: Date): string {
    return dateFormat.format(date);
}

export function formatDateTime(date: Date): string {
    return dateTimeFormat.format(date);
}
