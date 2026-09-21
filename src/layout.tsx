import React, { ReactNode } from 'react';
import { favicon } from './assets/brand';
import { NestLink, useLayoutMeta } from './core';

export default function Layout({ children }: { children: ReactNode }) {
  const meta = useLayoutMeta();
  const title = typeof meta.title === 'string' ? meta.title : 'Nest React';

  return (
    <html lang="en">
      <head>
        <title>{`${title} | Nest React`}</title>
        <link href={favicon} rel="icon" type="image/png" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link
          crossOrigin="anonymous"
          href="https://fonts.gstatic.com"
          rel="preconnect"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>

      <body>
        <div className="app">
          <a className="skip-link" href="#content">
            Skip to content
          </a>

          <header className="site-header">
            <div className="shell site-header__bar">
              <NestLink className="brand" to="/welcome">
                <span aria-hidden="true" className="brand-mark" />
                <span className="brand-name">Nest React</span>
              </NestLink>

              <a
                className="text-link"
                href="https://docs.nestjs.com"
                rel="noreferrer"
                target="_blank"
              >
                Nest docs
              </a>
            </div>
          </header>

          <main className="app-main" id="content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
