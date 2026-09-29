# inject() and REQUEST

## What it is

**`inject(token)`** resolves a provider from the Nest container handling the current HTTP request. It runs only during a Server Component render started by `render()` or `renderPage()`.

Common tokens:

- **`YourService`** — singleton (or default-scoped) Nest provider.
- **`REQUEST`** from `@nestjs/core` — Express or Fastify request (`params`, `query`, headers).

## Why it exists

There is no second React-specific DI system. The page and the controller share one Nest application context. Services used by REST endpoints can be used by RSC pages without duplicating repositories or DTO mappers.

## How it works

- Implemented with request-scoped `AsyncLocalStorage` in the RSC entry ([`src/nest/inject.ts`](../../src/nest/inject.ts)).
- The RSC bundle may contain a **compiled copy** of a service class. `inject()` still returns Nest’s instance, matched by class identity or by class name when the bundle copy differs.

**Request-scoped providers** are not fully constructed in the RSC path. Prefer reading `inject(REQUEST)` and passing values into a singleton service method.

## Example

```tsx
'use server-entry';

import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { inject } from 'nest-can-react';
import { NotesService } from './notes.service';

export default function NotePage() {
  const notes = inject(NotesService);
  const request = inject<Request>(REQUEST);
  const text = notes.findOne(String(request.params.id)).text;
  return <p>{text}</p>;
}
```

See [`examples/express/src/notes/note.page.tsx`](../../examples/express/src/notes/note.page.tsx).

## Rules and pitfalls

- Call **`inject()` only from Server Components** during an active render — not from `'use client'` modules.
- Do not call `inject()` at module top level outside render.
- For Fastify, type the request appropriately or use generic request shapes.

## Related APIs

- [Package APIs: `inject`](../api.md#injecttoken)
