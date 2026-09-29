# Navigation

## What it is

- **`NestLink`** — `<NestLink to="/path">` for in-app links from Server Components or layout.
- **`navigateTo(href)`** — client-only (`nest-can-react/client`): `history.pushState` + RSC refetch without full document load.

Plain `<a href="...">` still works for external URLs and full navigations.

## Why it exists

Keep in-app navigation consistent with the RSC client runtime. Client transitions after mutations (wizard step, post-save redirect) should refetch Flight for the new URL without losing island state unnecessarily.

## How it works

- **Full navigation** — browser loads HTML from Nest (`Accept: text/html`); guards on the target route run as usual.
- **`navigateTo`** — updates history and triggers Flight fetch for the new path; use after successful client-side actions.
- **`NestLink`** — generates appropriate links for server-rendered UI (see implementation in [`src/render/link`](../../src/render/link.tsx)).

## Example

Welcome page actions use `NestLink` — [`examples/express/src/welcome/welcome.page.tsx`](../../examples/express/src/welcome/welcome.page.tsx).

```ts
import { navigateTo } from 'nest-can-react/client';

navigateTo('/welcome');
```

## Rules and pitfalls

- Import **`navigateTo` only from `'use client'`** modules.
- For ordinary browsing from server UI, prefer **`NestLink`** or `<a>`.
- Target routes must exist as Nest controller + `render()` — there is no filesystem router.

## Related APIs

- [Package APIs: `NestLink`](../api.md#nestlink)
- [Package APIs: `navigateTo`](../api.md#navigatetohref)
