import './register-assets';

export {
  configureNestReact,
  getClientAssetManifest,
  getGlobalStylesheetHrefs,
  getIslandAssetHints,
  getStylesheetHrefs,
} from './client-assets';
export type { ClientAssetsManifest, NestReactOptions } from './client-assets';
export { commit, revalidate } from './commit';
export { initializeFrontendDI, inject } from './inject';
export { Island } from './island';
export {
  registerClientRuntime,
  registerIslandComponents,
} from './island-registry';
export { getLayout, registerLayout } from './layout-registry';
export { listLoadKeys, load, refreshLoad } from './load';
export { NestReactModule } from './nest-react.module';
export { renderPage } from './renderer';
export { NestLink } from './link';
export { getLayoutMeta, setLayoutMeta, useLayoutMeta } from './context';
export type { LayoutMeta } from './context';
