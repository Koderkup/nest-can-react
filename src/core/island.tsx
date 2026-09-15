import React, { ComponentType } from 'react';
import { renderToString } from 'react-dom/server';
import { IslandRenderMode, registerIsland } from './context';
import {
  getClientRuntime,
  getIslandComponent,
  resolveIslandName,
} from './island-registry';

type IslandName = string | ComponentType<any>;

type IslandProps<C extends IslandName> = {
  mode?: IslandRenderMode;
  name: C;
  props?: C extends ComponentType<infer P> ? P : Record<string, unknown>;
  children?: React.ReactNode;
};

export function Island<C extends IslandName>({
  mode = 'mount',
  name,
  props,
  children,
}: IslandProps<C>) {
  const resolvedName = resolveIslandName(name);
  const serializedProps = serializeProps((props ?? {}) as object);
  const id = registerIsland(resolvedName, mode, serializedProps);

  if (mode === 'hydrate') {
    const Component =
      typeof name === 'string' ? getIslandComponent(resolvedName) : name;

    if (!Component) {
      throw new Error(`No island component registered for "${resolvedName}".`);
    }

    const Runtime = getClientRuntime();
    const island = <Component {...serializedProps} />;

    return (
      <div
        dangerouslySetInnerHTML={{
          __html: renderToString(
            Runtime ? <Runtime>{island}</Runtime> : island,
          ),
        }}
        id={id}
      />
    );
  }

  return <div id={id}>{children}</div>;
}

function serializeProps(value: object) {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}
