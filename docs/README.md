# nest-can-react documentation

Nest-native **React Server Components** over the **Flight** protocol. Nest owns routing, DI, guards, and APIs; React streams the UI in the same process.

Full reference apps live in the repository:

- [`examples/express`](../examples/express) — default (`@nestjs/platform-express`)
- [`examples/fastify`](../examples/fastify) — optional Fastify adapter

For agent and contributor commands, see [AGENTS.md](../AGENTS.md) at the repo root.

---

## Start here

| Doc | What you get |
| --- | --- |
| [Introduction](intro.md) | What the package is, who it is for, and a 30-second mental model |
| [Overview](overview.md) | Request lifecycle, ownership boundaries, repo layout, concept index |
| [Creating your first app](first-app.md) | Step-by-step install and first page |

---

## Philosophy

| Doc | What you get |
| --- | --- |
| [Why nest-can-react?](why-nest-can-react.md) | Compared to SPA+API, static templates, Inertia, Angular, and full-stack React frameworks |

---

## Guides (concepts)

Each guide explains one idea: what it is, why it exists here, how it works, examples, and pitfalls.

| Guide | Topic |
| --- | --- |
| [Concept index](concepts/README.md) | Suggested reading order |
| [NestReactModule](concepts/nest-react-module.md) | Assets, HMR proxies, adapter option |
| [Render and page refs](concepts/render-and-page-refs.md) | `render()`, `react-pages.ts`, controllers |
| [inject() and REQUEST](concepts/inject-and-request.md) | Nest DI from Server Components |
| [Server and client components](concepts/server-and-client-components.md) | `'use server-entry'`, `'use client'`, layout |
| [Layout meta](concepts/layout-meta.md) | Document title and head metadata |
| [Streaming and Flight](concepts/streaming-and-flight.md) | HTML vs RSC responses, lazy render |
| [HTTP during render](concepts/http-during-render.md) | Status, redirect, cookies |
| [Navigation](concepts/navigation.md) | `NestLink`, client transitions |
| [Mutations and revalidation](concepts/mutations-and-revalidation.md) | `useCommit`, `refresh` |
| [renderPage (legacy)](concepts/render-page-legacy.md) | Lower-level streaming API |
| [Configuration](concepts/configuration.md) | `nest.react.json` |
| [CLI and build](concepts/cli-and-build.md) | `init`, `dev`, `build`, production |
| [Development and HMR](concepts/development-hmr.md) | WebSockets, watch behavior, state |
| [Adapters](concepts/adapters.md) | Express vs Fastify |
| [Security](concepts/security.md) | Guards, mutations, sessions |

---

## Reference

| Doc | What you get |
| --- | --- |
| [Package APIs](api.md) | Export-by-export reference (server and client) |
| [Glossary](glossary.md) | Terms used across these docs |

---

## Legacy redirect

[Core concepts](core-concepts.md) previously held a single long page. That content now lives in [Overview](overview.md) and the [concept guides](concepts/README.md).
