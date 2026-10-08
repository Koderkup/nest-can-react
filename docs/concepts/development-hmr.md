# Development and HMR

## What it is

**Push-only HMR** in dev: no polling. Two channels:

1. **RSC / Flight** — server UI changes trigger refetch of the current URL.
2. **Client / CSS** — Rspack Fast Refresh on `'use client'` modules and styles.

## Why it exists

Nest and React compile on different graphs. Nest should not restart on every `.tsx` edit; client islands should keep state when safe.

## How it works

**Same-origin WebSockets** on the Nest port (e.g. `3000`):

| Path | Role |
| --- | --- |
| `/__nest_can_react/hmr` | RSC hub: `hello`, `building`, `rsc-update`, `build-error`, `build-ok` |
| `/__nest_can_react/rspack-hmr` | Proxied to client dev server for Fast Refresh |

Internal hubs (defaults): RSC **`9101`**, client **`9102`**. `NestReactModule` attaches upgrade proxies when `NEST_CAN_REACT_DEV=1`.

**Nest `--watch`:**

- Uses `tsconfig.build.json` (`.ts` only).
- Ignores `**/*.tsx` and `**/*.css` — UI edits do **not** restart Nest.
- Changing controllers, services, guards, or DI **does** restart Nest; HMR reconnects and refetches Flight.

**State:**

- `'use client'` islands keep React state across Fast Refresh and safe RSC refetch.
- Full reload when an update cannot apply safely (declined HMR, error recovery, reload loop guard).

Adding/removing `*.page.tsx` regenerates entries; `nest-can-react dev` handles without restarting the CLI process. The watcher follows `pages.include`, so pages kept outside `src` are detected too.

## Example workflow

Terminal 1: `npm run view:dev`  
Terminal 2: `npm run start:dev`

See [AGENTS.md](../../AGENTS.md).

## Rules and pitfalls

- Both terminals required in dev.
- Failed compiles show overlay until next successful build.
- Do not expect Nest to hot-reload React files — that is the bundler’s job.

## Related

- [NestReactModule](nest-react-module.md)
- [CLI and build](cli-and-build.md)
