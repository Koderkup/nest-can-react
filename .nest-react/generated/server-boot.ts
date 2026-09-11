import { registerClientRuntime, registerIslandComponents } from "../../src/core/island-registry.js";
import { registerLayout } from "../../src/core/layout-registry.js";
import { ClientRuntime } from "./client-runtime.js";
import { registry } from "./server-registry.js";
import Layout from "./server-layout.js";

registerIslandComponents(registry);
registerClientRuntime(ClientRuntime);
registerLayout(Layout);
