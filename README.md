# Nest React Prototype

A NestJS-native React rendering prototype.

The goal is not to bolt a separate frontend framework onto Nest. The goal is to let **NestJS own the application runtime** while **React becomes a first-class UI/rendering layer** inside that runtime.

Current status: this is a working architecture demo, not a production-ready npm package yet.

## What It Provides

- Server-rendered React pages handled by Nest controllers.
- Nest dependency injection from server React through `inject()`.
- Server-side data reads with `load()`.
- Server-side mutations with `commit()`.
- Key-based refresh with `revalidate()`.
- Client React islands with two modes: `mount` (empty host, client render) and `hydrate` (SSR HTML, then hydrate).
- Shared client React context through an app `ClientRuntime` wrapper (`useTheme()` in the starter).
- React client hooks: `useLoad()`, `useCommit()`, and `usePendingLoad()`.
- Client-side navigation that swaps `#nr-document` without a full reload.
- A package-owned internal transport through `NestReactModule`.
- Manifest-based island mounting with no user-authored `data-nest-*` attributes.
- esbuild client bundling with per-island code splitting, CSS, and hashed static assets (no Vite, no webpack).
- A disposable starter with Welcome, Note, and Pulse feature folders.

## Core Idea

Nest handles the application.

React handles the UI.

Server React can access Nest providers:

```tsx
import { UserCreator } from './islands/UserCreator.island';

export const usersLoad = load('users:list', async () => {
  return inject<UsersService>(UsersService).findAll();
});

export default async function UsersPage() {
  const users = await usersLoad();

  return (
    <Island
      mode="hydrate"
      name={UserCreator}
      props={{ initialUsers: users }}
    />
  );
}
```

Client React islands handle browser interactivity:

```tsx
function UserCreator({ createUser }: Props) {
  const commit = useCommit(createUser);

  return (
    <form onSubmit={(event) => commit.fromSubmitEvent(event)}>
      <input name="name" />
      <button>Create user</button>
    </form>
  );
}
```

## Folder Structure: What Matters

**You do not need to copy this repo’s feature folders.** The package owns client boot, island registration, static `/assets`, DI init, and `#nr-runtime` / `#nr-document`.

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
nest.react.json                 # layout, optional runtime, island globs, client.styles
src/
  core/                         # framework (treat as the future package)
  layout.tsx
  assets/                       # global CSS and images
  runtime/                      # ClientRuntime + theme context
  welcome/                      # module, controller, service, page, islands, load-keys
  note/
  pulse/
  app.module.ts
  main.ts                       # NestFactory + listen
.nest-react/generated/          # entry, registries, server-boot (build:client)
public/nest-react/              # hashed runtime, CSS, and assets
```

`src/core` is the package/framework layer.

`welcome` / `note` / `pulse` are starter features. Delete a folder and drop its module from `AppModule` when you replace it.

## Core APIs

### `renderPage(Page, moduleRef, options?)`

Renders a server React page inside a Nest-aware context.

Modes:

- `static` (default) — `renderToStaticMarkup`
- `hydrated` — `renderToString`
- `streaming` — pipeable stream into an Express `Response`

It collects load results and island descriptors, then injects:

- stylesheet `<link>` tags for global CSS and this page’s islands
- modulepreload hints for the runtime and current-page islands
- `<script id="nr-manifest" type="application/json">...</script>`
- `<script type="module" src="/assets/nest-react/runtime-….js"></script>`

The runtime URL comes from `public/nest-react/manifest.json` after `npm run build:client`.

### `inject(token)`

Resolves a Nest provider from the current frontend render/commit context.

```ts
const users = inject<UsersService>(UsersService);
```

Current limitation: this is not fully request-scoped yet.

### `load(key, handler)`

Declares a server-side read. Calling the returned function runs the handler and records the result in the page manifest.

### `commit(id, handler)`

Declares a server-side mutation. Pass `commit.ref` into islands, not URLs.

### `revalidate(...keys)`

Marks load keys stale after a commit. The browser runtime refreshes those keys without reloading the page.

### `Island`

Registers a client island during server render.

```tsx
import { NoteEditor } from './islands/NoteEditor.island';

