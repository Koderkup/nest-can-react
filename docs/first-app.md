# Creating Your First App

This guide builds a small page with server data and a client island on the current Nest React prototype.

The core idea:

```txt
Nest owns the app.
React owns the UI.
Server React can use Nest DI.
Client React talks back through commit refs.
```

## Folder Structure Is Not The Starter

**You do not have to mirror `src/welcome`, `src/note`, or `src/pulse`.** Those folders are how *this repository* organizes a disposable sample. The builder never looks for those names.

Copy the **roles** below, not the demo folder names.

### Required (the framework looks for these)

| Role | What it is | How you point at it |
| --- | --- | --- |
| Config | Island globs, output dir, optional runtime, layout | `nest.react.json` |
| Layout | Document chrome (`<html>` / nav / `{children}`) | `layout` |
| Island files | Browser components | `*.island.tsx` matching `islands.include` |
| Nest wiring | Transport, DI, `/assets`, generated boot | `NestReactModule.forRoot()` |

Island **file name** matters: `NoteEditor.island.tsx` must export `NoteEditor`, and `<Island name={NoteEditor} />` must pass that same component. The **directory** does not.

The package generates client entry, registries, and `server-boot.ts`. It injects `#nr-runtime` and `#nr-document`. Do not author those files or slot ids.

### Optional

- this repo’s `welcome/` / `note/` / `pulse/` folder names
- `*.page.tsx` filenames
- `runtime.entry` / `app.runtime.tsx` (pass-through `ClientRuntime` if omitted)
- `client.entry` (override generated boot)

A first app can be:

```txt
nest.react.json
src/
  core/
  main.ts
  app.module.ts
  layout.tsx
  assets/layout.css
  welcome/
    welcome.module.ts
    welcome.controller.ts
    welcome.service.ts
    welcome.page.tsx
    islands/ThemeToggle.island.tsx
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
    "styles": ["src/assets/layout.css"]
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
import './NoteEditor.css';
import mark from '../assets/mark.svg';
```

## 1. Import The Core Module

```ts
import { Module } from '@nestjs/common';
import { NestReactModule } from './core';
import { WelcomeModule } from './welcome/welcome.module';

@Module({
  imports: [NestReactModule.forRoot(), WelcomeModule],
})
export class AppModule {}
```

This registers static files at `/assets/` and generated island/layout registration.

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

You do not import island registries or call `useStaticAssets`. `NestReactModule.forRoot()` owns that.

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

Pages set chrome via `setLayoutMeta` and return only the page body. Data comes from the controller as props:

```tsx
import React from 'react';
import { Island, setLayoutMeta } from './core';
import { NoteEditor } from './islands/NoteEditor.island';

export default function NotePage({ text }: { text: string }) {
  setLayoutMeta({ title: 'Note' });

  return (
    <>
      <p>{text}</p>
      <Island mode="hydrate" name={NoteEditor} props={{ text }} />
    </>
  );
}
```

- `mode="hydrate"`: HTML for the island is rendered on the server, then hydrated.
- `mode="mount"`: empty host; the client renders into it.

Pass the island component as `name` so the editor can jump to it. String names still work as an escape hatch.

## 5. Render From A Controller

`.ts` (Nest-looking). The package creates the element:

```ts
import { Body, Controller, Get, Header, Post } from '@nestjs/common';
import NotePage from './note.page';
import { renderPage } from './core';
import { NoteService } from './note.service';

@Controller('note')
export class NoteController {
  constructor(private readonly notes: NoteService) {}

  @Get()
  @Header('content-type', 'text/html')
  index() {
    return renderPage(NotePage, { text: this.notes.getText() }, { mode: 'hydrated' });
  }

  @Post()
  save(@Body() body: { text?: string }) {
    return { text: this.notes.save(body.text ?? '') };
  }
}
```

`.tsx` if you prefer JSX in the handler:

```tsx
return renderPage(<NotePage text={text} />, { mode: 'hydrated' });
```

## 6. Create A Client Island

File name: `note-editor.island.tsx` **or** `NoteEditor.island.tsx`. Import the discovered export and pass it to `<Island name={NoteEditor} />`. This starter uses PascalCase filenames (`NoteEditor.island.tsx` → `NoteEditor`).

```tsx
import React, { useState } from 'react';

type Props = {
  text: string;
};

export function NoteEditor({ text: initialText }: Props) {
  const [text, setText] = useState(initialText);
  const [pending, setPending] = useState(false);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setPending(true);
        void fetch('/note', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text }),
        })
          .then((response) => response.json())
          .then((result: { text: string }) => setText(result.text))
          .finally(() => setPending(false));
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

Always `preventDefault` on island forms if you `fetch`. Put `@UseGuards` on the Nest `POST` the same as any API.

## 7. Optional Client Runtime

`build:client` writes `.nest-react/generated/` (client entry, registries, `server-boot.ts`, layout re-export). `NestReactModule` loads `server-boot.ts`. You do not write `islands.ts` or `client/entry.tsx`.

Shared client context is optional. Point `runtime.entry` at a module that exports `ClientRuntime`. If omitted, the bundler emits a pass-through. This starter’s `useTheme()` lives in `src/runtime/`.

## 8. Build And Run

```bash
npm run build:client
npm run view:dev
```

Open `http://localhost:3000`. Island and runtime edits Fast Refresh in the open browser. Page, layout, and Nest service edits reload the document automatically.

Output:

```txt
.nest-react/generated/     # boot, registries, layout, client-styles
public/nest-react/         # runtime.js in dev, runtime-[hash].js in production
```

## What Happens After A Save

1. The island `fetch`es `POST /note`.
2. Nest runs the feature controller (guards, pipes, service).
3. JSON comes back; the island `useState` updates.
4. Headings **outside** the island stay as they were until the next document render.

## Best Practices

- Keep framework code in `src/core`; keep *your* app anywhere else.
- Do not treat `src/welcome`, `src/note`, or `src/pulse` as a required skeleton.
- Put chrome in `layout.tsx`; put page body in the page module.
- Do not author `#nr-runtime` / `#nr-document`.
- Use `hydrate` when the island should be visible before JS; use `mount` for controls that can appear after JS.
- Pass UI data as island props; mutate through Nest routes, not a package RPC.
- Keep business logic in Nest providers.

## Current Limitations

- Guard island `POST` routes like any Nest API (CSRF if you use cookies).
- No PostCSS, Tailwind, or Vite `?url` / `?raw`.
- CSS modules work in client islands, not in server pages.
