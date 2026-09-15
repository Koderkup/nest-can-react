import { ComponentType, ReactNode } from 'react';

type IslandRegistry = Record<string, ComponentType<any>>;
type ClientRuntimeComponent = ComponentType<{ children: ReactNode }>;

let serverIslandRegistry: IslandRegistry = {};
const islandNames = new WeakMap<ComponentType<any>, string>();
let clientRuntime: ClientRuntimeComponent | undefined;

export function registerIslandComponents(registry: IslandRegistry) {
  serverIslandRegistry = {
    ...serverIslandRegistry,
    ...registry,
  };

  for (const [name, component] of Object.entries(registry)) {
    islandNames.set(component, name);
  }
}

export function getIslandComponent(name: string) {
  return serverIslandRegistry[name];
}

export function resolveIslandName(name: string | ComponentType<any>) {
  const resolvedName =
    typeof name === 'string' ? name : getNameFromComponent(name);

  if (!resolvedName) {
    throw new Error(
      'Could not resolve island name from component. Export a named function from a *.island.tsx file.',
    );
  }

  if (!serverIslandRegistry[resolvedName]) {
    throw new Error(`No island component registered for "${resolvedName}".`);
  }

  return resolvedName;
}

export function registerClientRuntime(Runtime: ClientRuntimeComponent) {
  clientRuntime = Runtime;
}

export function getClientRuntime() {
  return clientRuntime;
}

function getNameFromComponent(component: ComponentType<any>) {
  const registeredName = islandNames.get(component);

  if (registeredName) {
    return registeredName;
  }

  const withDisplayName = component as ComponentType<any> & {
    displayName?: string;
  };

  return withDisplayName.displayName || component.name || undefined;
}
