'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * A status message that takes focus when it first renders. Screen readers often skip a live region that arrives
 * already filled, so focusing it makes sure the message is read.
 */
export function FocusOnArrival({ className, children }: { className?: string; children: ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => ref.current?.focus(), []);
    return (
        <div ref={ref} className={className} role="status" tabIndex={-1}>
            {children}
        </div>
    );
}
