"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.performReactRefresh = performReactRefresh;
const runtime_1 = __importDefault(require("react-refresh/runtime"));
runtime_1.default.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => undefined;
window.$RefreshSig$ = () => (type) => type;
window.$RefreshRuntime$ = runtime_1.default;
function performReactRefresh() {
    return runtime_1.default.performReactRefresh();
}
//# sourceMappingURL=refresh-runtime.js.map