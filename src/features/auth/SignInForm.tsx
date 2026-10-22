'use client';

import { useActionState } from 'react';
import { signIn, type SignInState } from './actions';
import styles from './SignInForm.module.css';

export function SignInForm({ returnTo }: { returnTo: string }) {
    const [state, formAction, pending] = useActionState<SignInState, FormData>(signIn, { error: null });

    return (
        <form
            action={formAction}
            onSubmit={event => pending && event.preventDefault()}
            className={styles.form}
            aria-labelledby="sign-in-form-heading"
        >
            <h2 id="sign-in-form-heading" className={styles.heading}>
                Maintainer sign-in
            </h2>
            <input type="hidden" name="next" value={returnTo} />
            <div className="field">
                <label htmlFor="password" className="field-label">
                    Password
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    className="input"
                    autoComplete="current-password"
                    required
                    aria-invalid={state.error ? true : undefined}
                    aria-describedby={state.error ? 'password-error' : undefined}
                />
                {state.error && (
                    <p id="password-error" className="field-error" role="alert">
                        {state.error}
                    </p>
                )}
            </div>
            <div>
                <button className="button" data-variant="primary" type="submit" aria-disabled={pending}>
                    {pending ? 'Signing in…' : 'Sign in'}
                </button>
            </div>
        </form>
    );
}
