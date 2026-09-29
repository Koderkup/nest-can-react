# Glossary

Alphabetical terms used in nest-can-react documentation. See [Documentation hub](README.md) for the full guide list.

---

**Adapter (HTTP)** — Nest platform driver: Express (default) or Fastify. Configured via `NestReactModule.forRoot({ adapter })`. See [Adapters](concepts/adapters.md).

**Client component / island** — React module marked `'use client'`; hydrates in the browser for state and events. See [Server and client components](concepts/server-and-client-components.md).

**Fast Refresh** — Rspack/React hot update path for client components and CSS. Proxied at `/__nest_can_react/rspack-hmr`. See [Development and HMR](concepts/development-hmr.md).

**Flight** — React Server Components wire protocol; serialized tree updates (`text/x-component`). See [Streaming and Flight](concepts/streaming-and-flight.md).

**Guard (Nest)** — `@UseGuards()` on controllers; runs before `render()`. See [Security](concepts/security.md).

**HMR (hot module replacement)** — Dev-time updates without full restart; split between RSC refetch and Fast Refresh. See [Development and HMR](concepts/development-hmr.md).

**inject()** — Resolve Nest providers during Server Component render. See [inject() and REQUEST](concepts/inject-and-request.md).

**Island** — Colloquial term for a `'use client'` component embedded in server UI.

**Layout** — `layout.tsx` wrapping all pages (`{children}`). See [Server and client components](concepts/server-and-client-components.md).

**Layout meta** — Per-request head metadata via `setLayoutMeta` / `useLayoutMeta`. See [Layout meta](concepts/layout-meta.md).

**nest.react.json** — CLI config: pages, layout, client output. See [Configuration](concepts/configuration.md).

**NestReactModule** — Nest module serving assets and dev WebSocket proxies. See [NestReactModule](concepts/nest-react-module.md).

**Page ref** — Opaque handle from `createPageRef('id')` in generated `react-pages.ts`. See [Render and page refs](concepts/render-and-page-refs.md).

**react-pages.ts** — Generated file exporting page refs for controllers; do not hand-edit. See [Render and page refs](concepts/render-and-page-refs.md).

**Revalidation / refetch** — Client refetches current route as Flight (`refresh()`, or after `useCommit`). See [Mutations and revalidation](concepts/mutations-and-revalidation.md).

**RSC (React Server Components)** — Components that run on the server only; default for pages and layout. See [Server and client components](concepts/server-and-client-components.md).

**Server Component** — React component without `'use client'`; rendered on server, included in Flight/HTML. See [Server and client components](concepts/server-and-client-components.md).

**Stream / flush** — Response body sent incrementally; HTTP side effects applied before commit. See [Streaming and Flight](concepts/streaming-and-flight.md).

**use server-entry** — Directive on `*.page.tsx` marking a page root for the bundler. See [Server and client components](concepts/server-and-client-components.md).

**useCommit** — Client hook POSTing JSON to Nest then refetching RSC. See [Mutations and revalidation](concepts/mutations-and-revalidation.md).

---

### Render-time HTTP helpers

**clearCookie()** — Expire a cookie during render. See [HTTP during render](concepts/http-during-render.md).

**getCookie(name)** — Read incoming request cookie header during render.

**getCookies()** — Return the **outgoing** cookie queue for this render (not request cookies).

**redirect(url, status?)** — Stop render and respond with HTTP redirect. See [HTTP during render](concepts/http-during-render.md).

**setCookie(name, value, options?)** — Queue `Set-Cookie` during render.

**setStatus(code)** — Set HTTP status during render.

---

### Paths

**.nest-can-react/** — Build output: generated entries, `server/rsc.js`. See [CLI and build](concepts/cli-and-build.md).

**public/nest-can-react/** — Browser JS/CSS served by Nest. See [CLI and build](concepts/cli-and-build.md).

**`*.page.tsx`** — Page root files discovered by the CLI. See [Render and page refs](concepts/render-and-page-refs.md).
