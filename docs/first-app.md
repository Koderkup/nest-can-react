# Creating your first app

Install **nest-can-react** into an **existing** NestJS project. Nest owns the app; React Server Components stream the UI over Flight.

## Prerequisites

- A working Nest application (`@nestjs/core` v11+).
- Node.js compatible with your Nest version (see the Nest and package peer dependency ranges in `package.json`).
- This guide assumes the default **Express** adapter unless noted.

Reference implementations:

- [`examples/express`](../examples/express) — Express (default)
- [`examples/fastify`](../examples/fastify) — Fastify + optional peers

---

## Quick start

```bash
cd my-nest-app
npm install nest-can-react react react-dom react-server-dom-rspack
npx nest-can-react init
npm install
```

Open **`/welcome`** after you start dev (below). `init` copies the welcome starter and registers `NestReactModule` — it does **not** scaffold a new Nest project from scratch.

---

## Development: two terminals

| Terminal | Command | Watches |
| --- | --- | --- |
| 1 | `npm run view:dev` | `*.page.tsx`, layout, client CSS/JS — Rspack + HMR |
| 2 | `npm run start:dev` | Nest `.ts` (controllers, services) — `nest start --watch` |

UI edits do **not** restart Nest. Controller/guard/DI edits restart Nest and trigger an RSC refetch. Details: [Development and HMR](concepts/development-hmr.md).

Example scripts live in [`examples/express/package.json`](../examples/express/package.json).

---

## What the framework looks for

| Role | What it is | How you point at it |
| --- | --- | --- |
| Config | Pages, layout, styles, output | `nest.react.json` — [Configuration](concepts/configuration.md) |
| Layout | Document chrome (`<html>` / nav / `{children}`) | `layout` in config |
| Pages | Server Component page roots | `*.page.tsx` with `'use server-entry'` |
| Client islands | Interactive components | `'use client'` modules |
| Nest wiring | Asset middleware + dev proxies | `NestReactModule.forRoot()` — [NestReactModule](concepts/nest-react-module.md) |

### Example `nest.react.json`

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

`publicPath` must match `NestReactModule` (default `/assets/nest-can-react` → files in `public/nest-can-react/`).

**Fastify:** pass the adapter and install peers — [Adapters](concepts/adapters.md):

```ts
imports: [NestReactModule.forRoot({ adapter: 'fastify' }), WelcomeModule],
```

```bash
npm install @nestjs/platform-fastify @fastify/static
```

---

## 1. Import the module

→ [NestReactModule](concepts/nest-react-module.md)

```ts
import { Module } from '@nestjs/common';
import { NestReactModule } from 'nest-can-react';
import { WelcomeModule } from './welcome/welcome.module';

@Module({
  imports: [NestReactModule.forRoot(), WelcomeModule],
})
export class AppModule {}
```

---

## 2. Stream from a controller

→ [Render and page refs](concepts/render-and-page-refs.md)

`nest-can-react dev` or `build` writes **`src/react-pages.ts`**. Import the page **ref**. Do not import the `.tsx` page into the controller.

```ts
import { Controller, Get } from '@nestjs/common';
import { render } from 'nest-can-react';
import { WelcomePage } from '../react-pages';

@Controller('welcome')
export class WelcomeController {
  @Get()
  index() {
    return render(WelcomePage);
  }
}
```

Guards on the controller still run before `render()`. The handler does not load view data and does not take `@Req()` / `@Res()` in this pattern.

---

## 3. Layout and page

→ [Layout meta](concepts/layout-meta.md), [inject() and REQUEST](concepts/inject-and-request.md), [Server and client components](concepts/server-and-client-components.md)

```tsx
import React, { ReactNode } from 'react';
import { useLayoutMeta } from 'nest-can-react';

export default function Layout({ children }: { children: ReactNode }) {
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

```tsx
'use server-entry';

import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import React from 'react';
import { inject } from 'nest-can-react';
import { NoteEditor } from './NoteEditor';
import { NotesService } from './notes.service';

export default function NotePage() {
  const notes = inject(NotesService);
  const request = inject<Request>(REQUEST);
  const text = notes.findOne(String(request.params.id)).text;

  return (
    <>
      <title>Note</title>
      <p>{text}</p>
      <NoteEditor text={text} />
    </>
  );
}
```

---

## 4. Client component (island)

→ [Mutations and revalidation](concepts/mutations-and-revalidation.md)

```tsx
'use client';

import React, { useState } from 'react';
import { useCommit } from 'nest-can-react/client';

export function NoteEditor({ text: initialText }: { text: string }) {
  const [text, setText] = useState(initialText);
  const { commit, pending } = useCommit('/note');

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void commit({ text });
      }}
    >
      <textarea value={text} onChange={(event) => setText(event.target.value)} />
      <button disabled={pending} type="submit">
        Save
      </button>
    </form>
  );
}
```

Guard the Nest `POST` handler like any API. See [Security](concepts/security.md).

---

## 5. Build and run

→ [CLI and build](concepts/cli-and-build.md)

```bash
npm run build:client   # nest-can-react build
npm run view:dev       # dev bundler (terminal 1)
npm run start:dev      # Nest (terminal 2)
```

| Output | What it is |
| --- | --- |
| `.nest-can-react/generated/` | Flight entry codegen |
| `.nest-can-react/server/rsc.js` | RSC Node bundle |
| `public/nest-can-react/` | Browser JS/CSS |

**Production:** run `build:client`, then `nest build` / `nest start`.

---

## Best practices

- Keep business logic and auth in Nest providers and guards.
- Default to Server Components; add `'use client'` only for browser state or events.
- Load page data with `inject()`; keep mutations on Nest routes.
- Use render-time [`redirect`](concepts/http-during-render.md) / [`setStatus`](concepts/http-during-render.md) inside pages when the decision belongs to the view layer.

---

## Next steps

| Topic | Where |
| --- | --- |
| Notes CRUD pattern | [`examples/express/src/notes/`](../examples/express/src/notes/) |
| Redirects | [`examples/express/src/redir/`](../examples/express/src/redir/) |
| Cookies (demo) | [`examples/express/src/cookies/`](../examples/express/src/cookies/) |
| Why this architecture | [Why nest-can-react?](why-nest-can-react.md) |
| All exports | [Package APIs](api.md) |
| Terms | [Glossary](glossary.md) |
