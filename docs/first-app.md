# Creating your first app

Install `nest-can-react` into an existing NestJS project. Nest owns the app; React Server Components stream the UI over Flight.

```bash
cd my-nest-app
npm install nest-can-react react react-dom react-server-dom-rspack
npx nest-can-react init
npm install
npm run view:dev
```

Open `/welcome`. `init` does not create a new Nest project. It copies the starter into your Nest app and wires `NestReactModule` into `AppModule`.

## What the framework looks for

| Role | What it is | How you point at it |
| --- | --- | --- |
| Config | Pages, layout, styles, output | `nest.react.json` |
| Layout | Document chrome (`<html>` / nav / `{children}`) | `layout` |
| Pages | Server Component page roots | `*.page.tsx` with `'use server-entry'` |
| Client islands | Interactive components | `'use client'` modules |
| Nest wiring | Asset middleware | `NestReactModule.forRoot()` |

## Example `nest.react.json`

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

`publicPath` must match how Nest serves assets (`NestReactModule` defaults to `/assets/nest-can-react` → files in `public/nest-can-react/`).

**Fastify:** If your Nest app uses `@nestjs/platform-fastify`, pass the adapter option:

```ts
imports: [NestReactModule.forRoot({ adapter: 'fastify' }), WelcomeModule],
```

Also install the optional peer dependencies:
```bash
npm install @nestjs/platform-fastify @fastify/static
```

## 1. Import the module

```ts
import { Module } from '@nestjs/common';
import { NestReactModule } from 'nest-can-react';
import { WelcomeModule } from './welcome/welcome.module';

@Module({
  imports: [NestReactModule.forRoot({ adapter: 'express' }), WelcomeModule],
})
export class AppModule {}
```

## 2. Stream from a controller

`nest-can-react dev` or `build` writes `src/react-pages.ts`. Import the page ref. Do not import the `.tsx` page into the controller.

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

Guards on the controller or route still run before `render()`. The handler does not load view data and does not take `@Req()` / `@Res()`.

## 3. Layout and page

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

## 4. Client component (island)

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

`useCommit` POSTs JSON to Nest, then refreshes the RSC payload. Guard the Nest `POST` like any API.

## 5. Build and run

```bash
npm run build:client
npm run view:dev
```

| Output | What it is |
| --- | --- |
| `.nest-can-react/generated/` | Flight entry codegen |
| `.nest-can-react/server/rsc.js` | RSC Node bundle |
| `public/nest-can-react/` | Browser JS/CSS |

## Best practices

- Keep business logic and auth in Nest providers/guards.
- Default to Server Components; add `'use client'` only where you need browser APIs or state.
- Load page data with `inject()`. Leave guards and mutations on the controller.
- Use Nest POST routes for mutations, not ad-hoc bypasses around guards.

What each export is for: [Package APIs](api.md).
