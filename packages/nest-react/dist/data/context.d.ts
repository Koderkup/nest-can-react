export type IslandManifestEntry = {
    id: string;
    name: string;
    mode: IslandRenderMode;
    props: Record<string, unknown>;
};
export type IslandRenderMode = 'mount' | 'hydrate';
export type FrontendRenderState = {
    islands: IslandManifestEntry[];
    nextIslandId: number;
    layoutMeta: LayoutMeta;
};
export type LayoutMeta = {
    title?: string;
    eyebrow?: string;
    description?: string;
    active?: string;
    [key: string]: unknown;
};
export declare function runWithFrontendContext<T>(renderState: FrontendRenderState | undefined, callback: () => T): T;
export declare function createRenderState(): FrontendRenderState;
export declare function setLayoutMeta(meta: LayoutMeta): void;
export declare function getLayoutMeta(): LayoutMeta;
export declare function useLayoutMeta(): LayoutMeta;
export declare function registerIsland(name: string, mode: IslandRenderMode, props: Record<string, unknown>): string;
