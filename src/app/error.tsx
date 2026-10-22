'use client';

import { FieldIntro, SplitPage } from '@/components/SplitPage';

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <SplitPage
            field={
                <FieldIntro
                    id="error-heading"
                    title="Something broke."
                    lead="This page hit an error on our side. Nothing you entered has been sent."
                />
            }
        >
            <button type="button" className="button" data-variant="primary" onClick={reset}>
                Try again
            </button>
        </SplitPage>
    );
}
