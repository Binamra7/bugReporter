import { createToken, passwordMatches, verifyToken } from './token';

const secret = 's'.repeat(32);
const password = 'correct horse battery staple';
const now = new Date('2026-10-22T12:00:00Z');
const later = new Date('2026-10-23T12:00:00Z');

describe('session tokens', () => {
    it('verifies a token it signed until it expires', () => {
        const token = createToken(later, secret, password);
        expect(verifyToken(token, secret, password, now)).toBe(true);
        expect(verifyToken(token, secret, password, later)).toBe(false);
    });

    it('rejects a token signed with another secret', () => {
        expect(verifyToken(createToken(later, 'x'.repeat(32), password), secret, password, now)).toBe(false);
    });

    it('rejects every token once the password changes', () => {
        expect(verifyToken(createToken(later, secret, password), secret, 'new password', now)).toBe(false);
    });

    it('rejects a token whose expiry was edited', () => {
        const [version, , sig] = createToken(later, secret, password).split('.');
        const extended = `${version}.${later.getTime() + 86_400_000}.${sig}`;
        expect(verifyToken(extended, secret, password, now)).toBe(false);
    });

    it.each(['', 'v1', 'v1.abc.sig', 'v2.1.sig', 'v1.1.sig.extra'])('rejects malformed token %j', token => {
        expect(verifyToken(token, secret, password, now)).toBe(false);
    });
});

describe('passwordMatches', () => {
    it('matches only the exact password', () => {
        expect(passwordMatches(password, password)).toBe(true);
        expect(passwordMatches(`${password} `, password)).toBe(false);
        expect(passwordMatches('', password)).toBe(false);
    });
});
