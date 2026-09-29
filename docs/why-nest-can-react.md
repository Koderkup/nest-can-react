# Why nest-can-react?

NestJS excels at structured backends: modules, dependency injection, guards, and explicit HTTP APIs. Modern UIs often want component composition, streaming, and selective client interactivity. **nest-can-react** connects those worlds by hosting **React Server Components** inside Nest—not by replacing Nest with a JavaScript meta-framework or by treating the server as a JSON-only API.

This page compares common alternatives honestly. The package makes specific tradeoffs: **no view props from controllers**, **`inject()` instead of a second DI graph**, **guards on Nest routes**, and **mutations through Nest handlers** (often via `useCommit`).

---

## React inside Nest (not “React inside React”)

Nest runs the HTTP server and application container. React runs as a **compiled RSC bundle** (`.nest-can-react/server/rsc.js`) that streams through Nest’s response pipeline. Adapter differences (Express vs Fastify) are normalized before `setHeader` / `write` / `end` ([`src/nest/response-utils.ts`](../src/nest/response-utils.ts), [`src/flight/handle-request.ts`](../src/flight/handle-request.ts)).

There is one process and one DI graph for business logic. Server Components call `inject(YourService)`; they do not receive serialized DTOs as React props from the controller.

---

## Compared to SPA + JSON API

| SPA + API | nest-can-react |
| --- | --- |
| Separate deploy or repo for frontend | Single Nest app |
| Auth often split (JWT in SPA, CORS, duplicate validation) | Same guards and services for HTML and JSON |
| Client loads full page graph and data-fetch layer | RSC sends server-rendered UI; only islands hydrate |
| API versioning independent of UI | UI and API share modules; still can expose REST beside pages |

**Choose SPA + API** when a dedicated frontend team, CDN-first static hosting, or a mobile client consuming the same API is the primary product shape.

**Choose nest-can-react** when the product is still “a Nest app with rich web UI” and you want less client JavaScript and duplicated auth wiring.

---

## Compared to static HTML or templates from controllers

Some Nest apps serve Handlebars, EJS, or `res.sendFile` from `@Get()` handlers. That works for simple pages but scales poorly for interactive UI:

- No first-class **component composition** or shared layout/page conventions.
- No **progressive hydration** — either full page reloads or you add a separate client bundle anyway.
- Business logic drifts into templates or fat controllers.

nest-can-react adds a bundler and RSC graph, but you gain React’s model, `'use client'` islands, and Flight refetch for partial updates.

**Choose templates** for mostly static marketing or admin pages with minimal interactivity.

**Choose nest-can-react** when the UI is a real application with shared chrome, forms, and stateful islands.

---

## Compared to Inertia.js (Nest + Vue/React with props)

Inertia couples server routes to client pages by **serializing props** across the wire. The controller loads data and passes it into the page component. That is a mature monolith pattern.

nest-can-react **deliberately avoids controller-passed view props**. The controller returns `render(UsersPage)`; `UsersPage` calls `inject(UsersService)` and `inject(REQUEST)`. Reasons:

- Keeps **one data-access story** in Nest services already used by REST endpoints.
- Avoids duplicating “load DTO for Inertia” vs “load entity for API”.
- Aligns with **RSC** where server components fetch during render rather than receiving a prop bag from outside React.

**Choose Inertia** when you want a well-trodden SPA-in-monolith model and are fine with props-driven pages.

**Choose nest-can-react** when you want RSC streaming, smaller client bundles, and Nest services as the single source of truth during render.

---

## Compared to Angular (Nest’s historical pairing)

Nest and Angular share enterprise patterns: modules, DI, TypeScript-first, structured apps. Many teams run **Nest API + Angular SPA** successfully.

nest-can-react is **not** “Nest + Angular in one repo.” It is for teams standardizing on **React** (especially RSC and the React 19 ecosystem) while keeping Nest as the host. You do not merge Angular’s change detection and Nest’s request lifecycle; you adopt React’s component boundaries instead.

**Choose Angular** when the organization standard is Angular, you want Angular SSR/prerendering as the front-end platform, or you prefer templates + RxJS over React.

**Choose nest-can-react** when the UI stack decision is React and you want Nest to remain authoritative for routing and security.

---

## Compared to Next.js (or similar full-stack React frameworks)

Next.js owns routing, RSC conventions, and deployment. nest-can-react is **Nest-first**:

- Routes remain **Nest controllers** (`@Get`, `@Post`, guards).
- You add pages by adding `*.page.tsx` and a controller method—not by file-system routing alone.
- Existing Nest modules, microservice clients, and guards stay in place.

**Choose Next** for greenfield products that want file-based routing, Vercel-style deployment, and an integrated React framework as the center of gravity.

**Choose nest-can-react** when the center of gravity is already an Nest codebase (or must stay Nest for compliance, team skills, or existing modules).

---

## When not to use nest-can-react

- The app is **mostly static** pages with no need for RSC or islands.
- The organization mandates **Angular** (or another non-React UI stack).
- You want **zero bundler** and refuse a `.nest-can-react` build step.
- You need **file-system-only routing** with no Nest controllers per screen.

---

## Next steps

- [Overview](overview.md) — lifecycle and file layout
- [Creating your first app](first-app.md) — install and first page
- [Security](concepts/security.md) — guards, mutations, sessions
