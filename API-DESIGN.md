# Nest-style APIs, native React, extreme security

This is a design contract for how Nest React should expose application APIs.

The current prototype already has the right *transport idea*: server pages declare `load()` / `commit()`, islands receive opaque refs, and the browser talks to `/_nr` instead of hand-written REST routes. What it does not have yet is a Nest-native authoring model, a React-native consumption model, or a security model.

Those three things belong together. If React looks “local” while the wire is still a public RPC endpoint, the native feel becomes a footgun.

## The split we want

| Side | What it should feel like | What it actually is |
| --- | --- | --- |
| Nest | Classes, DI, guards, pipes, interceptors | The only place business logic and authorization live |
| React islands | Hooks, props, events — no classes, no `fetch` | Typed stubs that post through the framework transport |
| Browser | Same app, same types, same environment | A hostile client. Every call is untrusted HTTP |

Nest remains the application framework. React remains the rendering layer. The API layer should not invent a third world (OpenAPI clients, Axios services, GraphQL SDKs). It should compile Nest classes into React-native hooks, then treat the resulting HTTP calls as if a stranger wrote them.

## Why not keep free functions?

Today a page looks like this:

```ts
export const greetingLoad = load('home:greeting', async () => {
  return await inject<GreetingService>(GreetingService).sayHello();
});

export const updateGreetingCommit = commit(
  'greeting.update',
  async (input: { message?: string }) => {
    await inject<GreetingService>(GreetingService).setGreeting(
      input.message ?? '',
    );
    return revalidate('home:greeting', 'dashboard:summary');
  },
);
```

That works as a prototype. It does not scale as a Nest API:

- There is no constructor injection. Every handler calls `inject()`.
- There are no guards, pipes, interceptors, or exception filters on the handler.
- `commit` ids (`greeting.update`) and load keys (`home:greeting`) are public, guessable names.
- Authorization, if added later, has to be reinvented next to every function.
- React islands already *almost* look native (`useLoad`, `useCommit`), but they take raw keys and refs instead of typed methods.

Nest already solved this for HTTP controllers. We should reuse that model for the React transport, not fork a second one.

## Nest side: class APIs

Application APIs should be Nest providers. They use the same DI graph as `UsersService` / `GreetingService`. They are **not** extra HTTP controllers for `/api/...`. They are methods that the framework binds to `load` (reads) and `commit` (mutations).

```ts
import { Body, Injectable, UseGuards, UsePipes } from '@nestjs/common';
import { Load, Commit, Revalidate } from '@nestjs/react';
import { AuthGuard } from './auth.guard';
import { UpdateGreetingDto } from './update-greeting.dto';
import { GreetingService } from './greeting.service';

@Injectable()
export class GreetingApi {
  constructor(private readonly greeting: GreetingService) {}

  @Load('home:greeting')
  async getGreeting() {
    return this.greeting.sayHello();
  }

  @Commit('greeting.update')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @Revalidate('home:greeting', 'dashboard:summary')
  async updateGreeting(@Body() input: UpdateGreetingDto) {
    await this.greeting.setGreeting(input.message);
  }
}
```

Rules:

- **Services stay services.** `GreetingService` owns state. `GreetingApi` is the React-facing facade: auth, validation, revalidation, mapping.
- **Use Nest primitives.** `@UseGuards`, `@UsePipes`, `@UseInterceptors`, `@Roles()`, DTOs, `ValidationPipe`. Do not invent a parallel decorator set unless Nest has no equivalent.
- **Reads are `@Load`, writes are `@Commit`.** Do not map them to `@Get` / `@Post` on public URL space. These methods must not become `/greeting` REST routes by accident.
- **Register them in the Nest module** like any other provider. Discovery can be explicit (`NestReactModule.forRoot({ apis: [GreetingApi] })`) or by scanning `@Injectable()` classes that use `@Load` / `@Commit`.
- **Request scope is mandatory.** Execution must run inside the current HTTP request so `REQUEST`-scoped providers, `ClsService`, and the authenticated user cannot leak across users.

The existing `load()` / `commit()` functions can remain as the low-level runtime. Class methods should compile down to those, the same way Nest controllers compile down to Express routes.

