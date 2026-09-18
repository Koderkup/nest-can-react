import React from 'react';
import { Island, NestLink, setLayoutMeta } from '../core';
import { RegisterForm } from './islands/RegisterForm.island';

export default function RegisterPage() {
  setLayoutMeta({
    active: 'register',
    description: 'Register with in-memory storage for now.',
    eyebrow: 'Auth',
    title: 'Register',
  });

  return (
    <>
      <section className="card span-5">
        <span className="pill">Account</span>
        <p className="muted">
          Already registered? <NestLink to="/auth/login">Log in</NestLink>.
        </p>
      </section>

      <section className="card span-7">
        <Island mode="hydrate" name={RegisterForm} props={{}} />
      </section>
    </>
  );
}
