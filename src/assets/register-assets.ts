import { existsSync, readFileSync } from 'node:fs';
import Module from 'node:module';
import { basename, dirname, extname, join } from 'node:path';

const cssExtensions = new Set(['.css']);
const fileExtensions = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.svg',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
]);

type NodeModuleWithLoaders = typeof Module & {
  _load(request: string, parent: NodeJS.Module | undefined, isMain: boolean): unknown;
  _extensions: Record<
    string,
    (module: { _compile(content: string, filename: string): void }, filename: string) => void
  >;
};

const registered = Symbol.for('nest-react.asset-loaders');

function registerAssetLoaders() {
  const globalState = globalThis as typeof globalThis & {
    [registered]?: boolean;
  };

  if (globalState[registered]) {
    return;
  }

  const nodeModule = getNodeModule();

  if (!nodeModule?._load) {
    return;
  }

  const originalLoad = nodeModule._load.bind(nodeModule);

  nodeModule._load = function loadAssetOrModule(
    request: string,
    parent: NodeJS.Module | undefined,
    isMain: boolean,
  ) {
    if (!isLocalAssetRequest(request)) {
      return originalLoad(request, parent, isMain);
    }

    const ext = extname(request).toLowerCase();

    if (cssExtensions.has(ext)) {
      return '';
    }

    const filename = parent?.filename
      ? join(dirname(parent.filename), request)
      : request;

    return lookupAssetUrl(filename, loadAssetUrls());
  };

  globalState[registered] = true;
}

function getNodeModule(): NodeModuleWithLoaders | undefined {
  const candidates = [Module, (Module as { default?: unknown }).default];

  for (const candidate of candidates) {
    const withLoaders = candidate as NodeModuleWithLoaders | undefined;

    if (withLoaders && typeof withLoaders._load === 'function') {
      return withLoaders;
    }
  }

  return undefined;
}

function isLocalAssetRequest(request: string) {
  const ext = extname(request).toLowerCase();

  if (!cssExtensions.has(ext) && !fileExtensions.has(ext)) {
    return false;
  }

  return (
    request.startsWith('.') ||
    request.startsWith('/') ||
    /^[A-Za-z]:[\\/]/.test(request)
  );
}

function loadAssetUrls() {
  const path = join(process.cwd(), '.nest-can-react/generated/asset-urls.json');

  if (!existsSync(path)) {
    return {};
  }

  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, string>;
}

function lookupAssetUrl(filename: string, assetUrls: Record<string, string>) {
  const posix = filename.replace(/\\/g, '/');

  if (assetUrls[posix]) {
    return assetUrls[posix];
  }

  for (const [key, url] of Object.entries(assetUrls)) {
    if (
      posix.endsWith(`/${key}`) ||
      posix.endsWith(`/${key.replace(/^src\//, 'dist/')}`) ||
      posix.endsWith(`/dist/${key}`)
    ) {
      return url;
    }
  }

  const name = basename(filename);

  return assetUrls[name] ?? '';
}

registerAssetLoaders();
