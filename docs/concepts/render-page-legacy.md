# renderPage (legacy)

## What it is

**`renderPage(name, props, options)`** loads a page by string id (`'welcome'`), optional serializable **props**, and streams to a **`response`** you already hold — usually from `@Res()` in a controller.

## Why it exists

Escape hatch for code that already manages the raw Express/Fastify response or needs to pass props into the RSC tree. New apps should prefer **`render(PageRef)`** and **`inject()`** instead of controller-passed props.

## How it works

| Option | Required | Role |
| --- | --- | --- |
| `response` | yes | Express `Response` or Node `ServerResponse` |
| `request` | no | URL for refetch + `inject(REQUEST)` |
| `url` | no | Override when request missing |
| `statusCode` | no | Initial status |

Call from controller methods **after** guards run — never from inside a Server Component.

**`invalidateRenderRuntime()`** drops the cached `rsc.js` load — rarely needed; dev reloads automatically.

## Example

```ts
@Get()
async index(@Req() request: Request, @Res() response: Response) {
  await renderPage('welcome', {}, { request, response });
}
```

## Rules and pitfalls

- Props bypass the “no view props” convention — use sparingly.
- Taking `@Res()` disables some Nest response interceptors — know Nest `@Res()` semantics.
- Page id comes from filename: `welcome.page.tsx` → `'welcome'`.

## Related APIs

- [Package APIs: `renderPage`](../api.md#renderpagename-props-options)
- [Render and page refs](render-and-page-refs.md) — preferred path
