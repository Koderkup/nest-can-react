import { AsyncLocalStorage } from 'node:async_hooks';
import { ModuleRef } from '@nestjs/core';

type FrontendContext = {
  moduleRef: ModuleRef;
  loadResults?: Map<string, unknown>;
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
  loadResults: Map<string, unknown> | undefined,
  callback: () => T,
) {
  return storage.run({ moduleRef, loadResults }, callback);
}

export function recordLoadResult(key: string, value: unknown) {
  storage.getStore()?.loadResults?.set(key, value);
}

export function getLoadResults() {
  return storage.getStore()?.loadResults;
}
