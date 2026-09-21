type IslandManifestEntry = {
    id: string;
    name: string;
    mode: 'mount' | 'hydrate';
    props: Record<string, unknown>;
};
type PageManifest = {
    islands: IslandManifestEntry[];
};
export declare function getManifest(): PageManifest;
export declare function reloadManifest(): void;
export declare function subscribe(listener: () => void): () => boolean;
export declare function getVersion(): number;
export {};
