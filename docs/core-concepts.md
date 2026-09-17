# Core Concepts

This document explains the framework layer in `src/core`.

The current implementation is a working prototype. It proves the model, but it is not production ready yet.

## Design Principle

Nest remains the application framework.

React becomes the rendering layer.

That means:

- Nest controllers decide which page is rendered.
- Nest modules register providers.
- Nest DI owns services and application state.
- React server pages compose HTML.
- Client islands add focused browser interactivity.
- Client islands mutate by calling server `commit()` refs.
- Shared client UI state uses React context via `ClientRuntime` (see islands below).

Application folder layout is **not** part of this contract. `src/welcome`, `src/note`, and `src/pulse` are a sample. Required wiring is `nest.react.json`, `layout.tsx`, `*.island.tsx`, and `NestReactModule.forRoot()`. Details: [Creating Your First App](first-app.md#folder-structure-is-not-the-starter).

## `src/core`

```txt
src/core/
  index.ts
  nest/                  # Nest wiring
  render/                # SSR document
  island/                # server Island + registry
  data/                  # load / commit / DI context
  assets/                # static + SSR asset URLs
  errors/                # client-hook-on-server error page
  client/
    hooks.ts
    mount.tsx            # installClientRuntime, hydrate vs portal
    navigation.ts        # SPA swap of #nr-document
    runtime.ts           # manifest, load refresh, commit fetch
    styles.ts            # ensure stylesheet links on SPA navigation
  build/                 # esbuild client bundler
```

## Render Context

`context.ts` tracks the active Nest `ModuleRef`, load results, and island entries (`id`, `name`, `mode`, `props`). `renderPage()` runs the page inside `AsyncLocalStorage` so `inject()` and `Island` work without threading services through every component.

## Dependency Injection

```ts
inject<T>(token): T
```

Resolves from the active Nest module context. Not fully request-scoped yet.

## Server Rendering

```ts
renderPage(Page, moduleRef, options?)
```

Options:

- `{ mode: 'static' }` — default, `renderToStaticMarkup`
- `{ mode: 'hydrated' }` — `renderToString`
- `{ mode: 'streaming', response }` — pipeable stream

`renderPage` wraps the page in the configured layout, then injects:

- stylesheet `<link>` tags for `client.styles` and the current page’s island CSS
- `#nr-runtime` — empty host for the shared client runtime root
- `#nr-document` — page body that client navigation replaces
- `#nr-manifest` — JSON loads + islands
- hashed runtime `<script type="module">` and island `modulepreload` hints

Asset URLs come from `public/nest-react/manifest.json` (written by `npm run build:client`).

## `load()` / `commit()` / `revalidate()`

- `load(key, handler)` — server read; result is stored in the page manifest.
- `commit(id, handler)` — server mutation; pass `commit.ref` into islands.
- `revalidate(...keys)` — after a commit, the client refreshes those keys via `POST /_nr/loads`.

Load keys should be stable and specific (`home:greeting`, `users:list`).

## `Island`

```tsx
import { GreetingEditor } from './islands/GreetingEditor.island';

<Island
  mode="hydrate" // or "mount" (default)
  name={GreetingEditor}
  props={{ ... }}
/>
```

Pass the island component as `name`. The framework resolves it to the generated registry key (the `*.island.tsx` export). String names still work as an escape hatch.

| Mode | Server HTML | Client |
| --- | --- | --- |
| `mount` | Empty `<div id="nr-i0">` | `createPortal` from the runtime root into that host |
| `hydrate` | Same host, inner HTML from `renderToString(<ClientRuntime><Component /></ClientRuntime>)` | `hydrateRoot` on that host on first load; after SPA navigation, `createRoot` on the new host so session state does not fight leftover SSR |

Do not portal into a hydrate host that still contains SSR markup: `createPortal` **appends**, which duplicates the island (dead HTML plus a live tree). That is why hydrate islands use `hydrateRoot` on the host instead of a portal into existing inner HTML.

## Client Runtime And Shared Context

`installClientRuntime(registry, ClientRuntime)`:

1. Preloads island modules listed in the current manifest (so the first paint can hydrate).
2. `createRoot(#nr-runtime)` with `<ClientRuntime><IslandOutlet /></ClientRuntime>`.
3. Portals **mount** islands from that tree (one React tree → context works as usual).
4. Hydrates **hydrate** islands on their hosts, each wrapped in the same `ClientRuntime`.

`ClientRuntime` is your app component (`runtime.entry`, re-exported as `.nest-react/generated/client-runtime.ts`). Register it on the server with `registerClientRuntime` so hydrate SSR matches the client (otherwise `useContext` falls back and you can get `visits: 0` in static HTML vs a live island).

Hydrate islands are separate roots (required to attach to existing DOM). React context does not cross roots by itself. The starter’s `useTheme()` still feels like context: the provider is the API, and the theme lives in a module store plus `useSyncExternalStore` so every root reads the same value.

Portal keys are `island.id` only. Including the runtime `version` in the key remounts islands on every load refresh.

## Client Navigation

`installNavigation` intercepts same-origin `<a>` clicks, fetches HTML, and replaces `#nr-document` innerHTML.

`innerHTML` does **not** keep `<script id="nr-manifest">`. The navigator copies manifest text from the parsed response and writes it back before `reloadManifest()`.

Before swapping the document, hydrate-mode roots are unmounted so React does not own detached nodes.

## Client Hooks

`src/core/client/hooks.ts`:

- `useLoad(key)` — manifest data; updates after refresh
- `usePendingLoad(key)` — refresh in flight
- `useCommit(ref)` — `execute`, `fromSubmitEvent`, `pending`, `error`

Islands must not submit forms natively if they use `useCommit` (call `preventDefault`).

## Internal Transport

```txt
POST /_nr/commit
POST /_nr/loads
GET  /_nr/loads/:key
```

Registered by `NestReactModule`. Application controllers stay on user-facing routes.

## Client Bundle

Built by `src/core/build/build-client.mjs` (`npm run build:client`).

Config (`nest.react.json`):

- `layout` — server layout module (default layout if omitted)
- `client.outDir` / `client.publicPath`
- `client.codeSplitting` — per-island chunks when true
- `client.styles` — global CSS files always linked on every page
- `client.entry` — optional override of generated client boot
- `runtime.entry` — optional `ClientRuntime`
- `islands.include` / `islands.exclude`

Islands and `runtime.entry` can import CSS the way Vite does:

```ts
import './GreetingEditor.css';
import mark from './session-mark.svg';
import classes from './editor.module.css';
```

`import './file.css'` is a side effect (extracted to a hashed stylesheet). `import url from './file.svg'` (png/jpeg/gif/webp/avif/ico/woff/woff2/ttf/eot) is a hashed public URL. CSS `url(./font.woff2)` is rewritten too. CSS modules work in **client islands only**.

Do not import CSS or assets from server pages or `layout.tsx` — Nest does not bundle them. Put global CSS in `client.styles`. Put page-specific CSS next to islands.

Output:

- `.nest-react/generated/client-entry.tsx`
- `.nest-react/generated/client-registry.ts`
- `.nest-react/generated/server-registry.ts`
- `.nest-react/generated/client-runtime.ts`
- `.nest-react/generated/client-styles.ts`
- `.nest-react/generated/server-layout.ts`
- `.nest-react/generated/server-boot.ts`
- `.nest-react/generated/asset-urls.json`
- `public/nest-react/runtime-[hash].js`
- `public/nest-react/*.css`
- `public/nest-react/chunks/*`
- `public/nest-react/assets/*`
- `public/nest-react/manifest.json`

## Starter App

`src/welcome`, `src/note`, and `src/pulse` are optional sample features: module, controller, service, page, islands, load-keys. They are not the required application skeleton.

## Current Performance Behavior

- Server `load()` runs only for the page being rendered.
- With `codeSplitting: true`, only the current page’s island chunks are preloaded.
- `view:dev` watches client chunks and Fast Refresh islands; page/layout/service edits full-reload.

## Current Asset Support

Supported:

- static files from `public/` at `/assets`
- global CSS via `client.styles` (linked in `<head>` before JS)
- `import './file.css'` and `.module.css` from islands / `runtime.entry`
- hashed image, font, and SVG URLs from JS imports and CSS `url()`
- hashed JS chunks from esbuild

Not implemented: PostCSS, Tailwind, Vite `?url` / `?raw`, CSS modules in server pages.

## Server HTML vs Island HTML After Commit

A heading rendered **outside** an island is static until the next document render (full load or a future fragment refresh). The same value **inside** an island updates through `useLoad()` after `revalidate()`.

That is intentional with the current primitives.

## Production Readiness Checklist

- request-scoped providers
- signed commit refs and CSRF protection
- input validation and structured errors
- PostCSS / Tailwind / asset query suffixes
- tests for mount vs hydrate and SPA manifest restore
- npm package exports
- public vs private API docs
