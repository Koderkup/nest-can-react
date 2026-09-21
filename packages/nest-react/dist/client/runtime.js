"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getManifest = getManifest;
exports.reloadManifest = reloadManifest;
exports.subscribe = subscribe;
exports.getVersion = getVersion;
let manifest = createEmptyManifest();
let version = 0;
let initialized = false;
const listeners = new Set();
function getManifest() {
    ensureRuntime();
    return manifest;
}
function reloadManifest() {
    if (!canUseDOM()) {
        return;
    }
    manifest = readManifest();
    initialized = true;
    notify();
}
function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
function getVersion() {
    return version;
}
function notify() {
    version++;
    listeners.forEach((listener) => listener());
}
function ensureRuntime() {
    if (initialized || !canUseDOM()) {
        return;
    }
    manifest = readManifest();
    initialized = true;
}
function canUseDOM() {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
}
function createEmptyManifest() {
    return {
        islands: [],
    };
}
function readManifest() {
    if (!canUseDOM()) {
        return createEmptyManifest();
    }
    const script = document.getElementById('nr-manifest');
    if (!script?.textContent) {
        return createEmptyManifest();
    }
    const parsed = JSON.parse(script.textContent);
    return {
        islands: parsed.islands ?? [],
    };
}
//# sourceMappingURL=runtime.js.map