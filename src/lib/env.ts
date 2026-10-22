import 'server-only';

/** A required environment variable is missing or malformed. The message is safe to show a maintainer. */
export class ConfigError extends Error {
    constructor(
        readonly variable: string,
        message: string
    ) {
        super(message);
        this.name = 'ConfigError';
    }
}

// Read at call time, not import time, so `next build` succeeds without runtime secrets.
function required(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) throw new ConfigError(name, `${name} is not set.`);
    return value;
}

export function getDatabaseConfig() {
    return {
        uri: required('MONGODB_URI'),
        // Undefined means "the database named in the URI", which is what the legacy Express API relied on.
        dbName: process.env.MONGODB_DB?.trim() || undefined,
    };
}

export const MIN_PASSWORD_LENGTH = 12;

export function getAuthConfig() {
    const password = required('ADMIN_PASSWORD');
    const secret = required('SESSION_SECRET');
    if (password.length < MIN_PASSWORD_LENGTH) {
        throw new ConfigError('ADMIN_PASSWORD', `ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }
    if (secret.length < 32) throw new ConfigError('SESSION_SECRET', 'SESSION_SECRET must be at least 32 characters.');
    // Opt-in read-only access to triage, for public demos. Off unless explicitly "on".
    const guestAccess = process.env.GUEST_ACCESS?.trim().toLowerCase() === 'on';
    return { password, secret, guestAccess };
}
