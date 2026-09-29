# Layout meta

## What it is

Per-request document metadata (typically `title`, `description`, or custom keys) stored while a page renders. The **layout** reads it with **`useLayoutMeta()`** or **`getLayoutMeta()`**; pages set it with **`setLayoutMeta()`**.

## Why it exists

One shared `layout.tsx` wraps every page. Pages should own their `<title>` and related head content without hard-coding titles in the layout or passing props from controllers.

## How it works

- Stored in request-scoped AsyncLocalStorage ([`src/data/context.ts`](../../src/data/context.ts)).
- The generated Flight entry wraps renders with `runWithLayoutMeta` — **app code should not call `runWithLayoutMeta`**.

## Example

Page:

```tsx
'use server-entry';

import { setLayoutMeta } from 'nest-can-react';

export default function WelcomePage() {
  setLayoutMeta({ title: 'Welcome', description: 'Getting started' });
  return <h1>Welcome</h1>;
}
```

Layout:

```tsx
import { useLayoutMeta } from 'nest-can-react';

export default function Layout({ children }) {
  const meta = useLayoutMeta();
  return (
    <html lang="en">
      <head>
        <title>{meta.title ?? 'Home'}</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

See [`docs/first-app.md`](../first-app.md) layout section.

## Rules and pitfalls

- Call **`setLayoutMeta` only during** a Server Component render from `render()` / `renderPage()`.
- Prefer **`useLayoutMeta`** in the layout (same data as `getLayoutMeta`).
- You can also use React 19 `<title>` in page JSX; layout meta is for shared head logic.

## Related APIs

- [Package APIs: layout meta](../api.md#layout-meta-setlayoutmeta-uselayoutmeta-getlayoutmeta)
