# NestReactModule

## What it is

`NestReactModule.forRoot(options?)` is a Nest module you import once (typically in `AppModule`). It:

- Serves compiled browser assets from disk at a configurable URL prefix.
- In development (`NEST_CAN_REACT_DEV=1`), attaches WebSocket upgrade proxies so HMR works on the **same origin** as your Nest server.

## Why it exists

Without it, the browser cannot load `main.js`, CSS, or talk to the RSC / Fast Refresh sockets through Nest. The package centralizes asset paths and dev wiring so every app does not reimplement static middleware and proxies.

## How it works

| Option | Default | Purpose |
| --- | --- | --- |
| `assetsDir` | `<cwd>/public/nest-can-react` | Directory written by `nest-can-react build` / `dev` |
| `publicPath` | `/assets/nest-can-react` | URL prefix for those files |
| `adapter` | `'express'` | Set `'fastify'` when using `@nestjs/platform-fastify` |

`publicPath` must match `client.publicPath` in [nest.react.json](configuration.md).

## Example

```ts
import { Module } from '@nestjs/common';
import { NestReactModule } from 'nest-can-react';

@Module({
  imports: [NestReactModule.forRoot(), FeatureModule],
})
export class AppModule {}
```

Fastify: [`examples/fastify/src/app.module.ts`](../../examples/fastify/src/app.module.ts).

## Rules and pitfalls

- Import **once** at the root; feature modules only add controllers that `render()` pages.
- After changing `nest.react.json` output paths, update **both** config and `forRoot({ assetsDir, publicPath })`.
- Fastify requires optional peers — see [Adapters](adapters.md).

## Related APIs

- [Package APIs: `NestReactModule.forRoot`](../api.md#nestreactmoduleforrootoptions)
