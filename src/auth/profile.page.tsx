import React from 'react';
import { Island, setLayoutMeta } from '../core';
import { ProfilePanel } from './islands/ProfilePanel.island';

export default function ProfilePage() {
  setLayoutMeta({
    active: 'profile',
    description: 'Your session and JWT-protected profile data.',
    eyebrow: 'Auth',
    title: 'Profile',
  });

  return (
    <>
      <section className="card span-5">
        <span className="pill">Protected</span>
        <p className="muted">
          This page loads on the server; the island calls{' '}
          <code>GET /auth/me</code> with your Bearer token.
        </p>
      </section>

      <section className="card span-7">
        <Island mode="hydrate" name={ProfilePanel} props={{}} />
      </section>
    </>
  );
}