### What a page then looks like

Server pages keep composing UI. They stop declaring transport by hand.

```tsx
export default async function Home() {
  const greeting = await greetingApi.getGreeting();

  return (
    <Island
      mode="hydrate"
      name="GreetingEditor"
      props={{ initialMessage: greeting }}
    />
  );
}
```

The page does not pass `updateGreetingCommit.ref` or `loadKeys.greeting` unless it needs an escape hatch. The island imports the React-facing stub for `GreetingApi` and calls it like a local hook.

## React side: native, not class-based

Islands must not look like Nest. No `new GreetingApi()`. No decorators. No `inject()`. No `fetch('/_nr/commit')`.

The generated client surface should read as ordinary React:

```tsx
export function GreetingEditor({ initialMessage }: { initialMessage: string }) {
  const greeting = useGreeting().data ?? initialMessage;
  const save = useUpdateGreeting();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save.execute({ message });
      }}
    >
      <input value={message} onChange={(e) => setMessage(e.target.value)} />
      <button disabled={save.pending} type="submit">
        {save.pending ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

Equivalent shapes that still count as native:

```ts
const greeting = useLoad(greetingApi.getGreeting);
const save = useCommit(greetingApi.updateGreeting);
```

What does **not** count:

```ts
await fetch('/_nr/commit', { body: JSON.stringify({ id: 'greeting.update' }) });
new GreetingApi().updateGreeting(input);
inject(GreetingApi).updateGreeting(input);
```

### Same environment, different bundles

“Same environment” means one TypeScript app, one module graph, shared DTO types, shared error shapes. It does **not** mean the Nest class is shipped to the browser.

```txt
src/demo/apis/greeting.api.ts     # Nest class, server-only
src/demo/dto/update-greeting.dto.ts
        │
        ├─ server page imports the class / generated server proxy
        └─ island imports generated hooks only
```

The bundler must enforce a physical boundary:

- `*.island.tsx`, `runtime.entry`, and client chunks cannot import `@Injectable()` API classes or anything that imports Nest runtime.
- They can import generated stubs (`greetingApi.updateGreeting`) and DTO *types*.
- If an island imports a server file, `build:client` fails. Silent tree-shaking is not enough; a missed import would put guards, secrets, and services in public JS.

That is the same rule Next.js needs for `"use server"` / `"use client"`. The native React feel is a compiler product, not a runtime illusion.

Types flow across the boundary. Implementations do not.

```ts
// Shared type only. Safe in both bundles.
export type UpdateGreetingInput = {
  message: string;
};

// Class stays on the server.
@Injectable()
export class GreetingApi {
  @Commit()
  async updateGreeting(@Body() input: UpdateGreetingInput) { /* ... */ }
}

// Island sees this generated signature, not the class.
declare function useUpdateGreeting(): {
  execute: (input: UpdateGreetingInput) => Promise<void>;
  pending: boolean;
  error: Error | null;
};
```

## How the wire stays invisible

At **build time**, the compiler:

1. Finds `@Load` / `@Commit` methods.
2. Emits server registration (bind methods into the existing `load` / `commit` registries).
3. Emits client stubs with stable method identities and TypeScript types.
4. Emits React hooks (`useGreeting`, `useUpdateGreeting`, or a generic `useLoad` / `useCommit` overload).

At **request time**, the renderer:

1. Runs page loads through Nest (guards, pipes, request scope).
2. Issues **capability tokens** for the commits and loads this page is allowed to use.
3. Puts those tokens in `#nr-manifest`, not the Nest method names.

At **click time**, `useCommit` still posts to `POST /_nr/commit`. The island author never writes that. The token, CSRF header, and origin checks are framework concerns.

Current demo islands already gesture at this (`useCommit(ref)` instead of a URL). The missing piece is: refs must be signed capabilities, and hooks should be typed from Nest classes rather than hand-passed props.

## Current holes (this repo, today)

`src/core/nest-react.controller.ts` exposes:

```txt
POST /_nr/commit      { id, args }
POST /_nr/loads       { keys }
GET  /_nr/loads/:key
```

`commit` refs are `{ __nr_commit: "greeting.update" }`. Load keys are `"home:greeting"`. Anyone who can hit the origin can:

