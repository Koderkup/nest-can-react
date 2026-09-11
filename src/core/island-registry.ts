import { ComponentType } from 'react';

type IslandRegistry = Record<string, ComponentType<any>>;

let serverIslandRegistry: IslandRegistry = {};

export function registerIslandComponents(registry: IslandRegistry) {
  serverIslandRegistry = {
    ...serverIslandRegistry,
    ...registry,
  };
}

export function getIslandComponent(name: string) {
  return serverIslandRegistry[name];
}
