import React from 'react';
import { inject, Island, load, setLayoutMeta } from '../core';
import { ThemeToggle } from './islands/ThemeToggle.island';
import { loadKeys } from './load-keys';
import { WelcomeService } from './welcome.service';

export const taglineLoad = load(loadKeys.tagline, () => {
  return inject<WelcomeService>(WelcomeService).getTagline();
});

export default async function WelcomePage() {
  const tagline = await taglineLoad();

  setLayoutMeta({
    active: 'welcome',
    description:
      'Starter page. Delete src/welcome when you have a real route. Nest still owns the request; React renders the HTML.',
    eyebrow: 'Starter',
    title: 'Welcome',
  });

  return (
    <>
      <section className="card span-7">
        <span className="pill">Server rendered</span>
        <p className="metric">{tagline}</p>
        <p className="muted">
          This string comes from WelcomeService through Nest DI. Safe to delete
          this feature folder.
        </p>
      </section>

      <section className="card span-5">
        <span className="pill">Client island</span>
        <p className="muted">
          Theme lives in ClientRuntime context so every island root sees the
          same value. Default is light.
        </p>
        <Island mode="hydrate" name={ThemeToggle} />
      </section>
    </>
  );
}
