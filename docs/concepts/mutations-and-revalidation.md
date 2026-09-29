# Mutations and revalidation

## What it is

- **`useCommit(url, options?)`** — client hook: POST JSON to a Nest route, then optionally refetch the current page as Flight.
- **`refresh()`** — client helper to refetch RSC for the current URL.
- Nest **`@Post()`** (or other methods) handlers perform the mutation with normal guards and services.

## Why it exists

Mutations stay on **Nest**, not on ad-hoc Flight endpoints. The same `AuthGuard`, validation pipe, and service layer that protect your API protect form submissions. After success, the UI updates via RSC refetch instead of `location.reload()`.

## How it works

`useCommit` default:

1. POST JSON body to the given URL.
2. On success, if `revalidate: true` (default), call `refresh()` to swap the server tree.

The Nest handler returns JSON (or empty body). It does not return `render()` for typical JSON POST endpoints.

## Example

Client island — [`examples/express/src/notes/NoteEditor.tsx`](../../examples/express/src/notes/NoteEditor.tsx) (pattern in [first-app](../first-app.md)).

Nest side: guard the POST like any API route in your notes module.

| Option | Default | Role |
| --- | --- | --- |
| `method` | `'POST'` | HTTP method |
| `revalidate` | `true` | Refetch RSC after success |

Returned: `commit`, `pending`, `state`, `data`, `error`.

## Rules and pitfalls

- **Always guard** mutation routes — Flight refetch does not replace auth on POST.
- Use **CSRF protection** when using cookie sessions — [Security](security.md).
- Set `revalidate: false` when you only need the JSON response and will update UI locally.
- Prefer `useCommit` over raw `fetch` + manual `refresh()` for consistency.

## Related APIs

- [Package APIs: `useCommit`](../api.md#usecommiturl-options)
- [Package APIs: `refresh`](../api.md#refresh)
