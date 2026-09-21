# Nest React Prototype

A NestJS-native React rendering prototype.

The goal is not to bolt a separate frontend framework onto Nest. The goal is to let **NestJS own the application runtime** while **React becomes a first-class UI/rendering layer** inside that runtime.

Current status: this is a working architecture demo, not a production-ready npm package yet.

## What It Provides

- Server-rendered React pages handled by Nest controllers.
- Controllers load data with Nest DI and pass props into `renderPage`.
- Client React islands with two modes: `mount` (empty host, client render) and `hydrate` (SSR HTML, then hydrate).
- Shared client React context through an app `ClientRuntime` wrapper (`useTheme()` in the starter).
- Islands talk to Nest with ordinary `fetch` to feature routes.
- Client-side navigation that swaps `#nr-document` without a full reload.
- Manifest-based island mounting with no user-authored `data-nest-*` attributes.
- esbuild client bundling with per-island code splitting, CSS, and hashed static assets (no Vite, no webpack).
- A disposable starter with Welcome, Note, and Pulse feature folders.

## Core Idea

Nest handles the application.

React handles the UI.

Controllers load data and pass it into the page:

```ts
@Get()
index() {
  return renderPage(NotePage, { text: this.notes.getText() }, { mode: 'hydrated' });
}
```

TSX controllers can pass an element instead:

```tsx
return renderPage(<NotePage text={text} />, { mode: 'hydrated' });
```

```tsx
export default function NotePage({ text }: { text: string }) {
  return (
    <Island mode="hydrate" name={NoteEditor} props={{ text }} />
  );
}
```

Client islands mutate through Nest HTTP:

```tsx
function NoteEditor({ text }: { text: string }) {
  const [value, setValue] = useState(text);

  async function save() {
    const response = await fetch('/note', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: value }),
    });
    const result = await response.json();
    setValue(result.text);
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <textarea value={value} onChange={(event) => setValue(event.target.value)} />
      <button>Save</button>
    </form>
  );
}
```

## Folder Structure: What Matters

**You do not need to copy this repo’s feature folders.** The package owns client boot, island registration, static `/assets`, and `#nr-runtime` / `#nr-document`.

Required app files:

- `main.ts` / `AppModule` / providers / HTML controllers
- `layout.tsx` (named in `nest.react.json` → `layout`)
- page modules rendered via `renderPage`
- `*.island.tsx` files

Optional: `app.runtime.tsx` (`runtime.entry`) for shared client context.

Not required: `islands.ts`, `client/entry.tsx`, hand-written registries, document slot ids.

See [Creating Your First App](docs/first-app.md#folder-structure-is-not-the-starter).

This repo looks like:

```txt
packages/nest-react/            # publishable package + CLI
  templates/starter/            # copied by `nest-react init`
src/
  layout.tsx
  assets/
  welcome/
  app.module.ts
  main.ts
nest.react.json
.nest-react/generated/
public/nest-react/
```

Import the runtime from `nest-react`. Scaffold a new app with `npx nest-react init my-app`.

`welcome` is the playground starter feature.

## Core APIs

### `renderPage(Page, props, options?)` / `renderPage(<Page />, options?)`

Renders a server React page. The controller loads data; the page only receives props.

`.ts` controller (the package calls `createElement`):

```ts
return renderPage(NotePage, { text }, { mode: 'hydrated' });
```

`.tsx` controller:

```tsx
return renderPage(<NotePage text={text} />, { mode: 'hydrated' });
```

Modes:

- `static` (default) — `renderToStaticMarkup`
- `hydrated` — `renderToString`
- `streaming` — pipeable stream into an Express `Response`

It collects island descriptors, then injects:

- stylesheet `<link>` tags for global CSS and this page’s islands
- modulepreload hints for the runtime and current-page islands
- `<script id="nr-manifest" type="application/json">...</script>`
- `<script type="module" src="/assets/nest-react/runtime-….js"></script>`

The runtime URL comes from `public/nest-react/manifest.json` after `npm run build:client`.

### `Island`

Registers a client island during server render.

```tsx
import { NoteEditor } from './islands/NoteEditor.island';

<Island
  mode="hydrate"
  name={NoteEditor}
  props={{ text }}
/>
```

- `mode="mount"` (default): empty `<div id="nr-i0">`. The client portals the component in.
- `mode="hydrate"`: the island is SSR’d into that host (wrapped in `ClientRuntime` so context matches), then hydrated on first load.

Pass the island component as `name` (for example `NoteEditor` from `NoteEditor.island.tsx`). String names still work as an escape hatch. The registry key stays the discovered export name.

### `NestReactModule.forRoot()`

Serves `public/` at `/assets/` and loads generated island/runtime/layout registration. Mutations are ordinary Nest `@Post` routes on your feature controllers, not a package RPC.

### `setLayoutMeta` / `useLayoutMeta`

Pages call `setLayoutMeta({ title, eyebrow, description, active })`. The shared layout reads it with `useLayoutMeta()`. Do not put `#nr-runtime` or `#nr-document` in the layout; `renderPage` injects those slots.

## Client APIs

### Shared runtime context

Export `ClientRuntime` from the optional file named in `nest.react.json` → `runtime.entry`. `NestReactModule` registers it from generated code. A first app can omit `runtime.entry`; the bundler emits a pass-through wrapper.

Hydrate-mode islands get their own React root on the host node (so SSR HTML can be hydrated). Context still matches because the same `ClientRuntime` wraps each island; theme-like state that must survive multiple roots should live in a module store behind that provider, as `useTheme()` does.

## Starter Routes

| Route | What it shows |
| --- | --- |
| `/` | Tagline `now Nest can react` plus a `hydrate` theme-toggle island |
| `/note` | In-memory note plus a `hydrate` editor island |
| `/pulse` | Beat count plus a `mount` beat island |

## Build Scripts

```bash
npm install
npm run build:client    # nest-react build
npm run build           # Nest server
npm run build:all
npm run view:dev        # nest-react dev
```

`view:dev` (also `start:dev`) watches client islands and the Nest server together. Island/runtime/CSS edits Fast Refresh in the browser without wiping `useState` or the theme store. Page, layout, and Nest service edits trigger a full document reload once Nest is back up. Production `build:client` still emits hashed filenames and does not include the HMR client.

## How The Request Flow Works

1. Browser requests a page such as `/note`.
2. Nest routes the request to that feature’s controller.
3. The controller calls `renderPage(...)`.
4. The server page calls `setLayoutMeta` and `Island`.
5. `renderPage` wraps the page in `layout.tsx` and injects `#nr-runtime`, `#nr-document`, and `nr-manifest`.
6. The browser loads the hashed runtime module.
7. `installClientRuntime` preloads this page’s island chunks.
8. `hydrate` islands hydrate their SSR markup; `mount` islands portal into empty hosts.
9. Islands `fetch` feature routes (for example `POST /note`). Guards on those routes are Nest’s.
10. Client navigation swaps `#nr-document` and restores `#nr-manifest` (script tags are not preserved by `innerHTML`).

## Current Limitations

- Island `fetch` routes need the same Nest guards/CSRF you would put on any JSON API.
- No PostCSS, Tailwind, CSS modules on server pages, or Vite `?url` / `?raw`.
- No true React Server Components Flight protocol.
- Test coverage for core behavior is still thin.

## More Docs

- [Creating Your First App](docs/first-app.md)
- [Core Concepts](docs/core-concepts.md)
