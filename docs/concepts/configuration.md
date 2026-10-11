# Configuration

## What it is

**`nest.react.json`** at the project root defines layout, page globs, client bundle output, and optional dev ports. It is the contract between your app and the `nest-can-react` CLI.

## Why it exists

The bundler must know which files are pages, where the layout lives, and where to write assets so `NestReactModule` can serve them.

## How it works

```json
{
  "layout": "src/layout.tsx",
  "pages": {
    "include": ["src/**/*.page.tsx"],
    "exclude": ["src/**/*.test.tsx", "src/**/*.spec.tsx"]
  },
  "client": {
    "outDir": "public/nest-can-react",
    "publicPath": "/assets/nest-can-react",
    "styles": ["src/assets/layout.css"]
  }
}
```

| Field | Purpose |
| --- | --- |
| `layout` | Single document shell |
| `pages.include` / `exclude` | Files that become pages and `react-pages.ts` refs. The dev watcher derives its watch roots from `include`, so pages outside `src` are detected too. |
| `client.outDir` | Browser bundle output |
| `client.publicPath` | URL prefix — **must match** `NestReactModule.forRoot({ publicPath })` |
| `client.styles` | Global CSS entry files |

Optional: **`hmrPort`** (default `9101`), **`clientDevPort`** (default `9102`) if ports collide.

Example in repo: [`examples/express/nest.react.json`](../../examples/express/nest.react.json).

## Rules and pitfalls

- Changing `publicPath` requires updating **both** JSON and `NestReactModule`.
- Excluded tests prevent accidental page registration.
- Layout path is relative to project root (where you run the CLI).

## Related

- [CLI and build](cli-and-build.md)
- [Package APIs: Config](../api.md#config-nestreactjson)
