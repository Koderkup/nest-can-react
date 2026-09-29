# Adapters

## What it is

nest-can-react supports Nest’s default **Express** adapter and optional **Fastify**. HTTP responses are normalized to Node **`ServerResponse`** semantics before streaming ([`src/nest/response-utils.ts`](../../src/nest/response-utils.ts)).

## Why it exists

`setHeader`, `write`, `end`, redirect settlement, and `Set-Cookie` flush must behave the same regardless of whether the app uses `reply.raw` (Fastify) or Express `Response`.

## How it works

```ts
NestReactModule.forRoot(); // adapter: 'express' (default)

NestReactModule.forRoot({ adapter: 'fastify' });
```

Fastify apps need optional peers:

```bash
npm install @nestjs/platform-fastify @fastify/static
```

Reference: [`examples/fastify`](../../examples/fastify) vs [`examples/express`](../../examples/express).

`handleRequest` calls `normalizeHttpResponse(response)` first — Express returns as-is; Fastify unwraps `reply.raw`.

## Rules and pitfalls

- Set **`adapter: 'fastify'`** when your Nest app boots with Fastify — mismatch causes subtle header/stream bugs.
- `@fastify/static` (or equivalent) may be required to serve `public/nest-can-react` — follow the fastify example.
- `inject(REQUEST)` returns the platform request object; type accordingly.

## Related

- [NestReactModule](nest-react-module.md)
- [HTTP during render](http-during-render.md)
