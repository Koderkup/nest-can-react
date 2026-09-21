# Core concepts

Nest remains the application framework. React is the rendering layer.

- Nest controllers decide which page is rendered.
- Nest modules register providers.
- Nest DI owns services and application state.
- React server pages compose HTML.
- Client islands add focused browser interactivity.
- Islands mutate by `fetch`ing Nest feature routes.

Install into an existing Nest app with `npm install nest-can-react` and `npx nest-can-react init`. Required wiring is `nest.react.json`, `layout.tsx`, `*.island.tsx`, and `NestReactModule.forRoot()`. See [Creating your first app](first-app.md).

## Public API

From `nest-can-react`:

- `NestReactModule`
- `renderPage`
- `Island`
- `NestLink`
- `setLayoutMeta` / `useLayoutMeta` / `getLayoutMeta`

From `nest-can-react/client`:

- `useCommit`
- `refresh`

Generated boot imports `nest-can-react/register` and `nest-can-react/layout`. Apps do not call those.

## Render

```ts
renderPage(Page, props, options?)
renderPage(<Page {...props} />, options?)
```

Options:

- `{ mode: 'static' }` — default, `renderToStaticMarkup`
- `{ mode: 'hydrated' }` — `renderToString`
- `{ mode: 'streaming', response }` — pipeable stream

`renderPage` wraps the page in the configured layout, then injects stylesheet links, `#nr-runtime`, `#nr-document`, `#nr-manifest`, and the hashed runtime script.

Asset URLs come from `public/nest-can-react/manifest.json` after `nest-can-react build`.

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

## `useCommit`

```ts
import { useCommit } from 'nest-can-react/client';

const { commit, pending, state } = useCommit('/note');
```

POSTs JSON. Default `revalidate: true` calls `refresh()` after success.

## Client bundle

`nest-can-react build` / `nest-can-react dev` use `nest.react.json`.

Generated:

```txt
.nest-can-react/generated/
public/nest-can-react/
```

## Current limits

- Guard island `POST` routes like any Nest API (CSRF if you use cookies).
- No PostCSS, Tailwind, or Vite `?url` / `?raw`.
- CSS modules work in client islands, not in server pages.
