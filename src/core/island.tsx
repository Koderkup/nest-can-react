import React from 'react';
import { renderToString } from 'react-dom/server';
import { IslandRenderMode, registerIsland } from './context';
import { getIslandComponent } from './island-registry';

type IslandProps = {
  mode?: IslandRenderMode;
  name: string;
  props?: Record<string, unknown>;
  children?: React.ReactNode;
};

export function Island({
  mode = 'mount',
  name,
  props = {},
  children,
}: IslandProps) {
  const serializedProps = serializeProps(props);
  const id = registerIsland(name, mode, serializedProps);

  if (mode === 'hydrate') {
    const Component = getIslandComponent(name);

    if (!Component) {
      throw new Error(`No island component registered for "${name}".`);
    }

    return (
      <div
        dangerouslySetInnerHTML={{
          __html: renderToString(<Component {...serializedProps} />),
        }}
        id={id}
      />
    );
  }

  return <div id={id}>{children}</div>;
}

function serializeProps(value: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}
