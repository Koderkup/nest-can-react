import React from 'react';
import { ComponentType } from 'react';
import { createRoot, hydrateRoot, Root } from 'react-dom/client';
import { getManifest } from './runtime';

export type IslandComponentLoader = () => Promise<ComponentType<any>>;
export type IslandClientRegistry = Record<string, IslandComponentLoader>;

const mountedRoots = new Map<string, Root>();
const componentCache = new Map<string, Promise<ComponentType<any>>>();
let mountGeneration = 0;

export async function mountIslands(registry: IslandClientRegistry) {
  const manifest = getManifest();
  const generation = ++mountGeneration;

  await Promise.all(
    manifest.islands.map(async (island) => {
      const rootElement = document.getElementById(island.id);
      const loadComponent = registry[island.name];

      if (!rootElement || !loadComponent || mountedRoots.has(island.id)) {
        return;
      }

      try {
        const Component = await getComponent(island.name, loadComponent);

        if (generation !== mountGeneration || mountedRoots.has(island.id)) {
          return;
        }

        const root =
          island.mode === 'hydrate'
            ? hydrateRoot(rootElement, <Component {...island.props} />)
            : createMountRoot(rootElement, Component, island.props);

        mountedRoots.set(island.id, root);
      } catch (error) {
        console.error(`Failed to load island "${island.name}".`, error);
      }
    }),
  );
}

export function unmountIslands() {
  mountGeneration++;
  mountedRoots.forEach((root) => root.unmount());
  mountedRoots.clear();
}

function getComponent(name: string, loadComponent: IslandComponentLoader) {
  const cachedComponent = componentCache.get(name);

  if (cachedComponent) {
    return cachedComponent;
  }

  const component = loadComponent();
  componentCache.set(name, component);
  return component;
}

function createMountRoot(
  rootElement: HTMLElement,
  Component: ComponentType<any>,
  props: Record<string, unknown>,
) {
  const root = createRoot(rootElement);
  root.render(<Component {...props} />);
  return root;
}
