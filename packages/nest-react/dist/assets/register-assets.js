"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_module_1 = __importDefault(require("node:module"));
const node_path_1 = require("node:path");
const cssExtensions = new Set(['.css']);
const fileExtensions = new Set([
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.avif',
    '.svg',
    '.ico',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
]);
const registered = Symbol.for('nest-react.asset-loaders');
function registerAssetLoaders() {
    const globalState = globalThis;
    if (globalState[registered]) {
        return;
    }
    const nodeModule = getNodeModule();
    if (!nodeModule?._load) {
        return;
    }
    const originalLoad = nodeModule._load.bind(nodeModule);
    nodeModule._load = function loadAssetOrModule(request, parent, isMain) {
        if (!isLocalAssetRequest(request)) {
            return originalLoad(request, parent, isMain);
        }
        const ext = (0, node_path_1.extname)(request).toLowerCase();
        if (cssExtensions.has(ext)) {
            return '';
        }
        const filename = parent?.filename
            ? (0, node_path_1.join)((0, node_path_1.dirname)(parent.filename), request)
            : request;
        return lookupAssetUrl(filename, loadAssetUrls());
    };
    globalState[registered] = true;
}
function getNodeModule() {
    const candidates = [node_module_1.default, node_module_1.default.default];
    for (const candidate of candidates) {
        const withLoaders = candidate;
        if (withLoaders && typeof withLoaders._load === 'function') {
            return withLoaders;
        }
    }
    return undefined;
}
function isLocalAssetRequest(request) {
    const ext = (0, node_path_1.extname)(request).toLowerCase();
    if (!cssExtensions.has(ext) && !fileExtensions.has(ext)) {
        return false;
    }
    return (request.startsWith('.') ||
        request.startsWith('/') ||
        /^[A-Za-z]:[\\/]/.test(request));
}
function loadAssetUrls() {
    const path = (0, node_path_1.join)(process.cwd(), '.nest-react/generated/asset-urls.json');
    if (!(0, node_fs_1.existsSync)(path)) {
        return {};
    }
    return JSON.parse((0, node_fs_1.readFileSync)(path, 'utf8'));
}
function lookupAssetUrl(filename, assetUrls) {
    const posix = filename.replace(/\\/g, '/');
    if (assetUrls[posix]) {
        return assetUrls[posix];
    }
    for (const [key, url] of Object.entries(assetUrls)) {
        if (posix.endsWith(`/${key}`) ||
            posix.endsWith(`/${key.replace(/^src\//, 'dist/')}`) ||
            posix.endsWith(`/dist/${key}`)) {
            return url;
        }
    }
    const name = (0, node_path_1.basename)(filename);
    return assetUrls[name] ?? '';
}
registerAssetLoaders();
//# sourceMappingURL=register-assets.js.map