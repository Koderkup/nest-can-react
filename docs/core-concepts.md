# Core concepts

Nest remains the application framework. React Server Components are the UI layer. **Flight** is the wire protocol.

- Nest controllers decide which page to stream and load data via DI.
- Nest modules, guards, pipes, and interceptors own security and HTTP.
- Pages are **Server Components** (`'use server-entry'` on the page module).
- Interactive UI is a **`'use client'`** component (the island concept).
- Mutations go to Nest routes (`useCommit`); Nest guards still apply.
- Rendering is **streaming only** (HTML + embedded Flight payload).

Install into an existing Nest app with `npm install nest-can-react` and `npx nest-can-react init`. Wire `NestReactModule.forRoot()`, add `*.page.tsx` files, and run `nest-can-react build` or `dev`.

## Public API

From `nest-can-react`:

- `NestReactModule`
- `renderPage(pageName, props, { response, request? })`
- `NestLink`
- `setLayoutMeta` / `useLayoutMeta` / `getLayoutMeta`

From `nest-can-react/client`:

- `useCommit` — POST JSON to a Nest route, then revalidate via RSC refresh
- `refresh` — re-fetch the current route as Flight
- `navigateTo` — client navigation + Flight refetch

## Render

```ts
await renderPage('welcome', props, { request, response });
```

`pageName` matches the `*.page.tsx` basename (`welcome.page.tsx` → `'welcome'`).

The response is always a stream:

- Browser navigations (`Accept: text/html`) → SSR HTML with injected Flight payload
- Client RSC fetches (`Accept: text/x-component`) → Flight only

## Server vs client components

| Directive | Runs where | Use for |
| --- | --- | --- |
| `'use server-entry'` (page) | Server (RSC) | Page roots discovered by the bundler |
| (default / no directive) | Server (RSC) | Layouts, presentational server UI |
| `'use client'` | Browser (hydrated) | State, effects, event handlers |

Client components share one React tree after hydration, so React context works across them.

## Bundler output

`nest-can-react build` / `dev` use Rspack dual graphs (client + server RSC/SSR):

```txt
.nest-can-react/generated/   # codegen entries
.nest-can-react/server/      # RSC Node bundle (rsc.js)
public/nest-can-react/       # browser assets
```

## HMR

`nest-can-react dev`:

- Rspack watches the RSC graph; the client graph runs on `@rspack/dev-server` with React Refresh (`clientDevPort`, default `9102`, assets still written under `public/nest-can-react` for Nest to serve)
- Nest runs with `--watch`
- After each successful rebuild, the websocket on `hmrPort` (default `9101`) triggers a Flight refetch and then a debounced full-page reload so you always see changes (Fast Refresh alone is unreliable with `hydrateRoot(document)`)
- The client dev-server on `clientDevPort` (default `9102`) still builds assets and can apply module hot updates before the reload runs

## Security

Keep auth and mutations on Nest routes. Do not treat Flight as a replacement for guards. CSRF still applies when using cookie sessions.
