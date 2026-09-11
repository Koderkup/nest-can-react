import React from 'react';
import { inject } from '../inject';
import { Island } from '../island';
import { load } from '../load';
import { GreetingService } from '../../greeting.service';

export const greetingLoad = load('home:greeting', async () => {
  return inject<GreetingService>(GreetingService).sayHello();
});

export default async function Home() {
  const greeting = await greetingLoad();

  return (
    <html>
      <head>
        <title>Nest can React</title>
      </head>

      <body>
        <h1 data-nest-react-load-text={greetingLoad.key}>{greeting}</h1>

        <Island
          name="GreetingEditor"
          props={{ commitUrl: '/greeting', loadKey: greetingLoad.key }}
        >
          <form method="post" data-nest-react-commit="/greeting">
            <label>
              New greeting
              <input name="message" defaultValue={greeting} />
            </label>
            <button type="submit">Commit</button>
          </form>
        </Island>
      </body>
    </html>
  );
}
