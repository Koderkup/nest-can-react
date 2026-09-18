import React from 'react';
import { navigateTo } from '../../core/client/navigation';
import type { ProfileUser } from '../auth.types';

const AUTH_TOKEN_KEY = 'nest-learning.auth.token';

type ProfilePanelProps = {
  user: ProfileUser;
};

export function ProfilePanel({ user }: ProfilePanelProps) {
  async function signOut() {
    try {
      await fetch('/auth/logout', {
        credentials: 'include',
        method: 'POST',
        headers: { accept: 'application/json' },
      });
    } catch {
      // still redirect
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      void navigateTo('/auth/login').catch(() => {
        window.location.assign('/auth/login');
      });
    }
  }

  return (
    <section className="island-card">
      <span className="pill">Hydrated from server props</span>
      <ul className="muted">
        <li>User id: {user.userId}</li>
        <li>Email: {user.email}</li>
        <li>Role: {user.role}</li>
      </ul>
      <button className="secondary" onClick={() => void signOut()} type="button">
        Sign out
      </button>
    </section>
  );
}
