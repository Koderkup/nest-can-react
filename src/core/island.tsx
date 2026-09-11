import React from 'react';
import { registerIsland } from './context';

type IslandProps = {
  name: string;
  props?: Record<string, unknown>;
  children?: React.ReactNode;
};

export function Island({ name, props = {}, children }: IslandProps) {
  const id = registerIsland(name, serializeProps(props));

  return <div id={id}>{children}</div>;
}

function serializeProps(value: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}