<Island
  mode="hydrate"
  name={NoteEditor}
  props={{
    initialText: note,
    loadKey: noteLoad.key,
    saveNote: saveNoteCommit.ref,
  }}
/>
```

- `mode="mount"` (default): empty `<div id="nr-i0">`. The client portals the component in.
- `mode="hydrate"`: the island is SSR’d into that host (wrapped in `ClientRuntime` so context matches), then hydrated on first load.

Pass the island component as `name` (for example `NoteEditor` from `NoteEditor.island.tsx`). String names still work as an escape hatch. The registry key stays the discovered export name.

### `NestReactModule.forRoot()`

Registers the internal transport, initializes frontend DI, serves `public/` at `/assets/`, and loads generated island/runtime/layout registration.

```txt
POST /_nr/commit
POST /_nr/loads
GET  /_nr/loads/:key
```

### `setLayoutMeta` / `useLayoutMeta`

Pages call `setLayoutMeta({ title, eyebrow, description, active })`. The shared layout reads it with `useLayoutMeta()`. Do not put `#nr-runtime` or `#nr-document` in the layout; `renderPage` injects those slots.

## Client APIs

### `useLoad(key)` / `usePendingLoad(key)` / `useCommit(ref)`

Read refreshed server data, pending state, and mutations through `/_nr`.

### Shared runtime context

Export `ClientRuntime` from the optional file named in `nest.react.json` → `runtime.entry`. `NestReactModule` registers it from generated code. A first app can omit `runtime.entry`; the bundler emits a pass-through wrapper.

Hydrate-mode islands get their own React root on the host node (so SSR HTML can be hydrated). Context still matches because the same `ClientRuntime` wraps each island; theme-like state that must survive multiple roots should live in a module store behind that provider, as `useTheme()` does.

## Starter Routes

| Route | What it shows |
| --- | --- |
| `/` | Tagline `now Nest can react` plus a `hydrate` theme-toggle island |
| `/note` | In-memory note plus a `hydrate` editor island |
| `/pulse` | Beat count plus a `mount` beat island (streaming shell) |

## Build Scripts

```bash
npm install
npm run build:client    # islands, runtime, public/nest-react (hashed, production)
npm run build           # Nest server
npm run build:all
npm run view:dev        # esbuild watch + Nest watch + browser HMR
```

`view:dev` (also `start:dev`) watches client islands and the Nest server together. Island/runtime/CSS edits Fast Refresh in the browser without wiping `useState` or the theme store. Page, layout, and Nest service edits trigger a full document reload once Nest is back up. Production `build:client` still emits hashed filenames and does not include the HMR client.

## How The Request Flow Works

1. Browser requests a page such as `/note`.
2. Nest routes the request to that feature’s controller.
3. The controller calls `renderPage(...)`.
4. The server page calls `setLayoutMeta`, `load()`, and `Island`.
5. `renderPage` wraps the page in `layout.tsx` and injects `#nr-runtime`, `#nr-document`, and `nr-manifest`.
6. The browser loads the hashed runtime module.
7. `installClientRuntime` preloads this page’s island chunks.
8. `hydrate` islands hydrate their SSR markup; `mount` islands portal into empty hosts.
9. `useCommit()` posts to `/_nr/commit`; `revalidate()` refreshes `/_nr/loads`.
10. Client navigation swaps `#nr-document` and restores `#nr-manifest` (script tags are not preserved by `innerHTML`).

## Current Limitations

- Not an npm package yet; `src/core` is in-repo.
- No full request-scoped provider support.
- Internal transport has no CSRF protection; commit refs are not signed.
- Input validation and error serialization are minimal.
- No PostCSS, Tailwind, CSS modules on server pages, or Vite `?url` / `?raw`.
- No true React Server Components Flight protocol.
- Test coverage for core behavior is still thin.

## More Docs

- [Creating Your First App](docs/first-app.md)
- [Core Concepts](docs/core-concepts.md)
