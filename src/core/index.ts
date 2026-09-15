import './assets/register-assets';

export {
  configureNestReact,
  getClientAssetManifest,
  getGlobalStylesheetHrefs,
  getIslandAssetHints,
  getStylesheetHrefs,
} from './assets/client-assets';
export type { ClientAssetsManifest, NestReactOptions } from './assets/client-assets';
export { commit, revalidate } from './data/commit';
export { initializeFrontendDI, inject } from './data/inject';
export { Island } from './island/island';
export {
  registerClientRuntime,
  registerIslandComponents,
} from './island/island-registry';
export { getLayout, registerLayout } from './render/layout-registry';
export { listLoadKeys, load, refreshLoad } from './data/load';
export { NestReactModule } from './nest/nest-react.module';
export { renderPage } from './render/renderer';
export { NestLink } from './render/link';
export { getLayoutMeta, setLayoutMeta, useLayoutMeta } from './data/context';
export type { LayoutMeta } from './data/context';
