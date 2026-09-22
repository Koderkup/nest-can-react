# Package APIs

Two import surfaces. Server and layout code import from `nest-can-react`. Interactive islands import from `nest-can-react/client` — that entry must stay out of Server Components.

```ts
import {
  NestReactModule,
  renderPage,
  NestLink,
  setLayoutMeta,
  useLayoutMeta,
} from 'nest-can-react';
```

```ts
import { useCommit, refresh, navigateTo } from 'nest-can-react/client';
```

Use these instead of wiring Flight, asset serving, or RSC refetch yourself. Nest still owns routing, DI, and guards; these helpers are the React edge of that app.

---

## `nest-can-react`

### `NestReactModule.forRoot(options?)`

**What it is.** A Nest module that serves compiled client assets and, in development, attaches the HMR proxies to the HTTP server.

**Why use it.** Without this, the browser cannot load `main.js` / CSS, and `view:dev` cannot talk to the RSC and Fast Refresh sockets through Nest. Import it once in `AppModule`.

```ts
import { Module } from '@nestjs/common';
import { NestReactModule } from 'nest-can-react';
import { WelcomeModule } from './welcome/welcome.module';

@Module({
  imports: [NestReactModule.forRoot(), WelcomeModule],
})
export class AppModule {}
```

| Option | Default | When to set it |
| --- | --- | --- |
| `assetsDir` | `<cwd>/public/nest-can-react` | Client output lives somewhere else |
| `publicPath` | `/assets/nest-can-react` | You changed the URL prefix in `nest.react.json` |

`publicPath` here and `client.publicPath` in config must match. The module currently assumes **Express**. Fastify is not supported yet.

### `renderPage(name, props, options)`

**What it is.** The controller helper that loads a named `*.page.tsx` Server Component, renders it through the layout, and streams HTML + Flight to the response.

**Why use it.** This is how a Nest route becomes a page. You keep auth, validation, and data loading in Nest (constructor DI, guards, services). The page only receives **serializable** props.

```ts
import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { renderPage } from 'nest-can-react';
import { WelcomeService } from './welcome.service';

@Controller('welcome')
export class WelcomeController {
  constructor(private readonly welcome: WelcomeService) {}

  @Get()
  async index(@Req() request: Request, @Res() response: Response) {
    await renderPage('welcome', this.welcome.getPage(), {
      request,
      response,
    });
  }
}
```

`name` is the page id from the file path: `src/welcome/welcome.page.tsx` → `'welcome'`. `src/notes/edit.page.tsx` → `'notes/edit'`.

| Option | Required | Role |
| --- | --- | --- |
| `response` | yes | Stream target (Express `Response` or Node `ServerResponse`) |
| `request` | no | Used to derive the page URL for Flight refetch |
| `url` | no | Override URL when `request` is missing or wrong |
| `statusCode` | no | HTTP status for the streamed document (errors, 404s) |

Call this from a controller method after guards have already run. Do not call it from a Server Component.

### `invalidateRenderRuntime()`

**What it is.** Drops the cached RSC bundle so the next `renderPage` loads a fresh `rsc.js`.

**Why use it.** You almost never call this. The dev runtime already reloads the bundle after server compiles. Use it only if your process replaced `.nest-can-react/server/rsc.js` outside that path (tests, a custom watcher).

### `NestLink`

**What it is.** A layout-safe link: `<NestLink to="/welcome">` instead of `<a href="...">`.

**Why use it.** Keep in-app navigation consistent in Server Components and the layout. External URLs can stay as plain `<a>`.

```tsx
import { NestLink } from 'nest-can-react';

<NestLink className="brand" to="/welcome">
  Home
</NestLink>
```

### Layout meta: `setLayoutMeta` / `useLayoutMeta` / `getLayoutMeta`

**What they are.** Per-request document metadata (`title`, `description`, or any extra keys) stored for the current `renderPage` call.

**Why use them.** Pages decide the `<title>` and related chrome; the layout reads it while rendering `<html>`. That keeps one document shell without hard-coding titles in the layout.

```tsx
'use server-entry';

import { setLayoutMeta } from 'nest-can-react';

export default function WelcomePage() {
  setLayoutMeta({ title: 'Welcome', description: 'Getting started' });
  return <h1>Welcome</h1>;
}
```

