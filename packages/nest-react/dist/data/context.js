"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWithFrontendContext = runWithFrontendContext;
exports.createRenderState = createRenderState;
exports.setLayoutMeta = setLayoutMeta;
exports.getLayoutMeta = getLayoutMeta;
exports.useLayoutMeta = useLayoutMeta;
exports.registerIsland = registerIsland;
const node_async_hooks_1 = require("node:async_hooks");
const storage = new node_async_hooks_1.AsyncLocalStorage();
function runWithFrontendContext(renderState, callback) {
    return storage.run({ renderState }, callback);
}
function createRenderState() {
    return {
        islands: [],
        nextIslandId: 0,
        layoutMeta: {},
    };
}
function setLayoutMeta(meta) {
    const renderState = storage.getStore()?.renderState;
    if (!renderState) {
        throw new Error('Layout meta can only be set during a React render.');
    }
    renderState.layoutMeta = {
        ...renderState.layoutMeta,
        ...meta,
    };
}
function getLayoutMeta() {
    return storage.getStore()?.renderState?.layoutMeta ?? {};
}
function useLayoutMeta() {
    return getLayoutMeta();
}
function registerIsland(name, mode, props) {
    const renderState = storage.getStore()?.renderState;
    if (!renderState) {
        throw new Error('Islands can only be registered during a React render.');
    }
    const id = `nr-i${renderState.nextIslandId++}`;
    renderState.islands.push({ id, name, mode, props });
    return id;
}
//# sourceMappingURL=context.js.map