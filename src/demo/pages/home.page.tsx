import React from 'react';
import { commit, inject, Island, load, revalidate, setLayoutMeta } from '../../core';
import { loadKeys } from '../load-keys';
import { GreetingService } from '../services/greeting.service';

export const greetingLoad = load(loadKeys.greeting, async () => {
  return await inject<GreetingService>(GreetingService).sayHello();
});

export const updateGreetingCommit = commit(
  'greeting.update',
  async (input: { message?: string }) => {
    await inject<GreetingService>(GreetingService).setGreeting(
      input.message ?? '',
    );
    return revalidate(loadKeys.greeting, loadKeys.dashboard);
  },
);

export default async function Home() {
  const greeting = await greetingLoad();

  setLayoutMeta({
    active: 'home',
    description:
      'A NestJS-native rendering experiment where server React reads from Nest DI and client islands bring focused interactivity.',
    eyebrow: 'SSR plus client islands',
    title: 'React as a first-class NestJS rendering layer',
  });

  return (
    <>
      <section className="card span-7">
        <span className="pill">Server rendered</span>
        <p className="muted">
          This value is read through Nest DI during render.
        </p>
        <p className="metric">{greeting}</p>
      </section>

      <section className="card span-5">
        <span className="pill">Client island</span>
        <Island
          mode="hydrate"
          name="GreetingEditor"
          props={{
            initialMessage: greeting,
            loadKey: greetingLoad.key,
            updateGreeting: updateGreetingCommit.ref,
          }}
        />
      </section>

      <section className="card span-12">
        <h2>Framework shape</h2>
        <p className="muted">
          Routes stay in Nest controllers. `load()` runs alongside the server
          request. `commit()` mutates through an opaque framework transport and
          refreshes stale load keys without a full page reload.
        </p>
      </section>
    </>
  );
}