```tsx
import { useLayoutMeta } from 'nest-can-react';

export default function Layout({ children }) {
  const meta = useLayoutMeta();

  return (
    <html lang="en">
      <head>
        <title>{meta.title ?? 'Home'}</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- Call `setLayoutMeta` only during a Server Component render started by `renderPage`.
- `useLayoutMeta` and `getLayoutMeta` return the same object; prefer `useLayoutMeta` in the layout.
- `runWithLayoutMeta` wraps that render. The generated Flight entry already calls it — app code should not.

---

## `nest-can-react/client`

Import this only from `'use client'` modules. These helpers talk to the browser runtime (fetch, history, RSC refetch).

### `useCommit(url, options?)`

**What it is.** A hook that POSTs JSON to a Nest route, then (by default) refetches the current RSC page.

**Why use it.** Mutations stay on Nest — same guards, pipes, and services as any API — while the UI updates without a full navigation. Prefer this over ad-hoc `fetch` plus `location.reload()`.

```tsx
'use client';

import { useCommit } from 'nest-can-react/client';

export function NoteEditor({ text: initialText }: { text: string }) {
  const { commit, pending, error, data, state } = useCommit('/note');

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void commit({ text: initialText });
      }}
    >
      <button disabled={pending} type="submit">
        Save
      </button>
      {error ? <p>{error.message}</p> : null}
    </form>
  );
}
```

| Option | Default | Role |
| --- | --- | --- |
| `method` | `'POST'` | HTTP method |
| `revalidate` | `true` | After a successful response, refetch RSC via `refresh()` |

Returned fields: `commit(body?)`, `pending`, `state` (`idle` \| `submitting` \| `revalidating`), `data`, `error`.

The Nest handler should return JSON (or an empty body). Guard it like any other POST.

### `refresh()`

**What it is.** Asks the client runtime to refetch the current page as Flight and swap the tree. Resolves when that refetch finishes (or after a timeout).

**Why use it.** After a mutation that `useCommit` did not cover — for example you already called `fetch` yourself, or a WebSocket told you data changed. `useCommit` already calls this when `revalidate` is true.

### `navigateTo(href)`

**What it is.** `history.pushState` plus a `popstate` so the RSC client loads the new URL without a full document load.

**Why use it.** Client-side transitions after a successful action (redirect to a detail page, leave a wizard). For ordinary links in Server Components, use `NestLink` / `<a>` instead.

```ts
import { navigateTo } from 'nest-can-react/client';

navigateTo('/welcome');
```

---

## CLI

These are the package commands, not JS imports. `npx nest-can-react init` wires the starter; `dev` and `build` compile pages.

| Command | Why run it |
| --- | --- |
| `nest-can-react init [dir]` | Copy the welcome starter into an **existing** Nest app and register `NestReactModule` |
| `nest-can-react dev` | Watch + dual-channel HMR (`view:dev`) |
| `nest-can-react build` | Production RSC bundle and client assets (`build:client`) |

Production: `nest-can-react build`, then `nest start`. See [Creating your first app](first-app.md) and [Core concepts](core-concepts.md).

---

## Config: `nest.react.json`

Not an import, but part of the public contract. It tells the CLI which files are pages, where the layout lives, and where client assets go.

```json
{
  "layout": "src/layout.tsx",
  "pages": {
    "include": ["src/**/*.page.tsx"],
    "exclude": ["src/**/*.test.tsx", "src/**/*.spec.tsx"]
  },
  "client": {
    "outDir": "public/nest-can-react",
    "publicPath": "/assets/nest-can-react",
    "styles": ["src/assets/layout.css"]
  }
}
```

| Field | Why it exists |
| --- | --- |
| `layout` | Single document chrome around every page |
| `pages.include` / `exclude` | Which `*.page.tsx` files become `renderPage` names |
| `client.outDir` | Where Rspack writes browser JS/CSS |
| `client.publicPath` | URL prefix Nest must serve (match `NestReactModule`) |
| `client.styles` | Global CSS entries |

Optional ports if they collide locally: `hmrPort` (default `9101`) and `clientDevPort` (default `9102`).

---

## What you do not import

Pages, layouts, and `'use client'` components are **conventions**, not package exports. Mark a page with `'use server-entry'` and a `default` export; mark an island with `'use client'`. Controllers pass data in; they do not inject Nest providers into those files.

If you need a capability that is not in this list (cookies, sessions, redirects, Fastify), implement it in Nest and pass the result through `renderPage` props or a client `fetch` to a Nest route.
