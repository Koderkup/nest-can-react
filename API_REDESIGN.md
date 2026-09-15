Do this as **one concern per branch**. The rule for every branch: if Nest already has a primitive, use it. Do not add a parallel DI container, a parallel guard system, or signed RPC tokens. `load()` / `commit()` / `inject()` should shrink until they disappear from app code.

The HMAC “capability token” idea from the last pass is **out of this plan**. That would be inventing a security system. Nest already owns authz (`@UseGuards`), validation (`ValidationPipe`), request isolation (`REQUEST` scope + `ContextIdFactory`), and HTTP.

---

## What you are replacing

| Invented today | Nest already has |
| --- | --- |
| `inject()` + process-wide `ModuleRef.get()` | constructor injection, `ModuleRef.resolve(token, contextId)` |
| `loadRegistry` / `commitRegistry` `Map`s | `@Injectable()` providers + `DiscoveryService` |
| Hand-running a function in `/_nr` | Nest’s method pipeline (guards, pipes, interceptors, filters) |
| String ids (`greeting.update`) as security | Guards + session on the request |
| `GET /_nr/loads/:key` | A POST (or a real controller method) that still runs guards |

The only custom bridge you should keep for a while: **AsyncLocalStorage holding Nest’s `ContextId` during React render**, because React is not a Nest controller method. That is a pointer to Nest DI, not a second container.

---

## Branch 1 — `fix/request-scoped-di`

**Goal:** Every `inject()` / provider resolve uses the **current HTTP request**, not the process singleton.

**Nest primitives:** `ContextIdFactory.getByRequest(req)`, `ModuleRef.registerRequestByContextId()`, `ModuleRef.resolve(token, contextId)`, `Scope.REQUEST`.

**Do:**

- Pass `Request` into `renderPage` from `AppController` (it already runs inside a Nest request).
- Store `{ moduleRef, contextId }` in ALS, not a global `rootModuleRef` fallback for user data.
- Change `inject()` to `moduleRef.resolve(token, contextId)` (async is fine; wrap call sites).
- Make `/_nr/commit` and `/_nr/loads` use the **incoming request’s** `ContextId`, not `initializeFrontendDI(this.moduleRef)`.

**Do not:** rename APIs, add `@Load`, add tokens, change islands.

**Done when:** a `@Injectable({ scope: Scope.REQUEST })` provider sees the correct request on page render **and** on `/_nr`, and two concurrent requests cannot see each other’s user. Until this lands, guards are unsafe.

---

## Branch 2 — `refactor/handlers-to-providers`

**Goal:** Data lives on Nest providers with **constructor injection**. Pages stop calling `inject(GreetingService)` inside lambdas.

**Nest primitives:** `@Injectable()`, constructor DI, existing `AppModule` `providers`.

**Do:** Add facades next to today’s services, e.g. `GreetingApi`, `UsersApi`, `DashboardApi`:

```ts
@Injectable()
export class GreetingApi {
  constructor(private readonly greeting: GreetingService) {}

  getGreeting() {
    return this.greeting.sayHello();
  }

  async updateGreeting(input: { message?: string }) {
    await this.greeting.setGreeting(input.message ?? '');
    return revalidate(loadKeys.greeting, loadKeys.dashboard);
  }
}
```

Register them in `AppModule`. Keep `load()` / `commit()` as thin adapters for one more branch:

```ts
load(loadKeys.greeting, () => inject(GreetingApi).getGreeting());
commit('greeting.update', (input) => inject(GreetingApi).updateGreeting(input));
```

**Do not:** invent a new registry. Do not add React hook changes. Services stay services; these classes are the React-facing facade (same split as controller vs service in Nest).

**Done when:** no page handler touches `GreetingService` / `UsersService` / `DashboardService` directly. Only providers do.

---

## Branch 3 — `feat/nest-method-pipeline`

**Goal:** `/_nr` does not “call a function from a `Map`”. It runs a **Nest provider method** so `@UseGuards`, `@UsePipes`, `@UseInterceptors`, and exception filters work.

**Nest primitives:** `ExternalContextCreator` (same thing Nest uses to bind controller methods), or a small internal controller that **injects the API class and calls the method**. Prefer the second if you can keep it obvious.

Simplest Nest-shaped version of `NestReactController`:

```ts
@Post('commit')
async commit(@Body() body: CommitBody) {
  const api = await this.moduleRef.resolve(body.provider, contextId);
  return api[body.method](...body.args);
}
```

That is still a generic RPC. Better in this branch: **stop being generic**. Add real methods, or one internal controller per API that injects the provider:

```ts
@Controller('_nr/greeting')
export class GreetingTransportController {
  constructor(private readonly greetingApi: GreetingApi) {}

  @Post('update')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  update(@Body() input: UpdateGreetingDto) {
    return this.greetingApi.updateGreeting(input);
  }
}
```

That is 100% Nest HTTP. Guards and pipes attach normally. No `executeCommit()`.

**Do:** Pick **real Nest controllers** for island mutations/refreshes. Point the existing client `commit()` / `refresh()` fetch URLs at those routes (even if ugly). Keep island UI working.

**Do not:** invent HMAC tokens. Do not add `useLoad(api.method)` yet. Do not delete `load()` from SSR pages yet.

**Done when:** a `@UseGuards` / `ValidationPipe` on the transport method actually runs. A bad DTO is a Nest 400, not your runtime swallowing `unknown[]`.

---

## Branch 4 — `refactor/drop-custom-registries`

**Goal:** Delete `loadRegistry` and `commitRegistry`. Nest’s module graph is the registry.

