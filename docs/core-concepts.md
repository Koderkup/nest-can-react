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

`nest-can-react dev` (push-only — no polling):

- **Same-origin WebSockets** on your Nest port (e.g. `3000`):
  - `/__nest_can_react/hmr` — RSC hub (`hello`, `building`, `rsc-update`, `build-error`, `build-ok`). Server UI changes refetch Flight for the current URL. Failed compiles show an overlay and recover on the next successful build.
  - `/__nest_can_react/rspack-hmr` — proxied to the client dev-server for **Fast Refresh** and CSS HMR. If Fast Refresh cannot apply an update, the page does a guarded full reload.
- Internal hubs: RSC on `hmrPort` (default `9101`), Rspack Fast Refresh on `clientDevPort` (default `9102`); `NestReactModule` attaches upgrade proxies at Nest bootstrap when `NEST_CAN_REACT_DEV=1`. Fast Refresh talks to the client compiler websocket; RSC signals stay same-origin on the Nest port.
- Nest `--watch` uses **`tsconfig.build.json`** (`.ts` only) and ignores `**/*.tsx` / `**/*.css` — UI edits do **not** restart Nest
- Change Nest routes/guards/DI in `.controller.ts` / `.service.ts` → Nest restarts, the HMR socket reconnects, and the current page refetches Flight
- **State:** `'use client'` islands keep React state across Fast Refresh and across a safe RSC refetch. A full reload is used only when an update cannot be applied safely (declined HMR, runtime error recovery, or a reload loop-guarded failure)
- Adding or removing `*.page.tsx` files regenerates entries without restarting `nest-can-react dev`

## Security

Keep auth and mutations on Nest routes. Do not treat Flight as a replacement for guards. CSRF still applies when using cookie sessions.
