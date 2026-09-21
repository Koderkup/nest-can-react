"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRuntimeParts = createRuntimeParts;
exports.createStylesheetTags = createStylesheetTags;
exports.createManifest = createManifest;
const client_assets_1 = require("../assets/client-assets");
function createRuntimeParts(manifest) {
    const clientAssets = (0, client_assets_1.getClientAssetManifest)();
    const islandNames = getManifestIslandNames(manifest);
    const preloadAssets = [
        clientAssets.runtime,
        ...(0, client_assets_1.getIslandAssetHints)(islandNames),
    ];
    return {
        stylesheets: createStylesheetTags((0, client_assets_1.getStylesheetHrefs)(islandNames)),
        islandStylesheets: createStylesheetTags((0, client_assets_1.getStylesheetHrefs)(islandNames).filter((href) => !(0, client_assets_1.getGlobalStylesheetHrefs)().includes(href))),
        documentAssets: [
            ...preloadAssets.map((asset) => `<link rel="modulepreload" href="${escapeHtmlAttribute(asset)}">`),
            `<script id="nr-manifest" type="application/json">${serializeJson(manifest)}</script>`,
        ].join(''),
        moduleScript: `<script type="module" src="${escapeHtmlAttribute(clientAssets.runtime)}"></script>`,
    };
}
function createStylesheetTags(hrefs) {
    return hrefs
        .map((href) => `<link rel="stylesheet" data-nr-style="1" href="${escapeHtmlAttribute(href)}">`)
        .join('');
}
function createManifest(mode, renderState) {
    return {
        mode,
        islands: renderState.islands,
    };
}
function serializeJson(value) {
    return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (char) => {
        const escaped = {
            '<': '\\u003c',
            '>': '\\u003e',
            '&': '\\u0026',
            '\u2028': '\\u2028',
            '\u2029': '\\u2029',
        };
        return escaped[char];
    });
}
function getManifestIslandNames(manifest) {
    const islands = manifest.islands;
    if (!Array.isArray(islands)) {
        return [];
    }
    return [
        ...new Set(islands
            .map((island) => typeof island === 'object' && island !== null && 'name' in island
            ? island.name
            : undefined)
            .filter((name) => typeof name === 'string')),
    ];
}
function escapeHtmlAttribute(value) {
    return value.replace(/[&"]/g, (char) => {
        const escaped = {
            '&': '&amp;',
            '"': '&quot;',
        };
        return escaped[char];
    });
}
//# sourceMappingURL=runtime-parts.js.map