- Call any registered mutation by guessing its id.
- Refresh any registered load by guessing its key, including data that was never on the current page.
- Skip CSRF, because there is no Origin check, no CSRF token, and no cookie binding.
- Send arbitrary `args` with no DTO validation.
- Hit `GET /_nr/loads/:key`, which is cacheable, prefetchable, and CSRF-friendly.

`inject()` is not request-scoped (`src/core/inject.ts` falls back to the root `ModuleRef`). Even a future `AuthGuard` would be unsafe until that is fixed: the wrong user, or no user, can be visible to a concurrent request.

The HTML manifest is also a capability dump. XSS that can read `#nr-manifest` can replay every commit on the page.

None of this is acceptable once APIs look like local function calls. A native React API that posts an unsigned name is a hidden public RPC.

## Extreme security: treat `/_nr` as a hostile RPC

“Extremely secure” here does not mean a marketing checklist. It means: a random browser, a CSRF attacker, an XSS payload, and an authenticated low-privilege user all fail closed.

There is no single switch. The model is capabilities + Nest authorization + request isolation + a hard server/client split.

### 1. Capabilities, not names

Never send `greeting.update` or `home:greeting` as the wire identity.

Issue a token when the page renders (or when the island is authorized):

```txt
token = HMAC-SHA256(server_secret, payload)
payload = {
  v: 1,
  kind: "commit" | "load",
  method: "GreetingApi.updateGreeting",
  sub: userId | "anon",
  sid: sessionId,
  origin: "https://app.example",
  page: "/ ",
  iat, exp,
  nonce,
  csrf,
  argsHash?: optional binding to expected DTO shape
}
```

The client only stores the token. `POST /_nr/commit` body becomes `{ token, args, csrf }`. The server:

- Verifies HMAC with a server-only secret (rotated, not in the client bundle).
- Rejects expired, reused (if one-time), or wrong-origin tokens.
- Rejects tokens whose `sub` / `sid` do not match the current session.
- Resolves `method` from the token, never from a client-supplied string.
- Then runs Nest guards again. A stolen token for user A must not run as user B.

Stable method names can exist **inside** the token. They must not be the public RPC id.

Load refresh works the same way. The client may only refresh keys for which it holds a load token issued for this session. `POST /_nr/loads` with `{ keys: ["admin:secrets"] }` must 403 even if that load exists on the server.

Remove `GET /_nr/loads/:key` or protect it with the same token + CSRF rules. GET mutations/reads with secrets in the URL are the wrong shape.

### 2. CSRF is not optional

Same-site cookies are not enough on their own.

Require all of:

- `Origin` / `Referer` allowlist matching the app origin.
- `SameSite=Strict; Secure; HttpOnly` session cookie.
- A CSRF secret bound into the capability token **and** sent as a custom header (`X-NR-CSRF`) that cross-origin form posts cannot set.
- `fetch(..., { credentials: 'same-origin' })` only. No CORS for `/_nr`.
- Reject missing `Content-Type: application/json` (simple requests).

Custom headers plus Origin checks are the practical CSRF story for this transport. Double-submit cookies alone are weaker if XSS can read them; HttpOnly session + header CSRF + signed token is the combination.

### 3. Nest authorization on every call

Tokens prove *this browser was allowed to see this button*. They do not prove *this user may still perform the action*.

Every `@Commit` / `@Load` runs through Nest:

```ts
@Commit()
@UseGuards(SessionGuard, RolesGuard)
@Roles('editor')
async updateGreeting(@Body() input: UpdateGreetingDto) { /* ... */ }
```

Re-check authz on refresh and on commit. A role change, logout, or session rotation must invalidate tokens (`sid` in the HMAC payload, or a server-side token denylist).

Never authorize in the island. The island can hide a button. The server decides.

### 4. Request isolation

`runWithFrontendContext` must use the request’s `ModuleRef` / DI tree, not a process-wide singleton.

- `REQUEST`-scoped providers for the current user.
- `AsyncLocalStorage` already exists in `context.ts`; it must be populated per HTTP request for `/_nr` *and* for page renders, with the same identity.
- No caching of “current user” on a singleton service.
- In-memory demo services (`UsersService`, `GreetingService`) are process-global. That is fine for a demo. Production APIs must not store per-user secrets on a default-scoped singleton without an explicit store keyed by user id.

