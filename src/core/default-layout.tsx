import React, { ReactNode } from 'react';

export default function DefaultLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <head></head>
      <body>{children}</body>
    </html>
  );
}
