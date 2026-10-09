# Navigation

## What it is

- **`NestLink`** — `<NestLink to="/path">` for in-app links from Server Components or layout.
- **`navigateTo(href)`** — client-only (`nest-can-react/client`): `history.pushState` + RSC refetch without full document load. Returns `Promise<void>` that resolves when the navigation completes.

Plain `<a href="...">` still works for external URLs and full navigations.

## Why it exists

Keep in-app navigation consistent with the RSC client runtime. Client transitions after mutations (wizard step, post-save redirect) should refetch Flight for the new URL without losing island state unnecessarily.

## How it works

- **Full navigation** — browser loads HTML from Nest (`Accept: text/html`); guards on the target route run as usual.
- **`navigateTo`** — `pushState` triggers exactly one Flight fetch for the new path; the promise resolves once the payload is applied. Hash-only targets skip the fetch entirely.
- **Link clicks** — the client runtime intercepts plain same-origin left-clicks (no modifiers, no `target`, no `download`) and turns them into the same single-fetch path. Modified clicks, external links and hash-only links keep native browser behavior.
- **Back/Forward** — `popstate` refetches only when the path or query actually changed; fragment-only traversal never refetches.
- **Redirects** — if the Flight fetch follows a 3xx, the address bar is synced to the final URL so it matches the rendered page.
- **Errors** — 4xx answers are terminal (no retries, immediate full-load fallback); 5xx and network failures retry before falling back.
- **Scroll** — push navigations scroll to the top or to the `#anchor` after the new payload commits; Back/Forward uses the browser's history scroll restoration.
- **`NestLink`** — generates appropriate links for server-rendered UI (see implementation in [`src/render/link`](../../src/render/link.tsx)).

## Example

Welcome page actions use `NestLink` — [`examples/express/src/welcome/welcome.page.tsx`](../../examples/express/src/welcome/welcome.page.tsx).

```ts
import { navigateTo } from 'nest-can-react/client';

// fire-and-forget
navigateTo('/welcome');

// or wait until the target payload is applied
await navigateTo('/welcome');
```

## Rules and pitfalls

- Import **`navigateTo` only from `'use client'`** modules.
- For ordinary browsing from server UI, prefer **`NestLink`** or `<a>`.
- Target routes must exist as Nest controller + `render()` — there is no filesystem router.

## Related APIs

- [Package APIs: `NestLink`](../api.md#nestlink)
- [Package APIs: `navigateTo`](../api.md#navigatetohref)
