# Creating your first app

Nest owns the app. React owns the UI. Controllers load data with Nest DI and pass it into `renderPage`. Islands talk back over ordinary Nest HTTP.

## Scaffold

```bash
npx nest-react init my-app
cd my-app
npm install
npm run view:dev
```

Or clone [nest-react-template](https://github.com/acefolioDev/nest-react-template).

You do not copy framework source into the app. Import `nest-react`.

## What the framework looks for

| Role | What it is | How you point at it |
| --- | --- | --- |
| Config | Island globs, output dir, layout, styles | `nest.react.json` |
| Layout | Document chrome (`<html>` / nav / `{children}`) | `layout` |
| Islands | Browser components | `*.island.tsx` matching `islands.include` |
| Nest wiring | Assets, generated boot | `NestReactModule.forRoot()` |

Island **file name** matters: `ArchitectureMap.island.tsx` must export `ArchitectureMap`, and `<Island name={ArchitectureMap} />` must pass that component. The directory name does not.

`nest-react` generates client entry, registries, and `server-boot.ts`. It injects `#nr-runtime` and `#nr-document`. Do not author those files.

## Example `nest.react.json`

```json
{
  "layout": "src/layout.tsx",
  "islands": {
    "include": ["src/**/*.island.tsx"],
    "exclude": ["src/**/*.test.tsx", "src/**/*.spec.tsx"]
  },
  "client": {
    "outDir": "public/nest-react",
    "publicPath": "/assets/nest-react",
    "codeSplitting": true,
    "styles": ["src/assets/layout.css"]
  }
}
```

`publicPath` must match how Nest serves `public/` (`/assets/` prefix → files in `public/nest-react/` are `/assets/nest-react/...`).

List global CSS in `client.styles`. Do not import CSS from `layout.tsx` or other server files. Islands may import their own CSS:

```tsx
import './ArchitectureMap.css';
```

## 1. Import the module

```ts
import { Module } from '@nestjs/common';
import { NestReactModule } from 'nest-react';
import { WelcomeModule } from './welcome/welcome.module';

@Module({
  imports: [NestReactModule.forRoot(), WelcomeModule],
})
export class AppModule {}
```

## 2. Bootstrap Nest

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
```

Run `npm run build:client` (`nest-react build`) before the first production start so `.nest-react/generated` exists. `npm run view:dev` does that for you.

## 3. Nest service

Ordinary Nest. React does not replace modules or DI.

```ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class GreetingService {
  sayHello() {
    return 'Hello from Nest DI';
  }
}
```

## 4. Layout and page

`layout.tsx` owns `<html>` chrome. Do not add `#nr-runtime` or `#nr-document`.

```tsx
import React, { ReactNode } from 'react';
import { useLayoutMeta } from 'nest-react';

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
import { Island, setLayoutMeta } from 'nest-react';
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

## 5. Render from a controller

```ts
import { Body, Controller, Get, Header, Post } from '@nestjs/common';
import { renderPage } from 'nest-react';
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

## 6. Client island

```tsx
import React, { useState } from 'react';
import { useCommit } from 'nest-react/client';

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

`useCommit` POSTs JSON, then revalidates the current document (same URL, no full reload). Pass `{ revalidate: false }` to skip. Guard the Nest `POST` like any API.

## 7. Build and run

```bash
npm run build:client
npm run view:dev
```

| Output | What it is |
| --- | --- |
| `.nest-react/generated/` | Boot, registries, layout, client entry |
| `public/nest-react/` | Runtime JS, CSS, chunks, `manifest.json` |

Island and CSS edits Fast Refresh. Page, layout, and Nest service edits reload the document.

## Best practices

- Import the framework from `nest-react`, never copy package source into the app.
- Put chrome in `layout.tsx`; put page body in the page module.
- Use `hydrate` when the island should be visible before JS; use `mount` for controls that can wait.
- Pass UI data as island props; mutate with `useCommit` or a guarded Nest `POST`.
- Keep business logic in Nest providers.
