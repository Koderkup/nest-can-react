import type { ServerResponse } from 'node:http';

/**
 * The subset of the Node.js `http.ServerResponse` API that the
 * RSC/SSR render pipeline relies on.  Express responses extend
 * `ServerResponse`; Fastify replies do *not* — they expose `header()`,
 * `code()`, `send()` instead.
 */
export type RenderableResponse = {
  statusCode: number;
  setHeader(name: string, value: string | string[] | number): void;
  write(chunk: string | Buffer | Uint8Array): boolean;
  end(chunk?: string | Buffer | Uint8Array): void;
  readonly headersSent: boolean;
};

/**
 * Shape-check for a Node.js `http.ServerResponse` (or Express, which
 * extends it).  This avoids importing `http` types at runtime and
 * keeps the check duck-typed so it works across adapter versions.
 */
function isServerResponseLike(obj: unknown): obj is ServerResponse {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const r = obj as Record<string, unknown>;

  return (
    typeof r.setHeader === 'function' &&
    typeof r.write === 'function' &&
    typeof r.end === 'function' &&
    typeof r.headersSent === 'boolean'
  );
}

/**
 * Normalize the HTTP response object returned by
 * `context.switchToHttp().getResponse()` so that the render pipeline always
 * receives something with Node.js `ServerResponse` semantics.
 *
 * - Express / platform-express: the response is already a decorated
 *   `http.ServerResponse` — returned as-is.
 * - Fastify / platform-fastify: `getResponse()` returns a Fastify `Reply`,
 *   whose underlying Node response is exposed via `reply.raw`.  We unwrap it
 *   so `setHeader` / `write` / `end` / `headersSent` / `statusCode` are
 *   available on the object the render pipeline touches.
 *
 * Detecting by shape (rather than by adapter string) keeps this function
 * safe to call from the generated `rsc.js` bundle where the adapter name
 * may not be statically known.
 */
export function normalizeHttpResponse(
  response: unknown,
): RenderableResponse {
  if (response == null) {
    throw new Error(
      'nest-can-react: HTTP response is required to render a page.',
    );
  }

  // Already a Node.js ServerResponse (Express or pre-unwrapped Fastify raw).
  if (isServerResponseLike(response)) {
    return response as RenderableResponse;
  }

  // Fastify reply — unwrap the raw Node response via `reply.raw`.
  const reply = response as { raw?: unknown };
  if (
    reply &&
    typeof reply === 'object' &&
    isServerResponseLike(reply.raw)
  ) {
    return reply.raw as RenderableResponse;
  }

  throw new Error(
    'nest-can-react: Unable to normalize the HTTP response for rendering. ' +
      'Ensure you are using a supported adapter (Express or Fastify). ' +
      'If using Fastify (platform-fastify), the underlying Node.js ' +
      'ServerResponse (reply.raw) must be available.',
  );
}
