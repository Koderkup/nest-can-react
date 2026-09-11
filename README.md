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
- Shared client React context through an app `ClientRuntime` wrapper (`useSession()` in the demo).
- React client hooks: `useLoad()`, `useCommit()`, and `usePendingLoad()`.
- Client-side navigation that swaps `#nr-document` without a full reload.
- A package-owned internal transport through `NestReactModule`.
- Manifest-based island mounting with no user-authored `data-nest-*` attributes.
- esbuild client bundling with per-island code splitting (no Vite, no webpack).
- A polished demo with Home, Users, and Dashboard pages.

## Core Idea

Nest handles the application.

React handles the UI.

Server React can access Nest providers:

```tsx
export const usersLoad = load('users:list', async () => {
  return inject<UsersService>(UsersService).findAll();
});

export default async function UsersPage() {
  const users = await usersLoad();

  return (
    <Island
      mode="hydrate"
      name="UserCreator"
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

**You do not need to copy `src/demo/` to build a first app.** That folder is this repository’s sample application. The framework does not require `pages/`, `services/`, or `load-keys.ts` to live in those paths.

What *is* required is a small set of **roles**, not a specific tree. Point `nest.react.json` at your files, name island modules `*.island.tsx`, and include `#nr-runtime` plus `#nr-document` in the HTML document.

See [Creating Your First App](docs/first-app.md#folder-structure-is-not-the-demo) for the required vs optional layout.

This repo looks like:

```txt
nest.react.json                 # client entry, runtime entry, island globs
src/
  core/                         # framework (treat as the future package)
  demo/                         # sample app only — not a required layout
    app.runtime.tsx             # ClientRuntime (shared client context)
    client/entry.tsx            # browser boot
    islands.ts                  # server registerIslandComponents + runtime
    islands/*.island.tsx
    pages/*.page.tsx
    services/
    components/layout.tsx       # must include #nr-runtime and #nr-document
  app.controller.ts
  app.module.ts
  main.ts                       # initializeFrontendDI + import islands.ts
.nest-react/generated/          # written by build:client
public/nest-react/              # hashed runtime + island chunks
```

`src/core` is the package/framework layer.

`src/demo` is one way to organize an app that consumes that layer.

## Core APIs

### `renderPage(Page, moduleRef, options?)`

Renders a server React page inside a Nest-aware context.

Modes:

- `static` (default) — `renderToStaticMarkup`
- `hydrated` — `renderToString`
- `streaming` — pipeable stream into an Express `Response`

It collects load results and island descriptors, then injects:

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
<Island
  mode="hydrate"
  name="GreetingEditor"
  props={{
    initialMessage: greeting,
    loadKey: greetingLoad.key,
    updateGreeting: updateGreetingCommit.ref,
  }}
/>
```

- `mode="mount"` (default): empty `<div id="nr-i0">`. The client portals the component in.
- `mode="hydrate"`: the island is SSR’d into that host (wrapped in `ClientRuntime` so context matches), then hydrated on first load.

The `name` must match a discovered `*.island.tsx` export (for example `GreetingEditor` from `GreetingEditor.island.tsx`).

### `NestReactModule.forRoot()`

Adds the package-owned internal transport:

```txt
POST /_nr/commit
POST /_nr/loads
GET  /_nr/loads/:key
```

## Client APIs

### `useLoad(key)` / `usePendingLoad(key)` / `useCommit(ref)`

Read refreshed server data, pending state, and mutations through `/_nr`.

### Shared runtime context

Export `ClientRuntime` from the file named in `nest.react.json` → `runtime.entry`. Register it on the server with `registerClientRuntime`. Islands can use context from that tree (the demo’s `useSession()`).

Hydrate-mode islands get their own React root on the host node (so SSR HTML can be hydrated). Context still matches because the same `ClientRuntime` wraps each island; session-like state that must survive multiple roots should live in a module store behind that provider, as the demo does.

## Demo Routes

| Route | What it shows |
| --- | --- |
| `/` | Server greeting plus a `hydrate` `GreetingEditor` island |
| `/users` | Server user list plus a `hydrate` `UserCreator` island |
| `/dashboard` | Server summary cards plus a `mount` `DashboardControls` island (streaming shell) |

## Build Scripts

```bash
npm install
npm run build:client    # islands, runtime, public/nest-react
npm run build           # Nest server
npm run build:all
npm run start:dev
```

`start:dev` watches the Nest server only. After changing client islands, runtime, or `entry.tsx`, run `npm run build:client` again.

## How The Request Flow Works

1. Browser requests a page such as `/users`.
2. Nest routes the request to `AppController`.
3. The controller calls `renderPage(...)`.
4. The server page calls `load()` and `Island`.
5. HTML is returned with `#nr-runtime`, `#nr-document`, and `nr-manifest`.
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
- No first-class CSS / image / font / SVG imports in the client bundler.
- No true React Server Components Flight protocol.
- Test coverage for core behavior is still thin.
- `start:dev` does not rebuild client assets automatically.

## More Docs

- [Creating Your First App](docs/first-app.md)
- [Core Concepts](docs/core-concepts.md)
