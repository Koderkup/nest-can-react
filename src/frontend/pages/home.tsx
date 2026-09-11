import React from 'react';
import { inject } from '../inject';
import { GreetingService } from '../../greeting.service';

export default function Home() {
  const greeting = inject<GreetingService>(GreetingService);

  return (
    <html>
      <head>
        <title>Nest can React</title>
      </head>

      <body>
        <h1>{greeting.sayHello()}</h1>
      </body>
    </html>
  );
}