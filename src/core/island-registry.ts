import { ComponentType, ReactNode } from 'react';

type IslandRegistry = Record<string, ComponentType<any>>;
type ClientRuntimeComponent = ComponentType<{ children: ReactNode }>;

let serverIslandRegistry: IslandRegistry = {};
let clientRuntime: ClientRuntimeComponent | undefined;

export function registerIslandComponents(registry: IslandRegistry) {
  serverIslandRegistry = {
    ...serverIslandRegistry,
    ...registry,
  };
}

export function getIslandComponent(name: string) {
  return serverIslandRegistry[name];
}

export function registerClientRuntime(Runtime: ClientRuntimeComponent) {
  clientRuntime = Runtime;
}

export function getClientRuntime() {
  return clientRuntime;
}
