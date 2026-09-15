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
| Config | Island globs, output dir, optional runtime, layout | `nest.react.json` |
| Layout | Document chrome (`<html>` / nav / `{children}`) | `layout` |
| Island files | Browser components | `*.island.tsx` matching `islands.include` |
| Nest wiring | Transport, DI, `/assets`, generated boot | `NestReactModule.forRoot()` |

Island **file name** matters: `GreetingEditor.island.tsx` must export `GreetingEditor`, and `<Island name={GreetingEditor} />` must pass that same component. The **directory** does not.

The package generates client entry, registries, and `server-boot.ts`. It injects `#nr-runtime` and `#nr-document`. Do not author those files or slot ids.

### Optional

- `src/demo/` folder names
- `*.page.tsx` filenames
- `load-keys.ts`
- `runtime.entry` / `app.runtime.tsx` (pass-through `ClientRuntime` if omitted)
- `client.entry` (override generated boot)

A first app can be:

```txt
nest.react.json
src/
  core/
  main.ts
  app.module.ts
  app.controller.ts
  greeting.service.ts
  layout.tsx
  layout.css
  home.tsx
  GreetingEditor.island.tsx
public/nest-react/
```

Example `nest.react.json`:

```json
{
  "layout": "src/layout.tsx",
  "client": {
    "outDir": "public/nest-react",
    "publicPath": "/assets/nest-react",
    "codeSplitting": true,
    "styles": ["src/layout.css"]
  },
  "islands": {
    "include": ["src/**/*.island.tsx"],
    "exclude": ["src/**/*.test.tsx", "src/**/*.spec.tsx"]
  }
}
```

`publicPath` must match how Nest serves `public/` (this demo uses `prefix: '/assets/'`, so files in `public/nest-react/` are `/assets/nest-react/...`).

List global CSS in `client.styles`. The bundler emits hashed stylesheets and `renderPage` injects `<link rel="stylesheet">` into `<head>`, so first paint does not wait for JS. Do not `import` CSS from `layout.tsx` or other server files.

Islands can import CSS and assets:

```tsx
import './GreetingEditor.css';
import mark from './session-mark.svg';
```

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

This registers the internal transport (`/_nr/commit`, `/_nr/loads`), frontend DI, static files at `/assets/`, and generated island/layout registration.

## 2. Nest Bootstrap

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();
```

You do not import island registries or call `initializeFrontendDI` / `useStaticAssets`. `NestReactModule.forRoot()` owns that.

Run `npm run build:client` before the first server start so `.nest-react/generated` exists.

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

## 4. Create A Layout And A Server Page

`layout.tsx` owns `<html>` chrome. Do not add `#nr-runtime` or `#nr-document`.

```tsx
import React, { ReactNode } from 'react';
import { useLayoutMeta } from './core';

export default function Layout({ children }: { children: ReactNode }) {
  const meta = useLayoutMeta();

  return (
    <html>
      <head>
        <title>{meta.title ?? 'Home'}</title>
      </head>
      <body>
        <h1>{meta.title}</h1>
        {children}
      </body>
    </html>
  );
}
```

Pages set chrome via `setLayoutMeta` and return only the page body:

```tsx
import React from 'react';
import { commit, inject, Island, load, revalidate, setLayoutMeta } from './core';
import { GreetingEditor } from './islands/GreetingEditor.island';
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

  setLayoutMeta({ title: 'Home' });

  return (
    <>
      <p>{greeting}</p>
      <Island
        mode="hydrate"
        name={GreetingEditor}
        props={{
          initialMessage: greeting,
          loadKey: greetingLoad.key,
          updateGreeting: updateGreetingCommit.ref,
        }}
      />
    </>
  );
}
```

- `mode="hydrate"`: HTML for the island is rendered on the server, then hydrated.
- `mode="mount"`: empty host; the client renders into it.

Pass the island component as `name` so the editor can jump to it. String names still work as an escape hatch.

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

File name: `greeting-editor.island.tsx` **or** `GreetingEditor.island.tsx`. Import the discovered export and pass it to `<Island name={GreetingEditor} />`. The demo uses PascalCase filenames (`GreetingEditor.island.tsx` → `GreetingEditor`).

```tsx
import React, { useEffect, useState } from 'react';
import { useCommit, useLoad, usePendingLoad } from './core/client/hooks';
import { CommitRef } from './core/client/runtime';
import './GreetingEditor.css';

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

## 7. Optional Client Runtime

`build:client` writes `.nest-react/generated/` (client entry, registries, `server-boot.ts`, layout re-export). `NestReactModule` loads `server-boot.ts`. You do not write `islands.ts` or `client/entry.tsx`.

Shared client context is optional. Point `runtime.entry` at a module that exports `ClientRuntime`. If omitted, the bundler emits a pass-through. The demo `useSession()` counter lives in `src/demo/app.runtime.tsx`.

## 8. Build And Run

```bash
npm run build:client
npm run start:dev
```

Open `http://localhost:3000`. After changing islands or `runtime.entry`, run `build:client` again.

Output:

```txt
.nest-react/generated/     # boot, registries, layout, client-styles
public/nest-react/         # runtime-[hash].js, CSS, assets/, chunks/, manifest.json
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
- Put chrome in `layout.tsx`; put page body in the page module.
- Do not author `#nr-runtime` / `#nr-document`.
- Use `hydrate` when the island should be visible before JS; use `mount` for controls that can appear after JS.
- Pass `commit.ref` to islands, not transport URLs.
- Keep business logic in Nest providers.

## Current Limitations

- Request-scoped Nest providers still need hardening.
- Commit refs are not signed; CSRF is not implemented.
- No PostCSS, Tailwind, or Vite `?url` / `?raw` / HMR.
- CSS modules work in client islands, not in server pages.
- `start:dev` does not rebuild client chunks.
