# Core Concepts

This document explains the current framework layer in `src/core`.

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

## `src/core`

The package-like layer lives in:

```txt
src/core/
```

It contains:

```txt
client/
  hooks.ts
  runtime.ts
commit.ts
context.ts
index.ts
inject.ts
island.tsx
load.ts
nest-react.controller.ts
nest-react.module.ts
renderer.tsx
```

## Render Context

`context.ts` owns the server-side render context.

It tracks:

- active Nest `ModuleRef`
- load results collected during render
- island entries collected during render

During a page render, `renderPage()` creates a render state and runs the page inside `AsyncLocalStorage`.

This allows server React code to call:

```ts
inject(SomeService)
```

without passing services manually through every component.

## Dependency Injection

`inject.ts` exposes:

```ts
inject<T>(token): T
```

Example:

```ts
const usersService = inject<UsersService>(UsersService);
```

This resolves providers from the active Nest module context.

Current limitation: this is not fully request-scoped yet. Request-scoped providers should be supported later with Nest context IDs.

## Server Rendering

`renderer.tsx` exposes:

```ts
renderPage(Page, moduleRef)
```

It does four things:

1. Creates a render state.
2. Runs the React server page inside the frontend context.
3. Renders the page with `renderToStaticMarkup()`.
4. Injects the page manifest and client bundle script.

The manifest contains:

```ts
{
  transportPath: '/_nr',
  loads: {...},
  islands: [...]
}
```

The HTML receives:

```html
<script id="nr-manifest" type="application/json">...</script>
<script type="module" src="/assets/nest-react/client.js"></script>
```

## `load()`

`load()` is a server read primitive.

It does not create routes.

Example:

```ts
export const usersLoad = load('users:list', async () => {
  return inject<UsersService>(UsersService).findAll();
});
```

Calling `usersLoad()`:

- runs the handler
- records the result under `users:list`
- makes the value available to the page manifest

The browser can later refresh this key through the internal transport.

## Load Keys

Load keys identify data.

Examples:

```ts
'home:greeting'
'users:list'
'dashboard:summary'
```

Good load keys are:

- stable
- descriptive
- specific enough to avoid unnecessary refresh

## `commit()`

`commit()` is a server mutation primitive.

It does not create user-facing routes.

Example:

```ts
export const createUserCommit = commit(
  'users.create',
  async (input: { name?: string; role?: string }) => {
    inject<UsersService>(UsersService).create(input);
    return revalidate('users:list');
  },
);
```

Every commit has:

```ts
createUserCommit.id
createUserCommit.ref
```

`id` is used internally by the server registry.

`ref` is safe to pass to a client island:

```tsx
<Island
  name="UserCreator"
  props={{
    createUser: createUserCommit.ref,
  }}
/>
```

## `revalidate()`

`revalidate()` marks load keys as stale after a mutation.

Example:

```ts
return revalidate('users:list', 'dashboard:summary');
```

The client runtime receives these keys and refreshes them.

The UI keeps old data visible while fresh data loads.

## `Island`

`Island` registers a client component mount point.

Example:

```tsx
<Island
  name="DashboardControls"
  props={{
    initialSummary: summary,
    summaryLoadKey: dashboardSummaryLoad.key,
    refreshDashboard: refreshDashboardCommit.ref,
  }}
/>
```

`Island` currently renders:

```html
<div id="nr-i0"></div>
```

The detailed island metadata goes into the manifest:

```ts
{
  id: 'nr-i0',
  name: 'DashboardControls',
  props: {...}
}
```

This avoids user-authored `data-nest-*` attributes.

## Client Runtime

`src/core/client/runtime.ts` runs in the browser.

It:

- reads `nr-manifest`
- stores initial load data
- tracks pending loads
- posts commits to the internal transport
- refreshes load keys
- notifies React subscribers

Client islands do not call raw URLs. They call commit refs.

## Client Hooks

### `useLoad(key)`

Reads current data for a load key.

```tsx
const users = useLoad<User[]>('users:list');
```

The value updates when the key is refreshed.

### `usePendingLoad(key)`

Returns whether a load key is refreshing.

```tsx
const refreshing = usePendingLoad('users:list');
```

### `useCommit(ref)`

Returns helpers for calling a server commit.

```tsx
const create = useCommit<{ name: string; role: string }>(createUser);

await create.execute({
  name: 'Ada',
  role: 'Engineer',
});
```

The hook exposes:

- `pending`
- `error`
- `execute(input)`
- `fromSubmitEvent(event)`

## Internal Transport

`NestReactModule` registers `NestReactController`.

Current internal path:

```txt
/_nr
```

Current transport endpoints:

```txt
POST /_nr/commit
POST /_nr/loads
GET  /_nr/loads/:key
```

These endpoints are framework internals. App controllers should stay focused on user-facing pages and domain APIs.

## Client Bundle

The browser bundle is built by:

```txt
scripts/build-client.mjs
```

It uses esbuild and writes:

```txt
public/nest-react/client.js
public/nest-react/client.js.map
```

The demo client entry is:

```txt
src/demo/client/entry.tsx
```

The current registry is:

```txt
src/demo/client/registry.ts
```

Every island name must exist in the registry.

## Demo App

The demo lives in:

```txt
src/demo/
```

It includes:

- `Home`
- `Users`
- `Dashboard`
- in-memory demo services
- a polished shared layout
- client island components

## Current Performance Behavior

Server data is loaded only for the requested page.

For example:

- `/` runs Home page loads.
- `/users` runs Users page loads.
- `/dashboard` runs Dashboard page loads.

But the current client build emits one bundle containing all demo islands.

That means:

- current page data is scoped
- current page island mounting is scoped
- client JavaScript is not code-split yet

## Current Asset Support

Current support:

- static files served from `public/` through `/assets`
- inline CSS through server React
- esbuild client bundle

Not implemented yet:

- CSS imports
- CSS modules
- image imports
- font imports
- SVG imports
- hashed asset filenames
- asset manifest generation
- per-island CSS chunks

## Production Readiness Checklist

Before this becomes a production package, add:

- request-scoped provider support
- signed commit refs
- CSRF protection
- input validation helpers
- structured error serialization
- production asset manifest
- hashed JS/CSS filenames
- CSS and asset import support
- per-island code splitting
- hydration mode for SSR-safe islands
- tests for core APIs
- npm package exports
- documentation for public/private APIs


So the current behavior is intentional:

Server-rendered greeting outside island: static until full page reload
Greeting inside client island: updates without reload
If you want the top server-rendered greeting to update too, there are three options:

Put that displayed greeting inside the island.
Add a framework-level “server slot refresh” system later.
Add true partial server-rendered fragment refresh later.