# Creating Your First App

This guide teaches the current Nest React prototype by building a small page with server data and a client island.

The core idea:

```txt
Nest owns the app.
React owns the UI.
Server React can use Nest DI.
Client React talks back through commit refs.
```

## 1. Import The Core Module

Register `NestReactModule` in your Nest app module.

```ts
import { Module } from '@nestjs/common';
import { NestReactModule } from './core';
import { AppController } from './app.controller';
import { GreetingService } from './demo/services/greeting.service';

@Module({
  imports: [NestReactModule],
  controllers: [AppController],
  providers: [GreetingService],
})
export class AppModule {}
```

What this does:

- Adds the package-owned internal transport.
- Keeps application controllers clean.
- Allows client commits and load refreshes to go through the framework runtime.

Current internal transport:

```txt
POST /_nr/commit
POST /_nr/loads
GET  /_nr/loads/:key
```

User code should not call these URLs directly. Client islands should use `useCommit()` and `useLoad()`.

## 2. Initialize Frontend DI

In `main.ts`, initialize the frontend DI bridge and serve built client assets.

```ts
import { NestFactory } from '@nestjs/core';
import { ModuleRef } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { initializeFrontendDI } from './core';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const moduleRef = app.get(ModuleRef);

  initializeFrontendDI(moduleRef);

  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/assets/',
  });

  await app.listen(3000);
}

bootstrap();
```

What this does:

- Makes Nest providers available to server React through `inject()`.
- Serves `/assets/nest-react/client.js`, the esbuild output used by client islands.

## 3. Create A Nest Service

Create a normal Nest provider.

```ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class GreetingService {
  private greeting = 'Hello from Nest DI';

  sayHello() {
    return this.greeting;
  }

  setGreeting(greeting: string) {
    this.greeting = greeting;
    return this.greeting;
  }
}
```

This is ordinary Nest. The React layer does not replace services, modules, DI, or application architecture.

## 4. Create Load Keys

Load keys identify server data that can be refreshed later.

```ts
export const loadKeys = {
  greeting: 'home:greeting',
} as const;
```

Why keys matter:

- `load()` stores initial data under a key.
- `commit()` returns keys that became stale.
- The browser runtime refreshes those keys without reloading the page.

## 5. Create A Server Page

Server pages are async React functions rendered by Nest.

```tsx
import React from 'react';
import { commit, inject, Island, load, revalidate } from './core';
import { GreetingService } from './greeting.service';
import { loadKeys } from './load-keys';

export const greetingLoad = load(loadKeys.greeting, async () => {
  return inject<GreetingService>(GreetingService).sayHello();
});

export const updateGreetingCommit = commit(
  'greeting.update',
  async (input: { message?: string }) => {
    inject<GreetingService>(GreetingService).setGreeting(input.message ?? '');
    return revalidate(loadKeys.greeting);
  },
);

export default async function HomePage() {
  const greeting = await greetingLoad();

  return (
    <html>
      <head>
        <title>Home</title>
      </head>
      <body>
        <h1>{greeting}</h1>
        <Island
          name="GreetingEditor"
          props={{
            initialMessage: greeting,
            loadKey: greetingLoad.key,
            updateGreeting: updateGreetingCommit.ref,
          }}
        />
      </body>
    </html>
  );
}
```

What each part does:

- `load()` fetches data during the server request.
- `inject()` resolves a Nest provider.
- `commit()` defines a server mutation.
- `revalidate()` tells the client which loads should refresh after the mutation.
- `Island` marks where a client React component should mount.
- `updateGreetingCommit.ref` is an opaque commit reference, not a URL.

## 6. Render The Page From A Controller

Nest controllers still own page routes.

```ts
import { Controller, Get, Header } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import HomePage from './home.page';
import { renderPage } from './core';

@Controller()
export class AppController {
  constructor(private readonly moduleRef: ModuleRef) {}

  @Get()
  @Header('content-type', 'text/html')
  home() {
    return renderPage(HomePage, this.moduleRef);
  }
}
```

What this does:

- Nest handles the incoming request.
- `renderPage()` runs React inside a Nest-aware context.
- The response includes HTML, the load manifest, and the client island bundle script.

## 7. Create A Client Island

Client islands are browser React components. They can use hooks like `useState`, `useEffect`, and event handlers.

```tsx
import React, { useEffect, useState } from 'react';
import { useCommit, useLoad, usePendingLoad } from './core/client/hooks';
import { CommitRef } from './core/client/runtime';

type Props = {
  initialMessage: string;
  loadKey: string;
  updateGreeting: CommitRef;
};

export function GreetingEditor({
  initialMessage,
  loadKey,
  updateGreeting,
}: Props) {
  const serverMessage = useLoad<string>(loadKey) ?? initialMessage;
  const refreshing = usePendingLoad(loadKey);
  const [message, setMessage] = useState(initialMessage);
  const saveGreeting = useCommit<{ message: string }>(updateGreeting);

  useEffect(() => {
    setMessage(serverMessage);
  }, [serverMessage]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void saveGreeting.execute({ message });
      }}
    >
      <p>{serverMessage}</p>
      <input value={message} onChange={(event) => setMessage(event.target.value)} />
      <button disabled={saveGreeting.pending}>Save</button>
      {refreshing ? <small>Refreshing...</small> : null}
    </form>
  );
}
```

What this does:

- `useLoad()` reads initial server data and receives refreshed data later.
- `useCommit()` calls the server mutation through the internal transport.
- `usePendingLoad()` lets the UI show refresh state without clearing old data.

## 8. Register The Island

The current prototype uses a client registry.

```ts
import { ComponentType } from 'react';
import { GreetingEditor } from './components/GreetingEditor';

export const registry: Record<string, ComponentType<any>> = {
  GreetingEditor,
};
```

The `Island` name must match the registry key:

```tsx
<Island name="GreetingEditor" props={...} />
```

## 9. Build Client Assets

The client entry is bundled with esbuild.

```bash
npm run build:client
```

This writes:

```txt
public/nest-react/client.js
public/nest-react/client.js.map
```

Build the server too:

```bash
npm run build
```

Or build both:

```bash
npm run build:all
```

## 10. Run The App

```bash
npm run start:dev
```

Open:

```txt
http://localhost:3000
```

The first request is server-rendered. After the page loads, the island mounts and behaves like normal client React.

## What Happens After A Commit

1. User types into a client island.
2. Island calls `useCommit().execute(...)`.
3. Browser posts to the internal framework transport.
4. The matching server `commit()` runs in Nest context.
5. The commit returns `revalidate('home:greeting')`.
6. Browser refreshes that load key.
7. `useLoad('home:greeting')` receives the fresh value.
8. The island updates without a full page reload.

## Current Best Practices

- Put reusable framework code in `src/core`.
- Put app/demo code outside `src/core`.
- Keep controllers responsible for user-facing routes.
- Use `load()` for server reads.
- Use `commit()` for server mutations.
- Pass `commit.ref` to islands, not URLs.
- Keep client-only state inside client islands.
- Keep database and business logic in Nest providers.

## Current Limitations

- CSS imports are not first-class yet.
- Asset imports are not first-class yet.
- One client bundle contains all islands.
- Hydration is not fully implemented; islands are mounted with `createRoot()`.
- Request-scoped provider support still needs hardening.
- Commit refs are not signed yet.
- CSRF protection is not implemented yet.
