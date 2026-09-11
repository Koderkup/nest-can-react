import { installClientRuntime } from '../../core/client/mount';
import { installNavigation } from '../../core/client/navigation';
import { reloadManifest } from '../../core/client/runtime';
import { registry } from '../../../.nest-react/generated/client-registry.js';
import { ClientRuntime } from '../../../.nest-react/generated/client-runtime.js';

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
