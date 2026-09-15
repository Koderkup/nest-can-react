import "./client-styles.js";
import { installClientRuntime } from "../../src/core/client/mount.js";
import { installNavigation } from "../../src/core/client/navigation.js";
import { reloadManifest } from "../../src/core/client/runtime.js";
import { registry } from "./client-registry.js";
import { ClientRuntime } from "./client-runtime.js";

function bootPage() {
  reloadManifest();
}

async function boot() {
  reloadManifest();
  await installClientRuntime(registry, ClientRuntime);
  installNavigation({
    onPageChanged: bootPage,
  });
}

void boot();
