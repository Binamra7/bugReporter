import { createToken } from './token';
import { requireMaintainer, requireViewer, safeReturnPath } from './session';

const jar = new Map<string, string>();
vi.mock('next/headers', () => ({
    cookies: async () => ({ get: (name: string) => (jar.has(name) ? { value: jar.get(name) } : undefined) }),
}));
vi.mock('next/navigation', () => ({
    redirect: (url: string) => {
        throw new Error(`redirect:${url}`);
    },
}));
// The real `cache` memoises per React request; tests call the guards outside one.
vi.mock('react', async importOriginal => ({ ...(await importOriginal<object>()), cache: <T>(fn: T) => fn }));

const env = { ADMIN_PASSWORD: 'a-long-test-password', SESSION_SECRET: 'x'.repeat(40) };

function signInAs(role: 'maintainer' | 'guest') {
    jar.set(
        'bugreporter_session',
        createToken(role, new Date(Date.now() + 60_000), env.SESSION_SECRET, env.ADMIN_PASSWORD)
    );
}

beforeEach(() => {
    jar.clear();
    vi.unstubAllEnvs();
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
    vi.stubEnv('GUEST_ACCESS', 'on');
});

describe('access guards', () => {
    it('let a maintainer read and write', async () => {
        signInAs('maintainer');
        await expect(requireViewer()).resolves.toBe('maintainer');
        await expect(requireMaintainer()).resolves.toBeUndefined();
    });

    it('let a guest read but never write', async () => {
        signInAs('guest');
        await expect(requireViewer()).resolves.toBe('guest');
        await expect(requireMaintainer('/triage/abc')).rejects.toThrow('redirect:/sign-in?next=%2Ftriage%2Fabc');
    });

    it('stop honouring guest sessions when guest access is turned off', async () => {
        signInAs('guest');
        vi.stubEnv('GUEST_ACCESS', '');
        await expect(requireViewer()).rejects.toThrow('redirect:/sign-in');
    });

    it('send strangers to sign-in', async () => {
        await expect(requireViewer('/triage?q=x')).rejects.toThrow('redirect:/sign-in?next=%2Ftriage%3Fq%3Dx');
    });

    it('treat missing configuration as signed out rather than crashing', async () => {
        signInAs('maintainer');
        vi.stubEnv('ADMIN_PASSWORD', '');
        await expect(requireMaintainer()).rejects.toThrow('redirect:/sign-in');
    });

    it('reject a password shorter than the minimum', async () => {
        vi.stubEnv('ADMIN_PASSWORD', 'short');
        signInAs('maintainer');
        await expect(requireViewer()).rejects.toThrow('redirect:/sign-in');
    });
});

describe('safeReturnPath', () => {
    it.each(['/triage', '/triage?status=resolved', '/triage/6ad98c8948046d09951e23bb'])('allows %s', path => {
        expect(safeReturnPath(path)).toBe(path);
    });

    it.each([
        'https://evil.example',
        '//evil.example/triage',
        '/triage/..//evil.example',
        '/triage/%2e%2e//evil.example',
        '/triage/../sign-in',
        '/\\evil.example',
        '/triage\\..\\..\\evil.example',
        '/triageevil',
        '/',
        '/sign-in',
        undefined,
        ['/triage'],
    ])('falls back to the queue for %j', path => {
        expect(safeReturnPath(path)).toBe('/triage');
    });
});
