'use server-entry';

import React from 'react';
import { clearCookie } from 'nest-can-react';

export default function ClearCookiePage() {
  clearCookie('flavor');
  return (
    <>
      <title>Clear cookie | Nest Can React</title>
      <div className="cookies">
        <h1>Cleared</h1>
        <p>
          <code>flavor</code> cookie cleared via <code>clearCookie()</code>.
        </p>
      </div>
    </>
  );
}
