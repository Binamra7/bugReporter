import Link from 'next/link';
import { TagMark } from './TagMark';
import styles from './Wordmark.module.css';

export function Wordmark({ href = '/', suffix }: { href?: string; suffix?: string }) {
    return (
        <Link href={href} className={styles.wordmark}>
            <TagMark />
            <span>
                BugReporter
                {suffix && <span className={styles.suffix}> {suffix}</span>}
            </span>
        </Link>
    );
}
