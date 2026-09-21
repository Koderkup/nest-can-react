import React from 'react';
import { Island, setLayoutMeta } from 'nest-react';
import { ArchitectureMap } from './islands/ArchitectureMap.island';
import { WelcomePageData } from './welcome.types';

export default function WelcomePage(data: WelcomePageData) {
  setLayoutMeta({
    title: 'Welcome',
  });

  return (
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
            React renders the surface. Welcome is a Nest feature: a module, a
            controller, a service, and a client island. Controllers load data.
            Pages compose HTML. Islands hydrate without a second frontend
            server.
          </p>
        </div>

        <div className="hero__visual">
          <Island
            mode="hydrate"
            name={ArchitectureMap}
            props={{ edges: data.edges, nodes: data.nodes }}
          />
        </div>
      </section>
    </div>
  );
}
