'use server-entry';

import React from 'react';
import { NestLink } from 'nest-can-react';
import { ArchitectureMap } from './ArchitectureMap';
import { WelcomePageData } from './welcome.types';

export default function WelcomePage(data: WelcomePageData) {
  return (
    <>
      <title>Welcome | Nest Can React</title>
      <div className="welcome">
        <section className="hero shell">
          <div className="hero__copy">
            <p className="hero__kicker">
              <span aria-hidden="true" className="hero__kicker-mark" />
              {data.tagline}
            </p>
            <h1 className="display-xl">
              Nest owns
              <br />
              the runtime.
            </h1>
            <p className="body-lg">
              React Server Components stream over Flight. Nest owns routing,
              guards, and data. Client components are islands of interactivity —
              marked with <code>use client</code>.
            </p>
            <div className="hero__actions">
              <NestLink className="button button-primary" to="/notes">
                Open the notes app
              </NestLink>
            </div>
          </div>

          <div className="hero__visual">
            <ArchitectureMap edges={data.edges} nodes={data.nodes} />
          </div>
        </section>
      </div>
    </>
  );
}
