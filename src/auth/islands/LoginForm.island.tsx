import React, { FormEvent, useState } from 'react';
import { NestLink } from '../../core/render/link';
import { useCommit } from '../../core/client/use-commit';

const AUTH_TOKEN_KEY = 'nest-learning.auth.token';

type LoginResponse = {
  message: string;
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role?: string;
  };
};

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { commit, pending, error } = useCommit<LoginResponse>('/auth/login', {
    revalidate: false,
  });

  return (
    <section className="island-card">
      <span className="pill">POST /auth/login</span>
      <form
        className="form-grid"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          void commit({ email, password })
            .then((result) => {
              if (result?.token) {
                localStorage.setItem(AUTH_TOKEN_KEY, result.token);
                window.location.href = '/auth/profile';
              }
            })
            .catch(() => undefined);
        }}
      >
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
            minLength={8}
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button disabled={pending} type="submit">
          {pending ? 'Signing in…' : 'Log in'}
        </button>
      </form>
      {error ? <p className="error">{error.message}</p> : null}
      <p className="muted">
        <NestLink to="/auth/register">Need an account?</NestLink>
      </p>
    </section>
  );
}
