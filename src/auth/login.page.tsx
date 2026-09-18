import React from 'react';
import { Island, NestLink, setLayoutMeta } from '../core';
import { LoginForm } from './islands/LoginForm.island';

export default function LoginPage() {
  setLayoutMeta({
    active: 'login',
    description: 'Sign in with your email and password.',
    eyebrow: 'Auth',
    title: 'Login',
  });

  return (
    <>
      <section className="card span-5">
        <span className="pill">Account</span>
        <p className="muted">
          New here? <NestLink to="/auth/register">Create an account</NestLink>.
        </p>
      </section>

      <section className="card span-7">
        <Island mode="hydrate" name={LoginForm} props={{}} />
      </section>
    </>
  );
}
