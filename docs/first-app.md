# Creating your first app

Install `nest-can-react` into an existing NestJS project. Nest owns the app; React owns the UI.

```bash
cd my-nest-app
npm install nest-can-react
npx nest-can-react init
npm install
npm run view:dev
```

Open `/welcome`. `init` does not create a new project. It copies the starter into your Nest app and wires `NestReactModule` into `AppModule`.

## What the framework looks for

| Role | What it is | How you point at it |
| --- | --- | --- |
| Config | Island globs, output dir, layout, styles | `nest.react.json` |
| Layout | Document chrome (`<html>` / nav / `{children}`) | `layout` |
| Islands | Browser components | `*.island.tsx` matching `islands.include` |
| Nest wiring | Assets, generated boot | `NestReactModule.forRoot()` |

Island **file name** matters: `ArchitectureMap.island.tsx` must export `ArchitectureMap`, and `<Island name={ArchitectureMap} />` must pass that component.

`nest-can-react` generates client entry, registries, and `server-boot.ts`. It injects `#nr-runtime` and `#nr-document`. Do not author those files.

## Example `nest.react.json`

```json
{
  "layout": "src/layout.tsx",
  "islands": {
    "include": ["src/**/*.island.tsx"],
    "exclude": ["src/**/*.test.tsx", "src/**/*.spec.tsx"]
  },
  "client": {
    "outDir": "public/nest-can-react",
    "publicPath": "/assets/nest-can-react",
    "codeSplitting": true,
    "styles": ["src/assets/layout.css"]
  }
}
```

`publicPath` must match how Nest serves `public/` (`/assets/` prefix → files in `public/nest-can-react/` are `/assets/nest-can-react/...`).

List global CSS in `client.styles`. Do not import CSS from `layout.tsx` or other server files. Islands may import their own CSS.

## 1. Import the module

`init` adds this for you. Manually:

```ts
import { Module } from '@nestjs/common';
import { NestReactModule } from 'nest-can-react';
import { WelcomeModule } from './welcome/welcome.module';

@Module({
  imports: [NestReactModule.forRoot(), WelcomeModule],
})
export class AppModule {}
```

## 2. Render from a controller

```ts
import { Body, Controller, Get, Header, Post } from '@nestjs/common';
import { renderPage } from 'nest-can-react';
import NotePage from './note.page';
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

TSX controllers can pass an element:

```tsx
return renderPage(<NotePage text={text} />, { mode: 'hydrated' });
```

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
import React from 'react';
import { Island, setLayoutMeta } from 'nest-can-react';
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

- `mode="hydrate"`: island HTML is rendered on the server, then hydrated.
- `mode="mount"`: empty host; the client renders into it.

## 4. Client island

```tsx
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

`useCommit` POSTs JSON, then revalidates the current document. Guard the Nest `POST` like any API.

## 5. Build and run

```bash
npm run build:client
npm run view:dev
```

| Output | What it is |
| --- | --- |
| `.nest-can-react/generated/` | Boot, registries, layout, client entry |
| `public/nest-can-react/` | Runtime JS, CSS, chunks, `manifest.json` |

## Best practices

- Import the framework from `nest-can-react`.
- Put chrome in `layout.tsx`; put page body in the page module.
- Use `hydrate` when the island should be visible before JS; use `mount` for controls that can wait.
- Pass UI data as island props; mutate with `useCommit` or a guarded Nest `POST`.
- Keep business logic in Nest providers.
