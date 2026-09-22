import { AsyncLocalStorage } from 'node:async_hooks';

export type LayoutMeta = {
  title?: string;
  description?: string;
  [key: string]: unknown;
};

type Store = {
  layoutMeta: LayoutMeta;
};

const storage = new AsyncLocalStorage<Store>();

export function runWithLayoutMeta<T>(callback: () => T): T {
  return storage.run({ layoutMeta: {} }, callback);
}

export function setLayoutMeta(meta: LayoutMeta) {
  const store = storage.getStore();

  if (!store) {
    throw new Error(
      'setLayoutMeta() must run during renderPage (Server Component render).',
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
