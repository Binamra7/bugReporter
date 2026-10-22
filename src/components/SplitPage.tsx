import type { ReactNode } from 'react';
import { Wordmark } from './Wordmark';
import styles from './SplitPage.module.css';

/** The field column (identity, intro) beside the paper column (the task). Stacks below 960px. */
export function SplitPage({ field, children }: { field: ReactNode; children: ReactNode }) {
    return (
        <div className={styles.page}>
            <header className={styles.field}>
                <Wordmark />
                {field}
            </header>
            <main id="main" className={styles.main}>
                {children}
            </main>
        </div>
    );
}

export function FieldIntro({ id, title, lead }: { id: string; title: string; lead: ReactNode }) {
    return (
        <div className={styles.intro}>
            <h1 id={id} className={styles.display}>
                {title}
            </h1>
            <p className={styles.lead}>{lead}</p>
        </div>
    );
}

/** Pinned to the bottom of the field column on wide screens. */
export function FieldFooter({ children }: { children: ReactNode }) {
    return <div className={styles.footer}>{children}</div>;
}

export const splitStyles = styles;
