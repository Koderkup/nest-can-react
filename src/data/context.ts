import { AsyncLocalStorage } from 'node:async_hooks';

type FrontendContext = {
  renderState?: FrontendRenderState;
};

export type IslandManifestEntry = {
  id: string;
  name: string;
  mode: IslandRenderMode;
  props: Record<string, unknown>;
};

export type IslandRenderMode = 'mount' | 'hydrate';

export type FrontendRenderState = {
  islands: IslandManifestEntry[];
  nextIslandId: number;
  layoutMeta: LayoutMeta;
};

export type LayoutMeta = {
  title?: string;
  eyebrow?: string;
  description?: string;
  active?: string;
  [key: string]: unknown;
};

const storage = new AsyncLocalStorage<FrontendContext>();

export function runWithFrontendContext<T>(
  renderState: FrontendRenderState | undefined,
  callback: () => T,
) {
  return storage.run({ renderState }, callback);
}

export function createRenderState(): FrontendRenderState {
  return {
    islands: [],
    nextIslandId: 0,
    layoutMeta: {},
  };
}

export function setLayoutMeta(meta: LayoutMeta) {
  const renderState = storage.getStore()?.renderState;

  if (!renderState) {
    throw new Error('Layout meta can only be set during a React render.');
  }

  renderState.layoutMeta = {
    ...renderState.layoutMeta,
    ...meta,
  };
}

export function getLayoutMeta() {
  return storage.getStore()?.renderState?.layoutMeta ?? {};
}

export function useLayoutMeta() {
  return getLayoutMeta();
}

export function registerIsland(
  name: string,
  mode: IslandRenderMode,
  props: Record<string, unknown>,
) {
  const renderState = storage.getStore()?.renderState;

  if (!renderState) {
    throw new Error('Islands can only be registered during a React render.');
  }

  const id = `nr-i${renderState.nextIslandId++}`;
  renderState.islands.push({ id, name, mode, props });

  return id;
}
