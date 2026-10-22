import { createToken, passwordMatches, verifyToken } from './token';

const secret = 's'.repeat(32);
const password = 'correct horse battery staple';
const now = new Date('2026-10-22T12:00:00Z');
const later = new Date('2026-10-23T12:00:00Z');

describe('session tokens', () => {
    it.each(['maintainer', 'guest'] as const)('returns the %s role until the token expires', role => {
        const token = createToken(role, later, secret, password);
        expect(verifyToken(token, secret, password, now)).toBe(role);
        expect(verifyToken(token, secret, password, later)).toBeNull();
    });

    it('rejects a token signed with another secret', () => {
        expect(
            verifyToken(createToken('maintainer', later, 'x'.repeat(32), password), secret, password, now)
        ).toBeNull();
    });

    it('rejects every token once the password changes', () => {
        expect(verifyToken(createToken('maintainer', later, secret, password), secret, 'new password', now)).toBeNull();
    });

    it('rejects a token whose expiry or role was edited', () => {
        const [version, role, , sig] = createToken('guest', later, secret, password).split('.');
        expect(
            verifyToken(`${version}.${role}.${later.getTime() + 86_400_000}.${sig}`, secret, password, now)
        ).toBeNull();
        expect(verifyToken(`${version}.maintainer.${later.getTime()}.${sig}`, secret, password, now)).toBeNull();
    });

    it.each(['', 'v2', 'v2.admin.1.sig', 'v2.guest.abc.sig', 'v1.1.sig', 'v2.guest.1.sig.extra'])(
        'rejects malformed token %j',
        token => {
            expect(verifyToken(token, secret, password, now)).toBeNull();
        }
    );
});

describe('passwordMatches', () => {
    it('matches only the exact password', () => {
        expect(passwordMatches(password, password)).toBe(true);
        expect(passwordMatches(`${password} `, password)).toBe(false);
        expect(passwordMatches('', password)).toBe(false);
    });
});
