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
- Client React islands mounted with `createRoot()`.
- React client hooks: `useLoad()`, `useCommit()`, and `usePendingLoad()`.
- A package-owned internal transport through `NestReactModule`.
- Manifest-based island mounting with no user-authored `data-nest-*` attributes.
- esbuild-based client bundling with no Vite and no webpack.
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

  return <Island name="UserCreator" props={{ initialUsers: users }} />;
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

## Project Structure

```txt
src/
  core/
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

  demo/
    client/
      components/
      entry.tsx
      registry.ts
    components/
      layout.tsx
    pages/
      dashboard.tsx
      home.tsx
      users.tsx
    services/
      dashboard.service.ts
      greeting.service.ts
      users.service.ts
    load-keys.ts

  app.controller.ts
  app.module.ts
  main.ts

scripts/
  build-client.mjs

public/
  nest-react/
    client.js
    client.js.map
```

`src/core` is the package/framework layer.

`src/demo` is the demo application that consumes the core layer.

## Core APIs

### `renderPage(Page, moduleRef)`

Renders a server React page inside a Nest-aware context.

It collects:

- load results
- island descriptors
- internal transport path

Then it injects:

- `<script id="nr-manifest" type="application/json">...</script>`
- `<script type="module" src="/assets/nest-react/client.js"></script>`

### `inject(token)`

Resolves a Nest provider from the current frontend render/commit context.

Example:

```ts
const users = inject<UsersService>(UsersService);
```

Current limitation: this is not fully request-scoped yet. Production support should use Nest context IDs for request-scoped providers.

### `load(key, handler)`

Declares a server-side read operation.

```ts
export const greetingLoad = load('home:greeting', async () => {
  return inject<GreetingService>(GreetingService).sayHello();
});
```

Calling the returned function runs the handler and records the result in the current render manifest.

### `commit(id, handler)`

Declares a server-side mutation.

```ts
export const updateGreetingCommit = commit(
  'greeting.update',
  async (input: { message?: string }) => {
    inject<GreetingService>(GreetingService).setGreeting(input.message ?? '');
    return revalidate('home:greeting');
  },
);
```

Every commit gets an opaque client reference:

```ts
updateGreetingCommit.ref
```

Client islands receive this ref instead of raw URLs.

### `revalidate(...keys)`

Marks load keys as stale after a commit.

```ts
return revalidate('users:list', 'dashboard:summary');
```

The browser runtime refreshes these load keys without reloading the page.

### `Island`

Registers a client island during server render.

```tsx
<Island
  name="GreetingEditor"
  props={{
    initialMessage: greeting,
    loadKey: greetingLoad.key,
    updateGreeting: updateGreetingCommit.ref,
  }}
/>
```

The rendered HTML gets a generated root ID like `nr-i0`. Island metadata is stored in the manifest, not in public `data-nest-*` attributes.

### `NestReactModule`

Adds the package-owned internal transport.

Current internal routes:

```txt
POST /_nr/commit
POST /_nr/loads
GET  /_nr/loads/:key
```

Application controllers do not need to expose framework refresh or commit URLs.

## Client APIs

### `useLoad(key)`

Reads initial server-loaded data from the manifest and updates when the key is refreshed.

```tsx
const users = useLoad<User[]>('users:list');
```

### `useCommit(commitRef)`

Calls a server commit through the internal transport.

```tsx
const create = useCommit<{ name: string; role: string }>(createUser);

await create.execute({
  name: 'Ada',
  role: 'Engineer',
});
```

If the commit returns revalidation keys, the client runtime refreshes those loads automatically.

### `usePendingLoad(key)`

Returns whether a load key is currently refreshing.

```tsx
const refreshing = usePendingLoad('users:list');
```

This helps keep old data visible while fresh server data is fetched.

## Demo Routes

### `/`

Home page.

Shows server-rendered greeting data and a client island that edits it with React state and `useCommit()`.

### `/users`

Users page.

Loads users on the server, then mounts a client island for creating users. After a user is created, the users load refreshes without a full page reload.

### `/dashboard`

Dashboard page.

Renders summary cards on the server and mounts a client island with local UI state, a live client clock, and a dashboard refresh commit.

## Build Scripts

Install dependencies:

```bash
npm install
```

Build the client island bundle:

```bash
npm run build:client
```

Build the Nest server:

```bash
npm run build
```

Build both:

```bash
npm run build:all
```

Run in development:

```bash
npm run start:dev
```

Run production build:

```bash
npm run build:all
npm run start:prod
```

## How The Request Flow Works

1. Browser requests a page such as `/users`.
2. Nest routes the request to `AppController`.
3. The controller calls `renderPage(Users, moduleRef)`.
4. The server React page calls `load()`.
5. `load()` reads data through Nest DI.
6. `Island` registers client island metadata.
7. The renderer returns HTML plus the `nr-manifest`.
8. Browser loads `/assets/nest-react/client.js`.
9. Client runtime reads the manifest and mounts islands with `createRoot()`.
10. A client island calls `useCommit()`.
11. The runtime posts to `/_nr/commit`.
12. The server commit mutates Nest state and returns revalidation keys.
13. The runtime refreshes affected load keys through `/_nr/loads`.
14. `useLoad()` subscribers update without a full page reload.

## Current Limitations

This prototype is not production ready yet.

Known gaps:

- No full request-scoped provider support yet.
- Internal transport has no CSRF protection yet.
- Commit refs are opaque but not signed.
- Input validation is minimal.
- Error serialization is minimal.
- No first-class CSS imports yet.
- No first-class image/font/SVG asset imports yet.
- No per-island code splitting yet.
- One client bundle currently contains all demo islands.
- Islands are mounted with `createRoot()`; SSR hydration is not fully implemented yet.
- No true React Server Components Flight protocol yet.
- Package exports are not prepared for npm publishing yet.
- Test coverage is still missing for core behavior.

## More Docs

- [Creating Your First App](docs/first-app.md)
- [Core Concepts](docs/core-concepts.md)
