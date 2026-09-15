import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

export type NestReactOptions = {
  assetManifestPath?: string;
  publicPath?: string;
};

export type ClientAssetsManifest = {
  version: number;
  codeSplitting: boolean;
  publicPath: string;
  runtime: string;
  css?: string[];
  chunks: string[];
  islands: Record<string, string[]>;
  islandCss?: Record<string, string[]>;
};

const defaultOptions: Required<NestReactOptions> = {
  assetManifestPath: 'public/nest-react/manifest.json',
  publicPath: '/assets/nest-react',
};

let options = defaultOptions;

export function configureNestReact(optionsOverride: NestReactOptions = {}) {
  options = {
    ...options,
    ...optionsOverride,
  };
}

export function getClientAssetManifest() {
  const manifestPath = resolveFromCwd(options.assetManifestPath);

  if (!existsSync(manifestPath)) {
    return createFallbackManifest();
  }

  return JSON.parse(readFileSync(manifestPath, 'utf8')) as ClientAssetsManifest;
}

export function getIslandAssetHints(islandNames: string[]) {
  const manifest = getClientAssetManifest();
  const assets = islandNames.flatMap((name) => manifest.islands[name] ?? []);

  return [...new Set(assets)];
}

export function getStylesheetHrefs(islandNames: string[]) {
  const manifest = getClientAssetManifest();
  const assets = [
    ...(manifest.css ?? []),
    ...islandNames.flatMap((name) => manifest.islandCss?.[name] ?? []),
  ];

  return [...new Set(assets)];
}

export function getGlobalStylesheetHrefs() {
  return [...new Set(getClientAssetManifest().css ?? [])];
}

function createFallbackManifest(): ClientAssetsManifest {
  return {
    version: 1,
    codeSplitting: false,
    publicPath: options.publicPath,
    runtime: `${options.publicPath}/client.js`,
    css: [],
    chunks: [],
    islands: {},
    islandCss: {},
  };
}

function resolveFromCwd(path: string) {
  return isAbsolute(path) ? path : join(process.cwd(), path);
}
