'use server-entry';

import React from 'react';
import { inject, NestLink } from 'nest-can-react';
import { ArchitectureMap } from './ArchitectureMap';
import { WelcomeService } from './welcome.service';

export default function WelcomePage() {
  const data = inject(WelcomeService).getPage();
  const adapterLabel =
    data.httpAdapter === 'fastify' ? 'Fastify' : 'Express';
  return (
    <>
      <title>Welcome | Nest Can React</title>
      <div className="welcome">
        <section className="hero shell">
          <div className="hero__copy">
            <p
              className={`adapter-live adapter-live--${data.httpAdapter}`}
              role="status"
            >
              <span aria-hidden="true" className="adapter-live__dot" />
              Running on {adapterLabel}
            </p>
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
              React Server Components stream over Flight. The controller runs
              guards, then render(WelcomePage). This page calls inject() on
              that same Nest container. Client components are islands of
              interactivity — marked with <code>use client</code>.
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
