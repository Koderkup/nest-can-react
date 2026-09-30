# Render and page refs

## What it is

- **`render(PageRef)`** — return value from a Nest controller method. Triggers streaming of that page through the layout.
- **`PageRef`** — opaque handle from **`createPageRef('page-id')`**, generated into `src/react-pages.ts`.
- **`*.page.tsx`** — files discovered by the CLI; each becomes a page id derived from its path (see [Page ids](#page-ids)).

## Why it exists

Controllers should **name the screen**, not assemble view models or import React trees. Importing `.tsx` pages into Nest would pull `'use client'` islands and RSC code into the Nest compiler graph. Page refs keep boundaries clean: Nest compiles controllers; Rspack compiles pages.

Pages load their own data with [`inject()`](inject-and-request.md) instead of receiving props from the controller (contrast with Inertia — [Why nest-can-react?](../why-nest-can-react.md)).

## How it works

1. You add `src/welcome/welcome.page.tsx` with `'use server-entry'`.
2. `nest-can-react dev` or `build` regenerates `src/react-pages.ts`:

```ts
export const WelcomePage = createPageRef('welcome/welcome');
```

1. Controller:

```ts
import { WelcomePage } from '../react-pages';

@Get()
index() {
  return render(WelcomePage);
}
```

Guards and pipes on the controller run **before** `render()`.

| `render()` option | Role |
| --- | --- |
| `statusCode` | Initial HTTP status (page may override with `setStatus`) |
| `url` | Override URL used for Flight refetch |

Adding or removing a `*.page.tsx` rewrites `react-pages.ts` and restarts Nest in dev. Editing the page component does not.

## Example

[`examples/express/src/welcome/welcome.controller.ts`](../../examples/express/src/welcome/welcome.controller.ts), [`examples/express/src/react-pages.ts`](../../examples/express/src/react-pages.ts).

## Page ids

A page id is the file path relative to the include pattern's static prefix, without the `.page.tsx` suffix. The default include is `src/**/*.page.tsx`, so ids keep the folder structure under `src/`:

| File | Page id | Export |
| --- | --- | --- |
| `src/admin.page.tsx` | `admin` | `AdminPage` |
| `src/users/admin.page.tsx` | `users/admin` | `UsersAdminPage` |
| `src/notes/note.page.tsx` | `notes/note` | `NotePage` |
| `src/cookies/clear-cookie.page.tsx` | `cookies/clear-cookie` | `ClearCookiePage` |

Path-based ids mean two files sharing a basename never collide, so both render without a build error. The generated `pages` map keys on the id:

```ts
export const pages = {
  "admin": Page0,
  "users/admin": Page1,
} as const;
```

### Backward-compatible basename aliases

For every page whose basename is unique across the project, the `pages` map also emits a basename alias key — so existing string-based calls keep working:

```ts
export const pages = {
  "notes/note": Page0,
  "note": Page0,
  "welcome/welcome": Page1,
  "welcome": Page1,
} as const;
```

- `renderPage('welcome')` — still resolves via the `welcome` alias.
- `createPageRef('welcome')` — still resolves at runtime via the alias.
- `render(WelcomePage)` — unaffected; `WelcomePage` holds the path-based id `welcome/welcome`.

When two pages share a basename (e.g. `admin` and `users/admin`), no alias is emitted for either — both are reachable only via their full path-based ids, which is strictly better than the old silent-overwrite behaviour.

Export names stay readable: the basename is used when it is unique among all pages, and the directory is only added when two pages would otherwise produce the same export.

## Rules and pitfalls

- **Never** import the `.page.tsx` module from a controller.
- Do not hand-edit `react-pages.ts`.
- Do not use `@Req()` / `@Res()` for the default pattern — use `inject(REQUEST)` in the page instead.
- Handler should not load view data; that belongs in the page via `inject()`.
- Path-based ids are canonical; the generated `react-pages.ts` always uses them in `createPageRef()`. Legacy basename strings (e.g. `renderPage('welcome')`) still work via the backward-compatible alias, but prefer migrating to the path-based id.

## Related APIs

- [Package APIs: `render`](../api.md#renderpage-options)
- [Package APIs: `createPageRef`](../api.md#createpageref)
