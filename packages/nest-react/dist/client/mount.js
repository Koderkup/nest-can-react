"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installClientRuntime = installClientRuntime;
exports.unmountHydrateIslands = unmountHydrateIslands;
exports.replaceIslandComponent = replaceIslandComponent;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_dom_1 = require("react-dom");
const client_1 = require("react-dom/client");
const runtime_1 = require("./runtime");
const componentCache = new Map();
const loadedComponents = new Map();
const hydrateRoots = new Map();
let runtimeRoot;
let didInitialHydrate = false;
async function installClientRuntime(registry, Runtime) {
    const host = document.getElementById('nr-runtime');
    if (!host) {
        throw new Error('Missing #nr-runtime host for the Nest React client runtime.');
    }
    await preloadIslands(registry);
    const tree = ((0, jsx_runtime_1.jsx)(Runtime, { children: (0, jsx_runtime_1.jsx)(IslandOutlet, { Runtime: Runtime, registry: registry }) }));
    if (!runtimeRoot) {
        runtimeRoot = (0, client_1.createRoot)(host);
    }
    runtimeRoot.render(tree);
}
function unmountHydrateIslands() {
    hydrateRoots.forEach((entry) => {
        entry.root.unmount();
    });
    hydrateRoots.clear();
}
function replaceIslandComponent(name, component) {
    loadedComponents.set(name, component);
    componentCache.set(name, Promise.resolve(component));
}
function IslandOutlet({ Runtime, registry, }) {
    const version = (0, react_1.useSyncExternalStore)(runtime_1.subscribe, runtime_1.getVersion, runtime_1.getVersion);
    const manifest = (0, runtime_1.getManifest)();
    const [loaded, setLoaded] = (0, react_1.useState)(0);
    (0, react_1.useEffect)(() => {
        let cancelled = false;
        void Promise.all(manifest.islands.map(async (island) => {
            const loadComponent = registry[island.name];
            if (!loadComponent) {
                return;
            }
            await getComponent(island.name, loadComponent);
        })).then(() => {
            if (!cancelled) {
                setLoaded((value) => value + 1);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [manifest, registry, version]);
    (0, react_1.useLayoutEffect)(() => {
        syncHydrateIslands(Runtime, manifest.islands);
    }, [Runtime, manifest, version, loaded]);
    return ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: manifest.islands.map((island) => {
            if (island.mode === 'hydrate') {
                return null;
            }
            const rootElement = document.getElementById(island.id);
            const Component = loadedComponents.get(island.name);
            if (!rootElement || !Component) {
                return null;
            }
            return (0, react_dom_1.createPortal)((0, jsx_runtime_1.jsx)(Component, { ...island.props }), rootElement, island.id);
        }) }));
}
function syncHydrateIslands(Runtime, islands) {
    const activeIds = new Set();
    islands.forEach((island) => {
        if (island.mode !== 'hydrate') {
            return;
        }
        const element = document.getElementById(island.id);
        const Component = loadedComponents.get(island.name);
        if (!element || !Component) {
            return;
        }
        activeIds.add(island.id);
        const tree = ((0, jsx_runtime_1.jsx)(Runtime, { children: (0, jsx_runtime_1.jsx)(Component, { ...island.props }) }));
        const current = hydrateRoots.get(island.id);
        if (current && current.element === element) {
            current.root.render(tree);
            return;
        }
        current?.root.unmount();
        const root = didInitialHydrate
            ? (0, client_1.createRoot)(element)
            : (0, client_1.hydrateRoot)(element, tree);
        if (didInitialHydrate) {
            root.render(tree);
        }
        hydrateRoots.set(island.id, {
            element,
            root,
        });
    });
    hydrateRoots.forEach((entry, id) => {
        if (activeIds.has(id)) {
            return;
        }
        entry.root.unmount();
        hydrateRoots.delete(id);
    });
    didInitialHydrate = true;
}
async function preloadIslands(registry) {
    const manifest = (0, runtime_1.getManifest)();
    await Promise.all(manifest.islands.map((island) => {
        const loadComponent = registry[island.name];
        if (!loadComponent) {
            return;
        }
        return getComponent(island.name, loadComponent);
    }));
}
function getComponent(name, loadComponent) {
    const cachedComponent = componentCache.get(name);
    if (cachedComponent) {
        return cachedComponent;
    }
    const component = loadComponent().then((loaded) => {
        loadedComponents.set(name, loaded);
        return loaded;
    });
    componentCache.set(name, component);
    return component;
}
//# sourceMappingURL=mount.js.map