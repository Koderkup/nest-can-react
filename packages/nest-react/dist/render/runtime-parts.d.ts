import type { FrontendRenderState } from '../data/context';
export type RuntimeParts = {
    stylesheets: string;
    islandStylesheets: string;
    documentAssets: string;
    moduleScript: string;
};
export declare function createRuntimeParts(manifest: Record<string, unknown>): RuntimeParts;
export declare function createStylesheetTags(hrefs: string[]): string;
export declare function createManifest(mode: 'static' | 'hydrated' | 'streaming', renderState: FrontendRenderState): {
    mode: "static" | "hydrated" | "streaming";
    islands: import("../data/context").IslandManifestEntry[];
};
