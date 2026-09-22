import React, { ReactNode } from "react";
import { favicon } from "./assets/brand";
import { NestLink } from "nest-can-react";
import { ThemeProvider } from './ThemeContext';
import { ThemeToggle } from './ThemeToggle';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html data-theme="dark" lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='ncr-theme',t=localStorage.getItem(k);if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;return}if(window.matchMedia('(prefers-color-scheme: light)').matches)document.documentElement.dataset.theme='light'}catch(e){}})();`,
          }}
        />
        <title>Nest Can React</title>
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
        <ThemeProvider>
          <div className="app">
            <a className="skip-link" href="#content">
              Skip to content
            </a>

            <header className="site-header">
              <div className="shell site-header__bar">
                <NestLink className="brand" to="/notes">
                  <span aria-hidden="true" className="brand-mark" />
                  <span className="brand-name">Nest Can React</span>
                </NestLink>

                <nav aria-label="Primary" className="site-nav">
                  <NestLink className="nav-link" to="/notes">
                    Notes
                  </NestLink>
                  <NestLink className="nav-link" to="/welcome">
                    Architecture
                  </NestLink>
                  <ThemeToggle />
                  <a
                    className="text-link"
                    href="https://docs.nestjs.com"
                    rel="noreferrer"
                    target="_blank"
                  >
                    Nest docs
                  </a>
                </nav>
              </div>
            </header>

            <main className="app-main" id="content">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
