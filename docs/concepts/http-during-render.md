# HTTP during render

## What it is

Helpers that change the HTTP response **while a Server Component render runs**, collected in request-scoped storage and applied before the response body commits:

| API | Effect |
| --- | --- |
| `setStatus(code)` | HTTP status (also updates live `response.statusCode` when attached) |
| `redirect(url, status?)` | Abort stream; respond with 3xx and `Location` |
| `setCookie(name, value, options?)` | Queue `Set-Cookie` |
| `clearCookie(name, options?)` | Expire a cookie (empty value, `Max-Age=0`) |
| `getCookie(name)` | Read incoming `Cookie` header on the current request |
| `getCookies()` | Return the **outgoing** cookie queue (not request cookies) |

Redirect status codes: `301`, `302`, `303`, `307`, `308`.

## Why it exists

RSC render is **lazy**. By the time a page calls `redirect()` or `setCookie()`, the controller has already returned `render()`. These APIs mirror [`redirect()`](../../src/data/context.ts) design: store intent during render, flush in [`handle-request.ts`](../../src/flight/handle-request.ts) after the first Flight chunk, on both Express and Fastify via normalized `ServerResponse`.

## How it works

1. `attachRenderResponse` links the Node response to the ALS store.
2. Page calls `setCookie` / `redirect` / `setStatus` during render.
3. Before writing the body, `getCookiesForResponse` emits `Set-Cookie`; `settleRedirect` ends with 3xx if `redirect()` was called.

## Examples

- Redirect: [`examples/express/src/redir/temp.page.tsx`](../../examples/express/src/redir/temp.page.tsx)
- Cookies: [`examples/express/src/cookies/cookies.page.tsx`](../../examples/express/src/cookies/cookies.page.tsx), [`clear-cookie.page.tsx`](../../examples/express/src/cookies/clear-cookie.page.tsx)

```tsx
import { setStatus } from 'nest-can-react';

setStatus(404);
return <MissingNote />;
```

## Rules and pitfalls

- Call only **during** Server Component render (same rules as `setLayoutMeta`).
- **`getCookies()`** returns pending **outgoing** cookies — use **`getCookie(name)`** for the request.
- **Session / auth cookies:** prefer login/logout **Nest routes** with guards and established session middleware. Use render-time cookies for preferences, UI flags, or demos — see [Security](security.md).
- **`serializeCookie`** does not encode arbitrary binary values; keep cookie values simple or encode in application code.
- Do not mix ad-hoc `res.cookie()` in the controller for the same request unless you understand header ordering.

## Related APIs

- [Package APIs: `setStatus`](../api.md#setstatuscode)
- [Package APIs: `redirect`](../api.md#redirecturl-statuscode)
- [Package APIs: cookies](../api.md#setcookiename-value-options)
