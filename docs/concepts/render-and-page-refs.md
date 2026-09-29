# Render and page refs

## What it is

- **`render(PageRef)`** — return value from a Nest controller method. Triggers streaming of that page through the layout.
- **`PageRef`** — opaque handle from **`createPageRef('page-id')`**, generated into `src/react-pages.ts`.
- **`*.page.tsx`** — files discovered by the CLI; each becomes a page id (usually the basename without `.page`).

## Why it exists

Controllers should **name the screen**, not assemble view models or import React trees. Importing `.tsx` pages into Nest would pull `'use client'` islands and RSC code into the Nest compiler graph. Page refs keep boundaries clean: Nest compiles controllers; Rspack compiles pages.

Pages load their own data with [`inject()`](inject-and-request.md) instead of receiving props from the controller (contrast with Inertia — [Why nest-can-react?](../why-nest-can-react.md)).

## How it works

1. You add `src/welcome/welcome.page.tsx` with `'use server-entry'`.
2. `nest-can-react dev` or `build` regenerates `src/react-pages.ts`:

```ts
export const WelcomePage = createPageRef('welcome');
```

3. Controller:

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

## Rules and pitfalls

- **Never** import the `.page.tsx` module from a controller.
- Do not hand-edit `react-pages.ts`.
- Do not use `@Req()` / `@Res()` for the default pattern — use `inject(REQUEST)` in the page instead.
- Handler should not load view data; that belongs in the page via `inject()`.

## Related APIs

- [Package APIs: `render`](../api.md#renderpage-options)
- [Package APIs: `createPageRef`](../api.md#createpageref)
