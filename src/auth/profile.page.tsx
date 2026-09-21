import React from 'react';
import { Island, setLayoutMeta } from '../core';
import type { ProfileUser } from './auth.types';
import { ProfilePanel } from './islands/ProfilePanel.island';

export default function ProfilePage({ user }: { user: ProfileUser }) {
  setLayoutMeta({
    active: 'profile',
    description: 'Loaded on the server after JWT guard — no extra profile API route.',
    eyebrow: 'Auth',
    title: 'Profile',
  });

  return (
    <>
      <section className="card span-5">
        <span className="pill">Server</span>
        <p className="muted">
          Signed in as <strong>{user.email}</strong> ({user.role}).
        </p>
      </section>

      <section className="card span-7">
        <Island mode="hydrate" name={ProfilePanel} props={{ user }} />
      </section>
    </>
  );
}