**Nest primitives:** providers in `AppModule`, `DiscoveryService` + `MetadataScanner` **only if** you still need a decorator index. If Branch 3 used real controllers, you may not need discovery at all.

**Do:**

- SSR reads: the page (or the HTML controller) constructor-injects `GreetingApi` **or** resolves it via the request-scoped `inject()` wrapper one last time.
- Island writes/refreshes: only Nest controller routes.
- Delete `executeCommit`, `refreshLoad` lookups by string id, and `commit.ref = { __nr_commit: id }`.

Wire identity becomes a **Nest route** (`POST /_nr/greeting/update`), not `greeting.update`. That is Nest’s security boundary (path + method + guards), which you already have for `/` and `/users`.

**Do not:** generate a second client SDK. Temporarily pass **route strings** or a tiny `{ path, method }` object into islands instead of `__nr_commit`. Ugly is fine; it is honest HTTP.

**Done when:** `src/core/data/load.ts` and `commit.ts` Maps are gone (or only used as deprecated shims). `grep` for `commitRegistry` is empty.

---

## Branch 5 — `feat/nest-security-on-the-wire`

**Goal:** Security is Nest middleware/guards/pipes, not framework crypto.

**Nest primitives:**

- Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`
- `@UseGuards(AuthGuard)` / `APP_GUARD` when you have a session
- A small **Origin / `Sec-Fetch-Site` guard** (Nest Guard wrapping the request) — CSRF for cookie sessions. Nest has no first-class CSRF; a Guard is the Nest way, not HMAC tokens
- `@nestjs/throttler` on `/_nr/*`
- `Cache-Control: no-store` on transport routes
- Delete `GET /_nr/loads/:key` (guessable, cacheable, CSRF-friendly)

**Do not:** issue capability tokens, mint `__nr_commit` secrets, or authorize in islands.

**Done when:**

- Unguessable-but-unsigned ids no longer matter because the route still runs guards
- Cross-origin POST without your origin fails
- Invalid bodies never reach `GreetingService`
- Load refresh of a key the user is not allowed to read is a Nest `403`, not a missing `Map` entry

---

## Branch 6 — `refactor/ssr-uses-providers`

**Goal:** Server pages are views. Data loading is calling Nest providers, not `load(key, fn)`.

**Do:**

```tsx
export default async function Home() {
  const greeting = await inject(GreetingApi).getGreeting();
  // ...
}
```

Then, if you want it even more Nest: resolve `GreetingApi` in `AppController` and pass data into the page. Either is valid. Constructor injection in the HTML controller is the most Nest-native; `inject(GreetingApi)` during render is the RSC-shaped version of the same DI, as long as it still uses Branch 1’s `ContextId`.

Drop `greetingLoad.key` from the manifest as a **security** id. If islands need cache identity, use the same Nest route (or method name as a **cache key only**, never as an RPC password).

**Done when:** demo pages do not call `load()` / `commit()` / `revalidate()`. Revalidation is a Nest `@Header`, interceptor, or explicit list on the controller method.

---

## Branch 7 — `refactor/react-hooks-over-nest-routes`

**Goal:** React looks like React. It still does not own data.

**Do:** Overload `useLoad` / `useCommit` to take the **same provider method or route descriptor** the server uses. Islands import a **client stub** (path + types), not `@Injectable()` classes.

```tsx
const greeting = useLoad(greetingApi.getGreeting) ?? initialMessage;
const save = useCommit(greetingApi.updateGreeting);
```

The stub’s `execute()` is `fetch` to the Nest route from Branch 3. `pending` / `error` stay React state.

**Bundler rule (this branch or a tiny follow-up):** `*.island.tsx` importing a Nest class fails the client build. Types and DTOs can be shared; `GreetingService` cannot.

**Do not:** put `ModuleRef`, `inject()`, or decorators in islands.

**Done when:** islands no longer take `loadKey` or `CommitRef` props. Home / Users / Dashboard islands still work.

---

## Branch 8 — `chore/retire-inject-and-shims`

**Goal:** Remove the service locator from the public API.

**Do:** `inject()` becomes unexported (or `internalOnly`). App code uses constructor injection in Nest classes; React uses hooks. Delete `load-keys.ts`, `__nr_commit`, and leftover `commit()` / `load()` exports from `src/core/index.ts`.

**Done when:** the only DI in the app is Nest’s.

---

## Order, and why it is this order

```txt
1  request-scoped ContextId     → without this, Nest security is fake
2  move logic into providers    → Nest owns data
3  real Nest HTTP pipeline      → Nest owns execution (guards/pipes)
4  delete custom Maps           → Nest module graph is the registry
5  ValidationPipe, guards, CSRF Guard, throttler
6  pages call providers         → SSR uses the same DI as /_nr
7  React hooks over Nest routes → native React, still Nest-backed
8  remove inject() / load() / commit() from the public API
```

Later branches are cheap if earlier ones are strict. Doing hooks (7) before request-scope (1) or the Nest pipeline (3) makes `save.execute()` look local while still being an unguarded RPC.

---

## What not to invent on any branch

- A second container next to `ModuleRef`
- HMAC / capability tokens as a substitute for guards
- A custom `@Roles` that is not a Nest guard
- Client-side authorization
- Keeping `GET /_nr/loads/:key`

`@Load` / `@Commit` are optional sugar **after** Branch 3. If real Nest controllers already feel native, you do not need those decorators. Nest’s `@Get` / `@Post` on an internal `/_nr/...` controller already mean “read” and “mutate”.