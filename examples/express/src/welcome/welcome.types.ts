export type ArchitectureNodeKind =
  | 'module'
  | 'controller'
  | 'service'
  | 'page'
  | 'client';

export type ArchitectureNode = {
  id: string;
  kind: ArchitectureNodeKind;
  label: string;
  x: number;
  y: number;
  detail: string;
};

export type ArchitectureEdge = {
  from: string;
  to: string;
};

export type WelcomePageData = {
  tagline: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
};
