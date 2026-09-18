import React, { FormEvent, useState } from 'react';
import { NestLink } from '../../core/render/link';
import { useCommit } from '../../core/client/use-commit';

type RegisterResponse = {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    role?: string;
  };
};

const roles = [
  { value: 'customer', label: 'Customer' },
  { value: 'admin', label: 'Admin' },
] as const;

export function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<(typeof roles)[number]['value']>('customer');
  const { commit, pending, error, data } = useCommit<RegisterResponse>(
    '/auth/register',
    { revalidate: false },
  );

  return (
    <section className="island-card">
      <span className="pill">POST /auth/register</span>
      <form
        className="form-grid"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          void commit({ name, email, password, role }).catch(() => undefined);
        }}
      >
        <label className="field">
          <span>Name</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
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
            autoComplete="new-password"
            minLength={8}
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Role</span>
          <select value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
            {roles.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button disabled={pending} type="submit">
          {pending ? 'Creating…' : 'Register'}
        </button>
      </form>
      {data ? (
        <p className="muted">
          {data.message}{' '}
          <NestLink to="/auth/login">Log in</NestLink>
        </p>
      ) : null}
      {error ? <p className="error">{error.message}</p> : null}
    </section>
  );
}
