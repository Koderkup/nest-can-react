import { AsyncLocalStorage } from 'node:async_hooks';
import type { ServerResponse } from 'node:http';

export type LayoutMeta = {
  title?: string;
  description?: string;
  [key: string]: unknown;
};

export type Redirect = {
  url: string;
  statusCode: RedirectStatus;
};

export type RedirectStatus = 301 | 302 | 303 | 307 | 308;

export type SameSite = 'strict' | 'lax' | 'none' | boolean;

export interface CookieOptions {
  domain?: string;
  path?: string;
  expires?: Date | number;
  maxAge?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: SameSite;
  partitioned?: boolean;
}

export interface CookieInstance {
  name: string;
  value: string;
  options: CookieOptions;
}

type Store = {
  layoutMeta: LayoutMeta;
  statusCode?: number;
  redirect?: Redirect;
  response?: ServerResponse;
  cookies: CookieInstance[];
};

const REDIRECT_STATUS_CODES: ReadonlySet<number> = new Set([
  301, 302, 303, 307, 308,
]);

const DEFAULT_COOKIE_OPTIONS: CookieOptions = { path: '/' };

const storage = new AsyncLocalStorage<Store>();

export function runWithLayoutMeta<T>(callback: () => T): T {
  return storage.run(
    { layoutMeta: {}, cookies: [] },
    callback,
  );
}

export function setLayoutMeta(meta: LayoutMeta) {
  const store = storage.getStore();

  if (!store) {
    throw new Error(
      'setLayoutMeta() must run during a page render (Server Component).',
    );
  }

  store.layoutMeta = {
    ...store.layoutMeta,
    ...meta,
  };
}

export function getLayoutMeta() {
  return storage.getStore()?.layoutMeta ?? {};
}

export function useLayoutMeta() {
  return getLayoutMeta();
}

export function setStatus(statusCode: number) {
  const store = storage.getStore();

  if (!store) {
    throw new Error(
      'setStatus() must run during render() (Server Component render).',
    );
  }

  store.statusCode = statusCode;

  if (store.response && !store.response.headersSent) {
    store.response.statusCode = statusCode;
  }
}

export function getStatusCode() {
  return storage.getStore()?.statusCode;
}

export function redirect(url: string, statusCode: RedirectStatus = 302) {
  const store = storage.getStore();

  if (!store) {
    throw new Error(
      'redirect() must run during render() (Server Component render).',
    );
  }

  if (!REDIRECT_STATUS_CODES.has(statusCode)) {
    throw new Error(
      `redirect() status must be one of 301, 302, 303, 307, 308 (got ${statusCode}).`,
    );
  }

  store.redirect = { url, statusCode };
  store.statusCode = statusCode;
}

export function getRedirect() {
  return storage.getStore()?.redirect;
}

export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
) {
  const store = storage.getStore();

  if (!store) {
    throw new Error(
      'setCookie() must run during render() (Server Component render).',
    );
  }

  store.cookies.push({
    name,
    value,
    options: { ...DEFAULT_COOKIE_OPTIONS, ...options },
  });
}

export function clearCookie(name: string, options: CookieOptions = {}) {
  setCookie(name, '', {
    ...options,
    maxAge: 0,
    expires: new Date(0),
  });
}

export function getCookies(): CookieInstance[] {
  return storage.getStore()?.cookies ?? [];
}

export function getCookie(name: string): string | undefined {
  const store = storage.getStore();
  const headers = store?.response?.req?.headers;
  const raw = headers?.cookie;

  if (!raw) {
    return undefined;
  }

  const token = `${name}=`;
  const found = raw
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(token));

  if (!found) {
    return undefined;
  }

  return decodeURIComponent(found.slice(token.length));
}

export function serializeCookie(cookie: CookieInstance): string {
  const parts: string[] = [`${cookie.name}=${cookie.value}`];
  const opts = cookie.options;

  parts.push(`Path=${opts.path ?? '/'}`);

  if (opts.domain) {
    parts.push(`Domain=${opts.domain}`);
  }

  if (opts.expires) {
    const epoch =
      typeof opts.expires === 'number'
        ? new Date(opts.expires * 1000).toUTCString()
        : opts.expires.toUTCString();
    parts.push(`Expires=${epoch}`);
  }

  if (opts.maxAge != null) {
    parts.push(`Max-Age=${opts.maxAge}`);
  }

  if (opts.httpOnly) {
    parts.push('HttpOnly');
  }

  if (opts.secure) {
    parts.push('Secure');
  }

  if (opts.sameSite) {
    parts.push(
      `SameSite=${
        typeof opts.sameSite === 'boolean'
          ? opts.sameSite
            ? 'Strict'
            : 'None'
          : opts.sameSite
      }`,
    );
  }

  if (opts.partitioned) {
    parts.push('Partitioned');
  }

  return parts.join('; ');
}

export function getCookiesForResponse(
  response: ServerResponse,
): string[] {
  const store = storage.getStore();
  if (!store || store.response !== response) {
    return [];
  }
  return store.cookies.map(serializeCookie);
}

export function attachRenderResponse(response: ServerResponse) {
  const store = storage.getStore();

  if (!store) {
    return;
  }

  store.response = response;
}
