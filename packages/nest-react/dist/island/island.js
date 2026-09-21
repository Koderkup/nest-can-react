"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Island = Island;
const jsx_runtime_1 = require("react/jsx-runtime");
const server_1 = require("react-dom/server");
const context_1 = require("../data/context");
const island_registry_1 = require("./island-registry");
function Island({ mode = 'mount', name, props, children, }) {
    const resolvedName = (0, island_registry_1.resolveIslandName)(name);
    const serializedProps = serializeProps((props ?? {}));
    const id = (0, context_1.registerIsland)(resolvedName, mode, serializedProps);
    if (mode === 'hydrate') {
        const Component = typeof name === 'string' ? (0, island_registry_1.getIslandComponent)(resolvedName) : name;
        if (!Component) {
            throw new Error(`No island component registered for "${resolvedName}".`);
        }
        const Runtime = (0, island_registry_1.getClientRuntime)();
        const island = (0, jsx_runtime_1.jsx)(Component, { ...serializedProps });
        return ((0, jsx_runtime_1.jsx)("div", { dangerouslySetInnerHTML: {
                __html: (0, server_1.renderToString)(Runtime ? (0, jsx_runtime_1.jsx)(Runtime, { children: island }) : island),
            }, id: id }));
    }
    return (0, jsx_runtime_1.jsx)("div", { id: id, children: children });
}
function serializeProps(value) {
    return JSON.parse(JSON.stringify(value));
}
//# sourceMappingURL=island.js.map