# Core concepts

Nest remains the application framework. React is the rendering layer.

- Nest controllers decide which page is rendered.
- Nest modules register providers.
- Nest DI owns services and application state.
- React server pages compose HTML.
- Client islands add focused browser interactivity.
- Islands mutate by `fetch`ing Nest feature routes.

Application folder layout is **not** part of the contract. `templates/starter` is a sample. Required wiring is `nest.react.json`, `layout.tsx`, `*.island.tsx`, and `NestReactModule.forRoot()`. See [Creating your first app](first-app.md).

## Public API

From `nest-react`:

- `NestReactModule`
- `renderPage`
- `Island`
- `NestLink`
- `setLayoutMeta` / `useLayoutMeta` / `getLayoutMeta`

From `nest-react/client`:

- `useCommit`
- `refresh`

Generated boot imports `nest-react/register` and `nest-react/layout`. Apps do not call those.

## Render

```ts
renderPage(Page, props, options?)
renderPage(<Page {...props} />, options?)
```

Options:

- `{ mode: 'static' }` — default, `renderToStaticMarkup`
- `{ mode: 'hydrated' }` — `renderToString`
- `{ mode: 'streaming', response }` — pipeable stream

`renderPage` wraps the page in the configured layout, then injects:

- stylesheet `<link>` tags for `client.styles` and the current page’s island CSS
- `#nr-runtime` — shared client runtime root
- `#nr-document` — page body that client navigation replaces
- `#nr-manifest` — JSON islands
- hashed runtime `<script type="module">` and island `modulepreload` hints

Asset URLs come from `public/nest-react/manifest.json` after `nest-react build`.

## `Island`

```tsx
import { GreetingEditor } from './islands/GreetingEditor.island';

<Island
  mode="hydrate"
  name={GreetingEditor}
  props={{ ... }}
/>
```

| Mode | Server HTML | Client |
| --- | --- | --- |
| `mount` | Empty `<div id="nr-i0">` | Portal from the runtime root into that host |
| `hydrate` | Same host, SSR inner HTML | `hydrateRoot` on first load; after SPA navigation, a new root on the new host |

Pass the island component as `name`. String names still work as an escape hatch.

## Client runtime

`installClientRuntime(registry, ClientRuntime)` preloads island modules, mounts `#nr-runtime`, portals **mount** islands, and hydrates **hydrate** islands.

Optional `runtime.entry` in `nest.react.json` exports `ClientRuntime` for shared client wrapping. If omitted, the bundler emits a pass-through.

## Client navigation

Same-origin `<a>` clicks fetch HTML and replace `#nr-document`. `refresh()` re-GETs the current URL without a history change and keeps island hosts so island state survives.

## `useCommit`

```ts
import { useCommit } from 'nest-react/client';

const { commit, pending, state } = useCommit('/note');
```

POSTs JSON. Default `revalidate: true` calls `refresh()` after success. `state` is `idle | submitting | revalidating`.

## Client bundle

`nest-react build` / `nest-react dev` use `nest.react.json`:

- `layout` — server layout module
- `client.outDir` / `client.publicPath`
- `client.codeSplitting` — per-island chunks when true
- `client.styles` — global CSS linked on every page
- `runtime.entry` — optional `ClientRuntime`
- `islands.include` / `islands.exclude`

Islands can import CSS and assets:

```ts
import './GreetingEditor.css';
import mark from './mark.svg';
import classes from './editor.module.css';
```

Do not import CSS or assets from server pages or `layout.tsx`. Put global CSS in `client.styles`.

Generated:

```txt
.nest-react/generated/     # boot, registries, client-entry
public/nest-react/         # runtime, CSS, chunks, manifest.json
```

## Current limits

- Guard island `POST` routes like any Nest API (CSRF if you use cookies).
- No PostCSS, Tailwind, or Vite `?url` / `?raw`.
- CSS modules work in client islands, not in server pages.
