import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { normalizePublicPath } from './load-config.mjs';

function findClientStats(stats) {
  const children = stats.stats ?? [stats];

  for (const child of children) {
    const name =
      child.compilation?.name ??
      child.compilation?.compiler?.name ??
      child.compilation?.compiler?.options?.name;

    if (name === 'client') {
      return child;
    }
  }

  for (const child of children) {
    const json = child.toJson({ assets: true, entrypoints: true });
    const mainAssets = json.entrypoints?.main?.assets ?? [];
    if (mainAssets.some((asset) => asset.name.endsWith('.js'))) {
      return child;
    }
  }

  return undefined;
}

export function collectClientManifest(stats, publicPath) {
  const prefix = normalizePublicPath(publicPath);
  const clientStats = findClientStats(stats);

  if (!clientStats) {
    return { entryCssFiles: [], entryJsFiles: [] };
  }

  const json = clientStats.toJson({ assets: true, entrypoints: true });
  const main = json.entrypoints?.main;
  const toHref = (name) => `${prefix}/${name}`.replace(/\/+/g, '/');

  const entryCssFiles = [];
  const entryJsFiles = [];

  for (const asset of main?.assets ?? []) {
    if (asset.name.endsWith('.css')) {
      entryCssFiles.push(toHref(asset.name));
    } else if (asset.name.endsWith('.js')) {
      entryJsFiles.push(toHref(asset.name));
    }
  }

  return { entryCssFiles, entryJsFiles };
}

export async function writeClientManifest(stats, config) {
  const manifest = collectClientManifest(stats, config.publicPath);
  await writeFile(
    join(config.serverOutDir, 'client-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  return manifest;
}
