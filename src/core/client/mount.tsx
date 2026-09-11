import React from 'react';
import { ComponentType } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { getManifest } from './runtime';

const mountedRoots = new Map<string, Root>();

export function mountIslands(registry: Record<string, ComponentType<any>>) {
  const manifest = getManifest();

  manifest.islands.forEach((island) => {
    const rootElement = document.getElementById(island.id);
    const Component = registry[island.name];

    if (!rootElement || !Component || mountedRoots.has(island.id)) {
      return;
    }

    const root = createRoot(rootElement);
    root.render(<Component {...island.props} />);
    mountedRoots.set(island.id, root);
  });
}

export function unmountIslands() {
  mountedRoots.forEach((root) => root.unmount());
  mountedRoots.clear();
}
