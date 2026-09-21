"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureNestReact = configureNestReact;
exports.getClientAssetManifest = getClientAssetManifest;
exports.getIslandAssetHints = getIslandAssetHints;
exports.getStylesheetHrefs = getStylesheetHrefs;
exports.getGlobalStylesheetHrefs = getGlobalStylesheetHrefs;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const defaultOptions = {
    assetManifestPath: 'public/nest-react/manifest.json',
    publicPath: '/assets/nest-react',
};
let options = defaultOptions;
function configureNestReact(optionsOverride = {}) {
    options = {
        ...options,
        ...optionsOverride,
    };
}
function getClientAssetManifest() {
    const manifestPath = resolveFromCwd(options.assetManifestPath);
    if (!(0, node_fs_1.existsSync)(manifestPath)) {
        return createFallbackManifest();
    }
    return JSON.parse((0, node_fs_1.readFileSync)(manifestPath, 'utf8'));
}
function getIslandAssetHints(islandNames) {
    const manifest = getClientAssetManifest();
    const assets = islandNames.flatMap((name) => manifest.islands[name] ?? []);
    return [...new Set(assets)];
}
function getStylesheetHrefs(islandNames) {
    const manifest = getClientAssetManifest();
    const assets = [
        ...(manifest.css ?? []),
        ...islandNames.flatMap((name) => manifest.islandCss?.[name] ?? []),
    ];
    return [...new Set(assets)];
}
function getGlobalStylesheetHrefs() {
    return [...new Set(getClientAssetManifest().css ?? [])];
}
function createFallbackManifest() {
    return {
        version: 1,
        codeSplitting: false,
        publicPath: options.publicPath,
        runtime: `${options.publicPath}/client.js`,
        css: [],
        chunks: [],
        islands: {},
        islandCss: {},
    };
}
function resolveFromCwd(path) {
    return (0, node_path_1.isAbsolute)(path) ? path : (0, node_path_1.join)(process.cwd(), path);
}
//# sourceMappingURL=client-assets.js.map