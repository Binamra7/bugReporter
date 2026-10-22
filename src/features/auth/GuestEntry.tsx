import { signInAsGuest } from './actions';
import styles from './SignInForm.module.css';

/** Read-only access for people browsing a public demo; only rendered when GUEST_ACCESS is on. */
export function GuestEntry({ returnTo }: { returnTo: string }) {
    return (
        <form action={signInAsGuest} className={styles.guest} aria-labelledby="guest-heading">
            <h2 id="guest-heading" className={styles.heading}>
                Just looking?
            </h2>
            <p className={styles.note}>
                Browse the queue and every report as a guest. Guests can read everything but can’t resolve or delete.
            </p>
            <input type="hidden" name="next" value={returnTo} />
            <div>
                <button type="submit" className="button">
                    Look around as a guest
                </button>
            </div>
        </form>
    );
}
