import React, {
  ComponentType,
  ReactNode,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { createRoot, Root } from 'react-dom/client';
import { getManifest, getVersion, subscribe } from './runtime';

export type IslandComponentLoader = () => Promise<ComponentType<any>>;
export type IslandClientRegistry = Record<string, IslandComponentLoader>;

type ClientRuntimeComponent = ComponentType<{ children: ReactNode }>;

const componentCache = new Map<string, Promise<ComponentType<any>>>();
const loadedComponents = new Map<string, ComponentType<any>>();
let runtimeRoot: Root | undefined;

export function installClientRuntime(
  registry: IslandClientRegistry,
  Runtime: ClientRuntimeComponent,
) {
  const host = document.getElementById('nr-runtime');

  if (!host) {
    throw new Error(
      'Missing #nr-runtime host for the Nest React client runtime.',
    );
  }

  runtimeRoot ??= createRoot(host);
  runtimeRoot.render(
    <Runtime>
      <IslandOutlet registry={registry} />
    </Runtime>,
  );
}

function IslandOutlet({ registry }: { registry: IslandClientRegistry }) {
  const version = useSyncExternalStore(subscribe, getVersion, getVersion);
  const manifest = getManifest();
  const [, setLoaded] = useState(0);

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

  return (
    <>
      {manifest.islands.map((island) => {
        const rootElement = document.getElementById(island.id);
        const Component = loadedComponents.get(island.name);

        if (!rootElement || !Component) {
          return null;
        }

        return createPortal(
          <Component {...island.props} />,
          rootElement,
          `${version}:${island.id}`,
        );
      })}
    </>
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
