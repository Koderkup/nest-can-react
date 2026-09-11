import type { IslandClientRegistry } from "../../src/core/client/mount.js";

export const registry = {
  "DashboardControls": () => import("../../src/demo/islands/DashboardControls.island.js").then((module) => module.DashboardControls),
  "GreetingEditor": () => import("../../src/demo/islands/GreetingEditor.island.js").then((module) => module.GreetingEditor),
  "UserCreator": () => import("../../src/demo/islands/UserCreator.island.js").then((module) => module.UserCreator),
} satisfies IslandClientRegistry;
