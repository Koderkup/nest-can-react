import { ComponentType, ReactNode } from 'react';

type LayoutComponent = ComponentType<{ children: ReactNode }>;

let layout: LayoutComponent | undefined;

export function registerLayout(Layout: LayoutComponent) {
  layout = Layout;
}

export function getLayout() {
  return layout;
}
