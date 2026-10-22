import { SEVERITY, type Severity } from '../model';
import styles from './SeverityScale.module.css';

/**
 * Severity as three cells filled from the left, next to its word. The cells repeat the word for sighted readers,
 * so they are hidden from assistive technology; the word is always in the accessible text.
 */
export function SeverityScale({ severity }: { severity: Severity }) {
    const { level, label: word } = SEVERITY[severity];
    return (
        <span className={styles.scale} data-severity={severity}>
            <span className={styles.cells} aria-hidden="true">
                {[1, 2, 3].map(cell => (
                    <span key={cell} className={styles.cell} data-filled={cell <= level} />
                ))}
            </span>
            <span className={styles.word}>{word}</span>
        </span>
    );
}
