import { networkOf } from './rate-limit';

describe('networkOf', () => {
    it('keeps IPv4 addresses whole', () => {
        expect(networkOf('203.0.113.7')).toBe('203.0.113.7');
    });

    it.each([
        ['2001:db8:85a3:1234:8a2e:370:7334:1', '2001:db8:85a3:1234::/64'],
        ['2001:db8:85a3:1234::1', '2001:db8:85a3:1234::/64'],
        ['2001:db8::1', '2001:db8:0:0::/64'],
        ['::1', '0:0:0:0::/64'],
    ])('groups %s into %s', (ip, network) => {
        expect(networkOf(ip)).toBe(network);
    });

    it('puts addresses in the same /64 together', () => {
        expect(networkOf('2001:db8:1:2:aaaa::1')).toBe(networkOf('2001:db8:1:2:bbbb:cccc:dddd:eeee'));
    });
});
