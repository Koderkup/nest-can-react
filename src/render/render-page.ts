import type { IncomingMessage } from 'node:http';
import { existsSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runWithNestContext } from '../nest/inject';
import type { RenderableResponse } from '../nest/response-utils';

export type RenderPageOptions = {
  response: RenderableResponse;
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

const bundleRequire = createRequire(
  pathToFileURL(join(process.cwd(), 'package.json')).href,
);

let runtimePromise: Promise<RenderRuntime> | undefined;
let loadedBundlePath: string | undefined;
let loadedMtime = 0;

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

async function resolveServerBundleWithRetry(
  attempts = 8,
  delayMs = 50,
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return resolveServerBundle();
    } catch (error) {
      lastError = error;

      if (process.env.NEST_CAN_REACT_DEV !== '1' || attempt === attempts - 1) {
        break;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, delayMs);
      });
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('nest-can-react server bundle not found.');
}

function readBundleRuntime(bundlePath: string): RenderRuntime {
  const resolved = bundleRequire.resolve(bundlePath);

  for (const key of Object.keys(bundleRequire.cache)) {
    if (key === resolved || key.startsWith(`${resolved}`)) {
      delete bundleRequire.cache[key];
    }
  }

  const mod = bundleRequire(resolved) as RenderRuntime & {
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
}

async function loadRuntime(): Promise<RenderRuntime> {
  const bundlePath = await resolveServerBundleWithRetry();
  const mtime = statSync(bundlePath).mtimeMs;

  if (
    runtimePromise &&
    loadedBundlePath === bundlePath &&
    loadedMtime === mtime
  ) {
    return runtimePromise;
  }

  loadedBundlePath = bundlePath;
  loadedMtime = mtime;
  runtimePromise = Promise.resolve().then(() => readBundleRuntime(bundlePath));

  try {
    return await runtimePromise;
  } catch (error) {
    runtimePromise = undefined;
    loadedMtime = 0;
    throw error;
  }
}

/** Clear cached RSC runtime (used after HMR rebuilds). */
export function invalidateRenderRuntime() {
  runtimePromise = undefined;
  loadedBundlePath = undefined;
  loadedMtime = 0;
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

  await runWithNestContext({ request: options.request }, async () => {
    const runtime = await loadRuntime();
    await runtime.renderNestPage(page, props, options);
  });
}
