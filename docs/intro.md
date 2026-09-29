# Introduction

**nest-can-react** adds React Server Components (RSC) to an **existing** NestJS application. Nest remains the host: modules, dependency injection, guards, pipes, interceptors, and HTTP routing stay exactly where they are today. React becomes the UI layer, streaming component trees over the **Flight** wire protocol.

You do not run a separate frontend app or adopt a second routing system. A Nest controller chooses which screen to show; the page loads data from the **same** Nest container the controller already used.

---

## Who this is for

- Teams already invested in **Nest** who want **React 19**-style Server Components and small client **islands**, not a full client-rendered SPA.
- Backends that expose both **HTML pages** and **JSON APIs** from one codebase, with one auth and DI story.
- Projects that outgrew template strings or static files from controllers but do not want to merge two frameworks (for example Nest + Angular) or surrender routing to a React meta-framework.

---

## What you install

In your Nest app:

```bash
npm install nest-can-react react react-dom react-server-dom-rspack
```

Peer dependencies (see the package `package.json` for versions):

- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` (default HTTP adapter)
- `react`, `react-dom`, `react-server-dom-rspack`, `rxjs`

**Fastify:** optional peers `@nestjs/platform-fastify` and `@fastify/static`, plus `NestReactModule.forRoot({ adapter: 'fastify' })`. See [Adapters](concepts/adapters.md) and [`examples/fastify`](../examples/fastify).

Scaffold the welcome starter:

```bash
npx nest-can-react init
```

`init` does **not** create a new Nest project. It copies starter files into your app and registers `NestReactModule`.

---

## Mental model (30 seconds)

1. **Route** — Nest `@Controller` + `@Get()` (guards run first).
2. **Render** — Handler returns `render(WelcomePage)` where `WelcomePage` is a **page ref** from generated `src/react-pages.ts`, not a direct import of the `.tsx` file.
3. **Page** — Server Component (`'use server-entry'`) calls `inject(WelcomeService)` (and optionally `inject(REQUEST)`) to read data from Nest.
4. **Layout** — Wraps every page (`layout.tsx`); can read `useLayoutMeta()` for `<title>` and shared chrome.
5. **Islands** — Interactive pieces use `'use client'`; they POST mutations to Nest routes via `useCommit` from `nest-can-react/client`.
6. **Response** — Always a **stream**: full HTML for browser navigations, Flight-only for RSC refetches (`Accept: text/x-component`).

```ts
import { NestReactModule, render, inject } from 'nest-can-react';
```

```ts
@Get()
index() {
  return render(WelcomePage);
}
```

```tsx
'use server-entry';

export default function WelcomePage() {
  const data = inject(WelcomeService).getPage();
  return <h1>{data.tagline}</h1>;
}
```

---

## Where to go next

| Goal | Read |
| --- | --- |
| See how a request flows end-to-end | [Overview](overview.md) |
| Understand alternatives (Inertia, SPA, Angular, etc.) | [Why nest-can-react?](why-nest-can-react.md) |
| Build something hands-on | [Creating your first app](first-app.md) |
| Look up an export | [Package APIs](api.md) |
| Decode terminology | [Glossary](glossary.md) |
