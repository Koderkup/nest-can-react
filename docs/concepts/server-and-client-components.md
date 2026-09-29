# Server and client components

## What it is

| Kind | Directive | Runs where |
| --- | --- | --- |
| **Page root** | `'use server-entry'` on `*.page.tsx` | Server (RSC) |
| **Server UI** | (default — no directive) | Server (RSC) — layouts, presentational components |
| **Client island** | `'use client'` | Browser (hydrated) |

Client components share one React tree after hydration, so **React context works across islands**.

## Why it exists

Default to server rendering for data access (`inject()`), SEO-friendly HTML, and minimal client JavaScript. Add `'use client'` only where you need state, effects, event handlers, or browser APIs.

## How it works

- The CLI bundles **two graphs**: server RSC + SSR, and client hydration ([CLI and build](cli-and-build.md)).
- Pages import client islands as child components; the server sends Flight references; the client loads and hydrates island modules.

## Example

Server page with island — [`examples/express/src/notes/note.page.tsx`](../../examples/express/src/notes/note.page.tsx) and `NoteEditor.tsx` (`'use client'`).

Layout (server, no `'use server-entry'` required on layout file):

```tsx
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

## Rules and pitfalls

- **`'use server-entry'`** marks page modules the bundler registers; use on `default` export page roots only.
- Do not import `nest-can-react/client` from Server Components.
- Keep islands small; push data loading to the server parent.

## Related guides

- [inject() and REQUEST](inject-and-request.md)
- [Mutations and revalidation](mutations-and-revalidation.md)
