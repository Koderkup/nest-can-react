import React, { useEffect, useState } from 'react';
import { NestLink } from '../../core/render/link';

const AUTH_TOKEN_KEY = 'nest-learning.auth.token';

type ProfileUser = {
  userId: number;
  email: string;
  role: string;
};

type ProfileState =
  | { status: 'loading' }
  | { status: 'guest' }
  | { status: 'ready'; user: ProfileUser }
  | { status: 'error'; message: string };

export function ProfilePanel() {
  const [state, setState] = useState<ProfileState>({ status: 'loading' });

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
      setState({ status: 'guest' });
      return;
    }

    void fetch('/auth/me', {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          throw new Error('Session expired. Please log in again.');
        }

        const payload = (await response.json()) as { user: ProfileUser };
        setState({ status: 'ready', user: payload.user });
      })
      .catch((cause: unknown) => {
        setState({
          status: 'error',
          message:
            cause instanceof Error ? cause.message : 'Could not load profile.',
        });
      });
  }, []);

  function signOut() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    window.location.href = '/auth/login';
  }

  if (state.status === 'loading') {
    return (
      <section className="island-card">
        <span className="pill">GET /auth/me</span>
        <p className="muted">Loading profile…</p>
      </section>
    );
  }

  if (state.status === 'guest') {
    return (
      <section className="island-card">
        <span className="pill">Not signed in</span>
        <p className="muted">
          <NestLink to="/auth/login">Log in</NestLink> to view your profile.
        </p>
      </section>
    );
  }

  if (state.status === 'error') {
    return (
      <section className="island-card">
        <span className="pill">Profile</span>
        <p className="error">{state.message}</p>
        <NestLink to="/auth/login">Go to login</NestLink>
      </section>
    );
  }

  return (
    <section className="island-card">
      <span className="pill">Signed in</span>
      <ul className="muted">
        <li>User id: {state.user.userId}</li>
        <li>Email: {state.user.email}</li>
        <li>Role: {state.user.role}</li>
      </ul>
      <button className="secondary" onClick={signOut} type="button">
        Sign out
      </button>
    </section>
  );
}
