import React, {
  ComponentType,
  ReactNode,
  useEffect,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { createRoot, hydrateRoot, Root } from 'react-dom/client';
import { getManifest, getVersion, subscribe } from './runtime';

export type IslandComponentLoader = () => Promise<ComponentType<any>>;
export type IslandClientRegistry = Record<string, IslandComponentLoader>;

type ClientRuntimeComponent = ComponentType<{ children: ReactNode }>;

type HydrateRootEntry = {
  element: Element;
  root: Root;
};

const componentCache = new Map<string, Promise<ComponentType<any>>>();
const loadedComponents = new Map<string, ComponentType<any>>();
const hydrateRoots = new Map<string, HydrateRootEntry>();
let runtimeRoot: Root | undefined;
let didInitialHydrate = false;

export async function installClientRuntime(
  registry: IslandClientRegistry,
  Runtime: ClientRuntimeComponent,
) {
  const host = document.getElementById('nr-runtime');

  if (!host) {
    throw new Error(
      'Missing #nr-runtime host for the Nest Can React client runtime.',
    );
  }

  await preloadIslands(registry);

  const tree = (
    <Runtime>
      <IslandOutlet Runtime={Runtime} registry={registry} />
    </Runtime>
  );

  if (!runtimeRoot) {
    runtimeRoot = createRoot(host);
  }

  runtimeRoot.render(tree);
}

export function unmountHydrateIslands() {
  hydrateRoots.forEach((entry) => {
    entry.root.unmount();
  });
  hydrateRoots.clear();
}

export function replaceIslandComponent(
  name: string,
  component: ComponentType<any>,
) {
  loadedComponents.set(name, component);
  componentCache.set(name, Promise.resolve(component));
}

function IslandOutlet({
  Runtime,
  registry,
}: {
  Runtime: ClientRuntimeComponent;
  registry: IslandClientRegistry;
}) {
  const version = useSyncExternalStore(subscribe, getVersion, getVersion);
  const manifest = getManifest();
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void Promise.all(
      manifest.islands.map(async (island) => {
        const loadComponent = registry[island.name];

        if (!loadComponent) {
          return;
        }

        await getComponent(island.name, loadComponent);
      }),
    ).then(() => {
      if (!cancelled) {
        setLoaded((value) => value + 1);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [manifest, registry, version]);

  useLayoutEffect(() => {
    syncHydrateIslands(Runtime, manifest.islands);
  }, [Runtime, manifest, version, loaded]);

  return (
    <>
      {manifest.islands.map((island) => {
        if (island.mode === 'hydrate') {
          return null;
        }

        const rootElement = document.getElementById(island.id);
        const Component = loadedComponents.get(island.name);

        if (!rootElement || !Component) {
          return null;
        }

        return createPortal(
          <Component {...island.props} />,
          rootElement,
          island.id,
        );
      })}
    </>
  );
}

function syncHydrateIslands(
  Runtime: ClientRuntimeComponent,
  islands: ReturnType<typeof getManifest>['islands'],
) {
  const activeIds = new Set<string>();

  islands.forEach((island) => {
    if (island.mode !== 'hydrate') {
      return;
    }

    const element = document.getElementById(island.id);
    const Component = loadedComponents.get(island.name);

    if (!element || !Component) {
      return;
    }

    activeIds.add(island.id);

    const tree = (
      <Runtime>
        <Component {...island.props} />
      </Runtime>
    );
    const current = hydrateRoots.get(island.id);

    if (current && current.element === element) {
      current.root.render(tree);
      return;
    }

    current?.root.unmount();

    const root = didInitialHydrate
      ? createRoot(element)
      : hydrateRoot(element, tree);

    if (didInitialHydrate) {
      root.render(tree);
    }

    hydrateRoots.set(island.id, {
      element,
      root,
    });
  });

  hydrateRoots.forEach((entry, id) => {
    if (activeIds.has(id)) {
      return;
    }

    entry.root.unmount();
    hydrateRoots.delete(id);
  });

  didInitialHydrate = true;
}

async function preloadIslands(registry: IslandClientRegistry) {
  const manifest = getManifest();

  await Promise.all(
    manifest.islands.map((island) => {
      const loadComponent = registry[island.name];

      if (!loadComponent) {
        return;
      }

      return getComponent(island.name, loadComponent);
    }),
  );
}

function getComponent(name: string, loadComponent: IslandComponentLoader) {
  const cachedComponent = componentCache.get(name);

  if (cachedComponent) {
    return cachedComponent;
  }

  const component = loadComponent().then((loaded) => {
    loadedComponents.set(name, loaded);
    return loaded;
  });
  componentCache.set(name, component);
  return component;
}
