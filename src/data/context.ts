import { AsyncLocalStorage } from 'node:async_hooks';
import type { ServerResponse } from 'node:http';

export type LayoutMeta = {
  title?: string;
  description?: string;
  [key: string]: unknown;
};

type Store = {
  layoutMeta: LayoutMeta;
  statusCode?: number;
  response?: ServerResponse;
};

const storage = new AsyncLocalStorage<Store>();

export function runWithLayoutMeta<T>(callback: () => T): T {
  return storage.run({ layoutMeta: {} }, callback);
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

export function attachRenderResponse(response: ServerResponse) {
  const store = storage.getStore();

  if (!store) {
    return;
  }

  store.response = response;
}
