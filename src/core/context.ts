import { AsyncLocalStorage } from 'node:async_hooks';
import { ModuleRef } from '@nestjs/core';

type FrontendContext = {
  moduleRef: ModuleRef;
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
  loadResults: Map<string, unknown>;
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
let rootModuleRef: ModuleRef | undefined;

export function initializeFrontendDI(ref: ModuleRef) {
  rootModuleRef = ref;
}

export function getFrontendModuleRef() {
  const moduleRef = storage.getStore()?.moduleRef ?? rootModuleRef;

  if (!moduleRef) {
    throw new Error('Frontend DI has not been initialized.');
  }

  return moduleRef;
}

export function runWithFrontendContext<T>(
  moduleRef: ModuleRef,
  renderState: FrontendRenderState | undefined,
  callback: () => T,
) {
  return storage.run({ moduleRef, renderState }, callback);
}

export function createRenderState(): FrontendRenderState {
  return {
    loadResults: new Map<string, unknown>(),
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

export function recordLoadResult(key: string, value: unknown) {
  storage.getStore()?.renderState?.loadResults.set(key, value);
}

export function getLoadResults() {
  return storage.getStore()?.renderState?.loadResults;
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
