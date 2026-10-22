import { formatDate, formatDateTime } from '@/lib/format';

export function Timestamp({ date, precise = false }: { date: Date; precise?: boolean }) {
    return (
        <time dateTime={date.toISOString()} title={formatDateTime(date)}>
            {precise ? formatDateTime(date) : formatDate(date)}
        </time>
    );
}
