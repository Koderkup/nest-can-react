import React, { FormEvent, useState } from 'react';
import { useCommit } from '../../core/client/use-commit';
import { authHeaders, useAuth } from '../hooks/use-auth';
import type { AuthTokenResponse } from '../auth.types';

export function AuthPanel() {
  const { user, token, loading, error, setSession, clearSession } = useAuth();
  const registerCommit = useCommit<AuthTokenResponse>('/auth/register', {
    revalidate: false,
  });
  const loginCommit = useCommit<AuthTokenResponse>('/auth/login', {
    revalidate: false,
  });
  const logoutCommit = useCommit<{ ok: true }>('/auth/logout', {
    revalidate: false,
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const pending =
    registerCommit.pending || loginCommit.pending || logoutCommit.pending;

  async function submitRegister() {
    try {
      const result = await registerCommit.commit({ email, password });
      if (result) {
        setSession(result.accessToken, result.user);
      }
    } catch {
      // useCommit already stores the error
    }
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const result = await loginCommit.commit({ email, password });
      if (result) {
        setSession(result.accessToken, result.user);
      }
    } catch {
      // useCommit already stores the error
    }
  }

  async function submitLogout() {
    if (!token) {
      clearSession();
      return;
    }

    try {
      await fetch('/auth/logout', {
        method: 'POST',
        headers: authHeaders(token),
      });
    } catch {
      // still clear local session
    } finally {
      clearSession();
    }
  }

  const formError =
    registerCommit.error?.message ??
    loginCommit.error?.message ??
    logoutCommit.error?.message ??
    error?.message;

  if (loading) {
    return (
      <section className="island-card">
        <span className="pill">JWT + Passport</span>
        <p className="muted">Checking session…</p>
      </section>
    );
  }

  if (user) {
    return (
      <section className="island-card">
        <span className="pill">Signed in</span>
        <p>
          <strong>{user.email}</strong>
        </p>
        <p className="muted">User id: {user.id}</p>
        <button disabled={pending} onClick={() => void submitLogout()} type="button">
          {pending ? 'Signing out…' : 'Log out'}
        </button>
        {formError ? <p className="error">{formError}</p> : null}
      </section>
    );
  }

  return (
    <section className="island-card">
      <span className="pill">useCommit + useAuth</span>
      <form className="form-grid" onSubmit={(event) => void submitLogin(event)}>
        <label className="field">
          <span>Email</span>
          <input
            autoComplete="email"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            autoComplete="current-password"
            minLength={6}
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <div className="button-row">
          <button disabled={pending} type="submit">
            {pending ? 'Working…' : 'Log in'}
          </button>
          <button
            className="secondary"
            disabled={pending}
            type="button"
            onClick={() => void submitRegister()}
          >
            Register
          </button>
        </div>
      </form>
      {formError ? <p className="error">{formError}</p> : null}
      <p className="muted">
        Users live in memory only — restart the server and they are gone.
      </p>
    </section>
  );
}
