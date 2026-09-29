'use server-entry';

import React from 'react';
import { setCookie, getCookie } from 'nest-can-react';

export default function CookiesPage() {
  setCookie('flavor', 'chocolate', {
    httpOnly: true,
    maxAge: 3600,
    sameSite: 'lax',
  });

  const existing = getCookie('flavor');

  return (
    <>
      <title>Cookies | Nest Can React</title>
      <div className="cookies">
        <h1>Cookies</h1>
        <p>
          This page sets a render-time cookie via <code>setCookie()</code>.
        </p>
        <pre>incoming flavor cookie: {existing ?? 'none'}</pre>
      </div>
    </>
  );
}
