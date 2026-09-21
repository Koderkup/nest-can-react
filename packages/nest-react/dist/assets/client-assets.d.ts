export type NestReactOptions = {
    assetManifestPath?: string;
    publicPath?: string;
};
export type ClientAssetsManifest = {
    version: number;
    codeSplitting: boolean;
    publicPath: string;
    runtime: string;
    css?: string[];
    chunks: string[];
    islands: Record<string, string[]>;
    islandCss?: Record<string, string[]>;
};
export declare function configureNestReact(optionsOverride?: NestReactOptions): void;
export declare function getClientAssetManifest(): ClientAssetsManifest;
export declare function getIslandAssetHints(islandNames: string[]): string[];
export declare function getStylesheetHrefs(islandNames: string[]): string[];
export declare function getGlobalStylesheetHrefs(): string[];
