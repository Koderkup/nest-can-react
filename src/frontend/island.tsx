import React from 'react';

type IslandProps = {
  name: string;
  props?: Record<string, unknown>;
  children?: React.ReactNode;
};

export function Island({ name, props = {}, children }: IslandProps) {
  return (
    <div
      data-nest-react-island={name}
      data-nest-react-props={JSON.stringify(props)}
    >
      {children}
    </div>
  );
}
