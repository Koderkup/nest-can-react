import { ModuleRef } from '@nestjs/core';
import { recordLoadResult, runWithFrontendContext } from './context';

export type LoadHandler<T> = () => T | Promise<T>;

export type LoadDefinition<T> = {
  key: string;
  (): Promise<T>;
};

const loadRegistry = new Map<string, LoadDefinition<unknown>>();

export function load<T>(
  key: string,
  handler: LoadHandler<T>,
): LoadDefinition<T> {
  const loadDefinition = async () => {
    const value = await handler();
    recordLoadResult(key, value);
    return value;
  };

  const namedLoad = Object.assign(loadDefinition, { key });
  loadRegistry.set(key, namedLoad as LoadDefinition<unknown>);

  return namedLoad;
}

export async function refreshLoad(key: string, moduleRef: ModuleRef) {
  const loadDefinition = loadRegistry.get(key);

  if (!loadDefinition) {
    throw new Error(`No load() registered for key "${key}".`);
  }

  const data = await runWithFrontendContext(moduleRef, undefined, () =>
    loadDefinition(),
  );

  return { key, data };
}

export function listLoadKeys() {
  return [...loadRegistry.keys()];
}
