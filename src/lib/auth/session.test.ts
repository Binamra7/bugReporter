import { safeReturnPath } from './session';

describe('safeReturnPath', () => {
    it.each(['/triage', '/triage?status=resolved', '/triage/6ad98c8948046d09951e23bb'])('allows %s', path => {
        expect(safeReturnPath(path)).toBe(path);
    });

    it.each(['https://evil.example', '//evil.example/triage', '/triageevil', '/', '/sign-in', undefined, ['/triage']])(
        'falls back to the queue for %j',
        path => {
            expect(safeReturnPath(path)).toBe('/triage');
        }
    );
});
