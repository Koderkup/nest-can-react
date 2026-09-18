import React from 'react';
import { Island, setLayoutMeta } from '../core';
import { AuthPanel } from './islands/AuthPanel.island';

export default function AuthPage() {
  setLayoutMeta({
    active: 'auth',
    description:
      'Passport local + JWT strategies, in-memory users, register/login/logout via useCommit.',
    eyebrow: 'Auth',
    title: 'Auth',
  });

  return (
    <>
      <section className="card span-5">
        <span className="pill">Server</span>
        <p className="muted">
          POST <code>/auth/register</code>, <code>/auth/login</code>,{' '}
          <code>/auth/logout</code>, and GET <code>/auth/me</code> with a Bearer
          token.
        </p>
      </section>

      <section className="card span-7">
        <Island mode="hydrate" name={AuthPanel} props={{}} />
      </section>
    </>
  );
}
