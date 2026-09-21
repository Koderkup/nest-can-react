"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLayout = exports.registerIslandComponents = exports.registerClientRuntime = void 0;
var island_registry_1 = require("./island/island-registry");
Object.defineProperty(exports, "registerClientRuntime", { enumerable: true, get: function () { return island_registry_1.registerClientRuntime; } });
Object.defineProperty(exports, "registerIslandComponents", { enumerable: true, get: function () { return island_registry_1.registerIslandComponents; } });
var layout_registry_1 = require("./render/layout-registry");
Object.defineProperty(exports, "registerLayout", { enumerable: true, get: function () { return layout_registry_1.registerLayout; } });
//# sourceMappingURL=register.js.map