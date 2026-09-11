# Creating Your First App

This guide builds a small page with server data and a client island on the current Nest React prototype.

The core idea:

```txt
Nest owns the app.
React owns the UI.
Server React can use Nest DI.
Client React talks back through commit refs.
```

## Folder Structure Is Not The Demo

**You do not have to mirror `src/demo/`.** That tree is only how *this repository* organizes its sample (Home / Users / Dashboard, layout, in-memory services). The builder never looks for `src/demo/pages` or `src/demo/services`.

Copy the **roles** below, not the demo folder names.

### Required (the framework looks for these)

| Role | What it is | How you point at it |
| --- | --- | --- |
| Config | Client entry, runtime entry, island globs, output dir | `nest.react.json` at the repo root (or `nest-react.config.mjs`) |
| Client entry | Browser boot: manifest + `installClientRuntime` + navigation | `client.entry` |
| Runtime module | Must export `ClientRuntime` | `runtime.entry` |
| Island files | Browser components | Files matching `islands.include`, named `*.island.tsx` |
| Server island register | `registerIslandComponents` + `registerClientRuntime` | Import that module from `main.ts` (any path) |
| Document slots | Empty runtime host + page slot | `#nr-runtime` and `#nr-document` in the HTML you render |
| Nest wiring | Transport + DI + static files | `NestReactModule.forRoot()`, `initializeFrontendDI`, `useStaticAssets` |

Island **file name** matters: `GreetingEditor.island.tsx` must export `GreetingEditor`, and `<Island name="GreetingEditor" />` must use that same name. The **directory** does not (`src/islands/`, `src/ui/`, `app/client/` are all fine if the glob matches).

### Optional (demo convenience only)

These are *not* required:

- A `src/demo/` folder
- `*.page.tsx` filenames
- A `load-keys.ts` module (string keys inline are fine)
- A shared `layout.tsx` (you can inline `<html>` on one page)
- Splitting `services/` vs `pages/` vs `islands/`
- Home / Users / Dashboard routes

A first app can be as flat as:

```txt
nest.react.json
src/
  core/                      # already in this prototype
  main.ts
  app.module.ts
  app.controller.ts
  greeting.service.ts
  home.tsx                   # server page
  greeting-editor.island.tsx
  app.runtime.tsx            # export function ClientRuntime
  client-entry.tsx           # browser boot
  register-ui.ts             # registerIslandComponents + registerClientRuntime
public/nest-react/           # created by build:client
```

Example `nest.react.json` for that layout:

```json
{
  "client": {
    "entry": "src/client-entry.tsx",
    "outDir": "public/nest-react",
    "publicPath": "/assets/nest-react",
    "codeSplitting": true
  },
  "runtime": {
    "entry": "src/app.runtime.tsx"
  },
  "islands": {
    "include": ["src/**/*.island.tsx"],
    "exclude": ["src/**/*.test.tsx", "src/**/*.spec.tsx"]
  }
}
```

`publicPath` must match how Nest serves `public/` (this demo uses `prefix: '/assets/'`, so files in `public/nest-react/` are `/assets/nest-react/...`).

## 1. Import The Core Module

```ts
import { Module } from '@nestjs/common';
import { NestReactModule } from './core';
import { AppController } from './app.controller';
import { GreetingService } from './greeting.service';

@Module({
  imports: [NestReactModule.forRoot()],
  controllers: [AppController],
  providers: [GreetingService],
})
export class AppModule {}
```

This registers the internal transport (`/_nr/commit`, `/_nr/loads`). Do not call those URLs from app code; islands use `useCommit()` and `useLoad()`.

## 2. Initialize Frontend DI And Serve Assets

```ts
import { NestFactory } from '@nestjs/core';
import { ModuleRef } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { initializeFrontendDI } from './core';
import './register-ui';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  initializeFrontendDI(app.get(ModuleRef));
  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/assets/',
  });
  await app.listen(3000);
}

bootstrap();
```

`./register-ui` is whatever file calls `registerIslandComponents` and `registerClientRuntime`. The demo names it `src/demo/islands.ts`.

## 3. Create A Nest Service

Ordinary Nest. The React layer does not replace modules or DI.

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

## 4. Create A Server Page

Include **both** document slots. If they are missing, the renderer will try to insert them, but client navigation and the runtime host depend on them being stable.

