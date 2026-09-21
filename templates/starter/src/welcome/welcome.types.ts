export type ArchitectureKind =
  'module' | 'controller' | 'service' | 'page' | 'island';

export type ArchitectureNode = {
  detail: string;
  id: string;
  kind: ArchitectureKind;
  label: string;
  x: number;
  y: number;
};

export type ArchitectureEdge = {
  from: string;
  to: string;
};

export type WelcomePageData = {
  edges: ArchitectureEdge[];
  nodes: ArchitectureNode[];
  tagline: string;
};
