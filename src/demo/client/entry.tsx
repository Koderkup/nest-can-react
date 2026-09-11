import React from 'react';
import { createRoot } from 'react-dom/client';
import { getManifest } from '../../core/client/runtime';
import { registry } from './registry';

const manifest = getManifest();

manifest.islands.forEach((island) => {
  const rootElement = document.getElementById(island.id);
  const Component = registry[island.name];

  if (!rootElement || !Component) {
    return;
  }

  createRoot(rootElement).render(<Component {...island.props} />);
});
