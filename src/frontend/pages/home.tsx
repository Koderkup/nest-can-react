import React from 'react';
import { commit, revalidate } from '../commit';
import { inject } from '../inject';
import { Island } from '../island';
import { load } from '../load';
import { loadKeys } from '../load-keys';
import { GreetingService } from '../../greeting.service';

export const greetingLoad = load(loadKeys.greeting, async () => {
  return inject<GreetingService>(GreetingService).sayHello();
});

export const updateGreetingCommit = commit(
  'greeting.update',
  async (input: { message?: string }) => {
    inject<GreetingService>(GreetingService).setGreeting(input.message ?? '');
    return revalidate(loadKeys.greeting, loadKeys.dashboard);
  },
);

export default async function Home() {
  const greeting = await greetingLoad();

  return (
    <html>
      <head>
        <title>Nest can React</title>
      </head>

      <body>
        <nav>
          <a href="/">Home</a> | <a href="/users">Users</a> |{' '}
          <a href="/dashboard">Dashboard</a>
        </nav>

        <main>
          <p>Server-rendered greeting</p>
          <h1>{greeting}</h1>

          <Island
            name="GreetingEditor"
            props={{
              initialMessage: greeting,
              loadKey: greetingLoad.key,
              updateGreeting: updateGreetingCommit.ref,
            }}
          />
        </main>
      </body>
    </html>
  );
}
