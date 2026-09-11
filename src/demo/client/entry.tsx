import { mountIslands, unmountIslands } from '../../core/client/mount';
import { installNavigation } from '../../core/client/navigation';
import { reloadManifest } from '../../core/client/runtime';
import { registry } from './registry';

function bootPage() {
  reloadManifest();
  mountIslands(registry);
}

mountIslands(registry);

installNavigation({
  onBeforePageChange: unmountIslands,
  onPageChanged: bootPage,
});
