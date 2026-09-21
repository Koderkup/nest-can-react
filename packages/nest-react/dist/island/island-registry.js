"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerIslandComponents = registerIslandComponents;
exports.getIslandComponent = getIslandComponent;
exports.resolveIslandName = resolveIslandName;
exports.registerClientRuntime = registerClientRuntime;
exports.getClientRuntime = getClientRuntime;
let serverIslandRegistry = {};
const islandNames = new WeakMap();
let clientRuntime;
function registerIslandComponents(registry) {
    serverIslandRegistry = {
        ...serverIslandRegistry,
        ...registry,
    };
    for (const [name, component] of Object.entries(registry)) {
        islandNames.set(component, name);
    }
}
function getIslandComponent(name) {
    return serverIslandRegistry[name];
}
function resolveIslandName(name) {
    const resolvedName = typeof name === 'string' ? name : getNameFromComponent(name);
    if (!resolvedName) {
        throw new Error('Could not resolve island name from component. Export a named function from a *.island.tsx file.');
    }
    if (!serverIslandRegistry[resolvedName]) {
        throw new Error(`No island component registered for "${resolvedName}".`);
    }
    return resolvedName;
}
function registerClientRuntime(Runtime) {
    clientRuntime = Runtime;
}
function getClientRuntime() {
    return clientRuntime;
}
function getNameFromComponent(component) {
    const registeredName = islandNames.get(component);
    if (registeredName) {
        return registeredName;
    }
    const withDisplayName = component;
    return withDisplayName.displayName || component.name || undefined;
}
//# sourceMappingURL=island-registry.js.map