import React, { ReactNode } from 'react';
import favicon from './assets/favicon.svg';
import { NestLink, useLayoutMeta } from './core';


const navItems = [
  { id: 'welcome', to: '/', label: 'Welcome' },
  { id: 'note', to: '/note', label: 'Note' },
  { id: 'pulse', to: '/pulse', label: 'Pulse' },
] as const;

export default function Layout({ children }: { children: ReactNode }) {
  const meta = useLayoutMeta();
  const title = typeof meta.title === 'string' ? meta.title : 'Nest React';
  const eyebrow = typeof meta.eyebrow === 'string' ? meta.eyebrow : '';
  const description =
    typeof meta.description === 'string' ? meta.description : '';
  const active = typeof meta.active === 'string' ? meta.active : '';

  return (
    <html>
      <head>
        <title>{`${title} | Nest React`}</title>
        <link rel="icon" href={favicon} type="image/svg+xml" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>

      <body>
        <div className="app-shell">
          <header className="topbar">
            <NestLink className="brand" to="/">
              <span className="brand-mark">NR</span>
              <span>
                <strong>Nest React</strong>
                <small>Starter UI — safe to delete</small>
              </span>
            </NestLink>

            <nav className="nav">
              {navItems.map((item) => (
                <NestLink
                  className={
                    item.id === active ? 'nav-link active' : 'nav-link'
                  }
                  key={item.id}
                  to={item.to}
                >
                  {item.label}
                </NestLink>
              ))}
            </nav>
          </header>

          <section className="hero">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </section>

          <main className="page-grid">{children}</main>
        </div>
      </body>
    </html>
  );
}
