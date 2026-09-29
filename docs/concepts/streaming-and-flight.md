# Streaming and Flight

## What it is

Every UI response is a **stream**, not a buffered string. **Flight** is React’s RSC wire format (`react-server-dom-rspack`). The server renders a tree of Server Components and serializes updates the client can merge.

## Why it exists

Streaming improves time-to-first-byte and matches React 19 RSC architecture. The same render path serves full documents and partial RSC refetches.

## How it works

`handleRequest` ([`src/flight/handle-request.ts`](../../src/flight/handle-request.ts)) chooses output from the request **`Accept`** header (via `parseRenderRequest`):

| Accept | Response |
| --- | --- |
| `text/html` (typical navigation) | SSR HTML stream with embedded Flight payload and bootstrap scripts |
| `text/x-component` | Flight-only stream (client refetch after `refresh()` / navigation helpers) |

**Lazy render:** RSC work starts when the Flight stream is consumed. That is why [`redirect()`](http-during-render.md) and cookie flush happen after the first stream read — so a redirect can abort before HTML is committed.

Dev responses include `cache-control: no-store` when `NEST_CAN_REACT_DEV=1`.

## Example

Open `/welcome` in a browser (HTML) vs watch the RSC client refetch in devtools when editing a server component (Flight).

## Rules and pitfalls

- Do not assume the full HTML exists before the stream finishes.
- Side effects that mutate HTTP (status, redirect, cookies) must use package helpers, not raw `response` in components.
- Flight is **not** a public REST API for arbitrary clients — treat RSC endpoints as part of your UI protocol; secure pages with Nest guards.

## Related guides

- [HTTP during render](http-during-render.md)
- [Development and HMR](development-hmr.md)