```tsx
import React from 'react';
import { commit, inject, Island, load, revalidate } from './core';
import { GreetingService } from './greeting.service';

export const greetingLoad = load('home:greeting', async () => {
  return inject<GreetingService>(GreetingService).sayHello();
});

export const updateGreetingCommit = commit(
  'greeting.update',
  async (input: { message?: string }) => {
    inject<GreetingService>(GreetingService).setGreeting(input.message ?? '');
    return revalidate('home:greeting');
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
        <div id="nr-runtime"></div>
        <div id="nr-document">
          <h1>{greeting}</h1>
          <Island
            mode="hydrate"
            name="GreetingEditor"
            props={{
              initialMessage: greeting,
              loadKey: greetingLoad.key,
              updateGreeting: updateGreetingCommit.ref,
            }}
          />
        </div>
      </body>
    </html>
  );
}
```

- `mode="hydrate"`: HTML for the island is rendered on the server, then hydrated (interactive without a second copy of the UI).
- `mode="mount"`: empty host; the client renders into it (use this when SSR of the island is unnecessary).

`name` must match the island component export.

## 5. Render From A Controller

```ts
import { Controller, Get, Header } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import HomePage from './home';
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

## 6. Create A Client Island

File name: `greeting-editor.island.tsx` **or** `GreetingEditor.island.tsx`. The discovered export name is what you pass to `<Island name="..." />`. The demo uses PascalCase filenames (`GreetingEditor.island.tsx` → `GreetingEditor`).

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
      <button disabled={saveGreeting.pending} type="submit">
        Save
      </button>
      {refreshing ? <small>Refreshing...</small> : null}
    </form>
  );
}
```

Always `preventDefault` on island forms. Without it, the browser does a full submit and you lose the no-reload `commit()` path.

## 7. Runtime, Registry, And Client Entry

`build:client` writes `.nest-react/generated/{client-registry,server-registry,client-runtime}.ts` from your island glob and `runtime.entry`.

Server register (any filename):

```ts
import { registerClientRuntime, registerIslandComponents } from './core';
import { registry } from '../.nest-react/generated/server-registry.js';
import { ClientRuntime } from './app.runtime';

registerIslandComponents(registry);
registerClientRuntime(ClientRuntime);
```

`ClientRuntime` can be a pass-through at first:

```tsx
import React, { ReactNode } from 'react';

export function ClientRuntime({ children }: { children: ReactNode }) {
  return children;
}
```

When you need shared client state across islands (the demo session counter), put a React context provider here. If hydrate-mode islands each get their own root, keep that state in a module store and subscribe with `useSyncExternalStore` inside the provider so every root sees the same values.

Client entry (`client.entry`):

```tsx
import { installClientRuntime } from './core/client/mount';
import { installNavigation } from './core/client/navigation';
import { reloadManifest } from './core/client/runtime';
import { registry } from '../.nest-react/generated/client-registry.js';
import { ClientRuntime } from '../.nest-react/generated/client-runtime.js';

async function boot() {
  reloadManifest();
  await installClientRuntime(registry, ClientRuntime);
  installNavigation({ onPageChanged: () => reloadManifest() });
}

void boot();
```

You do not hand-write a component registry anymore. Do not recreate `src/demo/client/registry.ts`.

## 8. Build And Run

```bash
npm run build:client
npm run start:dev
```

Open `http://localhost:3000`. After changing islands, runtime, or the client entry, run `build:client` again (`start:dev` does not bundle the browser graph).

Output:

```txt
.nest-react/generated/     # registries
public/nest-react/         # runtime-[hash].js, chunks/, manifest.json
```

## What Happens After A Commit

1. The island calls `useCommit().execute(...)`.
2. The browser posts to `/_nr/commit`.
3. The server `commit()` runs in Nest context and returns `revalidate(...)`.
4. The runtime refreshes those load keys via `/_nr/loads`.
5. `useLoad()` updates. The page does not reload.

The large server-rendered heading **outside** the island will not change until the next full document render. Put UI that should update after `commit()` inside the island (or refresh the document later).

## Best Practices

- Keep framework code in `src/core`; keep *your* app anywhere else.
- Do not treat `src/demo` as a required skeleton.
- Keep `#nr-runtime` empty; put page content in `#nr-document`.
- Use `hydrate` when the island should be visible before JS; use `mount` for controls that can appear after JS.
- Pass `commit.ref` to islands, not transport URLs.
- Keep business logic in Nest providers.

## Current Limitations

- CSS and asset imports are not first-class in the client bundler.
- Request-scoped Nest providers still need hardening.
- Commit refs are not signed; CSRF is not implemented.
- `start:dev` does not rebuild client chunks.
