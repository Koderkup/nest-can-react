"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLayout = registerLayout;
exports.getLayout = getLayout;
let layout;
function registerLayout(Layout) {
    layout = Layout;
}
function getLayout() {
    return layout;
}
//# sourceMappingURL=layout-registry.js.map