# CLI and build

## What it is

The **`nest-can-react`** binary (`npx nest-can-react …`) compiles RSC + client bundles and scaffolds starters.

| Command | Role |
| --- | --- |
| `init [dir]` | Copy welcome starter into an **existing** Nest app; register module |
| `dev` | Watch mode + dual-channel HMR (alias `view:dev` in examples) |
| `build` | Production RSC server bundle + client assets |

Example scripts — [`examples/express/package.json`](../../examples/express/package.json):

- `build:client` → `node ../../bin/nest-can-react.mjs build`
- `view:dev` → `node ../../bin/nest-can-react.mjs dev`

## Why it exists

Rspack dual graphs (server RSC/SSR + client hydration) are non-trivial. The CLI generates entries under `.nest-can-react/generated/` and writes `src/react-pages.ts`.

## How it works

Outputs:

| Path | Contents |
| --- | --- |
| `.nest-can-react/generated/` | Codegen — do not edit |
| `.nest-can-react/server/rsc.js` | Node RSC bundle |
| `public/nest-can-react/` | Browser JS, CSS, hashed assets |

**Production checklist:**

1. `nest-can-react build` (or `npm run build:client`).
2. `nest build` / `nest start` as usual.
3. Ensure `public/nest-can-react` is deployed with the app (or served from configured `assetsDir`).

**Package library build** (this repo): `npm run build` → `tsc` for `dist/` — separate from app `nest-can-react build`.

## Rules and pitfalls

- Run CLI from the Nest app root (where `nest.react.json` lives).
- Commit `react-pages.ts` or regenerate in CI before `nest build` — team policy choice; examples commit generated refs.
- Adding/removing pages requires rebuild/regenerate so refs stay in sync.

## Related

- [Development and HMR](development-hmr.md)
- [Configuration](configuration.md)