Until request scope works, do not call the API layer production-ready.

### 5. Validate and bound every argument

`args` is currently `unknown[]`. That is a remote code-shaped hole.

- DTO classes + `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`.
- Max JSON body size on `/_nr` (small: 16–64 KB unless a method opts into more).
- Max array length, string length, nesting depth.
- No loosely typed `any` crossing the boundary. The generated client stub’s input type must match the DTO.
- File uploads are a separate, explicit channel — not a generic commit arg.

Pipes run on the server. The client type is a convenience, not a security control.

### 6. Least data on the wire

- Do not put load results in the HTML manifest if the island can fetch them with a load token after paint *and* they are sensitive. For public demo strings this does not matter. For PII, prefer hydrate-after-auth or omit from SSR HTML.
- Do not serialize Nest errors. Map to `{ code, message }` allowlists. Never stack traces, never SQL, never “User #42”.
- Do not return fields the island does not need. API classes should map to view models, not dump entities.
- Content-Security-Policy that forbids `unsafe-inline` except a nonce for `#nr-manifest` / runtime boot. XSS that reads the manifest steals capabilities.
- Trusted Types / no `dangerouslySetInnerHTML` in core and in demo islands.
- Hashed assets already help; add `integrity` if the runtime is served from a different origin later.

### 7. Session, cookies, and transport lock-down

- Session id in an HttpOnly Secure cookie. Capability tokens include `sid` but are not the session.
- Rotate session on login / privilege change.
- Idle timeout and absolute timeout inside the token `exp` (minutes, not days).
- Rate-limit `/_nr/commit` and `/_nr/loads` per session and per IP (`@nestjs/throttler`).
- Helmet, disable `X-Powered-By`, `Cache-Control: no-store` on `/_nr`.
- Do not enable CORS for the transport. If a separate site needs data, it is a different, explicitly authenticated API — not this React bridge.

### 8. Make the native feel honest

The most dangerous failure mode is a developer who believes `save.execute({ message })` is in-process.

Framework rules that keep that honest:

- Islands cannot import server APIs (build error).
- Server APIs cannot import island modules.
- `execute` is always async and always can fail with `error`.
- Generated JSDoc on hooks: “Runs on the server. Input is validated and authorized there.”
- Tests that POST `/_nr/commit` with a guessed name, a missing CSRF header, an expired token, and another user’s cookie — all must fail.

If those tests do not exist, the API is not extremely secure, no matter how Nest-like the classes look.

## Suggested implementation order

1. **Request-scoped frontend context** — without this, auth is unsafe.
2. **Signed capability tokens** for commit and load, issued at render, verified on `/_nr`.
3. **Origin + CSRF header** on every transport call; delete unauthenticated `GET /_nr/loads/:key`.
4. **`@Load` / `@Commit` classes** as a thin layer over today’s registries, using Nest guards and `ValidationPipe`.
5. **Client stub generation** so islands use hooks/types, never refs or method name strings.
6. **Bundler boundary** so Nest classes cannot land in `public/nest-react`.
7. **CSP, throttling, error allowlists, session binding.**
8. **Adversarial tests** for CSRF, token theft, guessable ids, over-refresh of load keys, and request-scope leaks.

## What stays the same

- Nest controllers still own HTML routes (`/`, `/users`, `/dashboard`).
- `renderPage`, `Island`, and the client runtime stay the UI engine.
- `/_nr` stays an internal transport. Application authors do not add `/api/greeting`.
- Demo pages can keep using `load()` / `commit()` until the class layer lands. The functions are the IR; the classes are the public Nest authoring style; the hooks are the public React authoring style.

## Non-goals

- Making Nest classes available as runtime objects in the browser.
- Exposing `@Load` / `@Commit` methods as public REST/OpenAPI by default.
- “Security through obscurity” (minifying `greeting.update` into a hash without HMAC, session binding, and CSRF).
- A separate frontend SDK that talks to a different backend. This is one Nest process. The React side is native because it is generated from that process, not because it is trusted.
