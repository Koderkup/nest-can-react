import type { IncomingMessage, ServerResponse } from 'node:http';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Response as ExpressResponse } from 'express';

export type RenderPageOptions = {
  response: ServerResponse | ExpressResponse;
  request?: IncomingMessage | Request;
  statusCode?: number;
  url?: string;
};

type RenderRuntime = {
  renderNestPage: (
    pageName: string,
    props: Record<string, unknown>,
    options: RenderPageOptions,
  ) => Promise<void>;
  listPages?: () => string[];
};

let runtimePromise: Promise<RenderRuntime> | undefined;

function resolveServerBundle() {
  const candidates = [
    join(process.cwd(), '.nest-can-react/server/rsc.js'),
    join(process.cwd(), 'dist/.nest-can-react/server/rsc.js'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    'nest-can-react server bundle not found. Run `nest-can-react build` or `nest-can-react dev` first.',
  );
}

async function loadRuntime(): Promise<RenderRuntime> {
  if (!runtimePromise) {
    runtimePromise = (async () => {
      const bundlePath = resolveServerBundle();
      const href = `${pathToFileURL(bundlePath).href}?t=${Date.now()}`;
      const mod = (await import(href)) as RenderRuntime & {
        default?: RenderRuntime;
      };

      if (typeof mod.renderNestPage === 'function') {
        return mod;
      }

      if (mod.default && typeof mod.default.renderNestPage === 'function') {
        return mod.default;
      }

      throw new Error(
        'Invalid nest-can-react RSC bundle: missing renderNestPage.',
      );
    })();
  }

  return runtimePromise;
}

/** Clear cached RSC runtime (used after HMR rebuilds). */
export function invalidateRenderRuntime() {
  runtimePromise = undefined;
}

/**
 * Stream a Server Component page to the Nest/Express response.
 * Streaming is the only render mode.
 */
export async function renderPage(
  page: string,
  props: Record<string, unknown> = {},
  options: RenderPageOptions,
): Promise<void> {
  if (!options?.response) {
    throw new Error('renderPage requires { response }.');
  }

  if (process.env.NEST_CAN_REACT_DEV === '1') {
    invalidateRenderRuntime();
  }

  const runtime = await loadRuntime();
  await runtime.renderNestPage(page, props, options);
}
