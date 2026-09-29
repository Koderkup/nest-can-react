# Security

## What it is

Security in nest-can-react apps is **Nest security**: guards, pipes, authentication strategies, and explicit mutation routes. Flight and RSC streams are part of your UI — not a bypass around authorization.

## Why it matters

It is easy to assume “server components are safe” while forgetting that **routes** must still enforce who can load a page or POST data. Client refetch sends cookies and headers like any other same-origin request.

## How it works

| Concern | Approach |
| --- | --- |
| **Page access** | `@UseGuards()` on controller methods that `return render(...)` |
| **Mutations** | `@Post()` / `@Patch()` with guards; client uses `useCommit` to same origin |
| **Data in pages** | `inject(Service)` — enforce authorization **in the service** when data is sensitive |
| **Sessions** | Use Nest/session middleware or your existing auth module on login routes |
| **CSRF** | Required for cookie-based sessions when using `useCommit` / form POST — use CSRF tokens or SameSite strategy your app standardizes on |
| **Render-time cookies** | [`setCookie`](http-during-render.md) for preferences; **login/session cookies** should be set on guarded auth routes, not casually in pages |
| **Flight endpoint** | Treat RSC fetches as authenticated UI traffic; guard HTML and RSC paths consistently |

## Rules and pitfalls

- Do not expose sensitive operations only inside `'use client'` code — clients can always call your API directly.
- Do not treat **`inject(REQUEST)`** as trusted input — validate params and query.
- **`redirect()`** still runs after guards on the **current** route; protect destination routes separately.
- Keep secrets and API keys in Nest config/providers — never in client bundles.

## Example

Notes module: controllers use Nest patterns; POST handlers for `useCommit` should mirror API hardening — see [`examples/express/src/notes/`](../../examples/express/src/notes/).

## Related

- [Mutations and revalidation](mutations-and-revalidation.md)
- [Why nest-can-react?](../why-nest-can-react.md)
