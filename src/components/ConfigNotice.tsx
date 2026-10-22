import type { ConfigError } from '@/lib/env';

/** Shown to maintainers when a deployment is missing configuration, so the fix is obvious from the page. */
export function ConfigNotice({ error, area }: { error: ConfigError; area: string }) {
    return (
        <div className="notice" data-tone="error" role="alert">
            <p className="notice-title">{area} isn’t configured on this deployment.</p>
            <p>
                {error.message} Add it to the environment (<code>.env.local</code> locally, or the Vercel project
                settings) and redeploy. See <code>.env.example</code> for every variable.
            </p>
        </div>
    );
}
