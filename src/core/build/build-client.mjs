import { mkdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import {
  isRuntimeOutput,
  isSameFile,
  isVendorJsOutput,
  toPublicAsset,
  writeBuildArtifacts,
} from './asset-manifest.mjs';
import { discoverIslands, getIslandName } from './discover-islands.mjs';
import { createEsbuildOptions, formatEsbuildErrors } from './esbuild-options.mjs';
import {
  loadConfig,
  normalizePublicPath,
  shouldSplit,
} from './load-config.mjs';
import { generateIslandRegistries } from './registry-codegen.mjs';

export { getIslandName };

export async function buildNestReactClient(overrides = {}) {
  const rootDir = resolve(overrides.rootDir ?? process.cwd());
  const config = await loadConfig(rootDir, overrides);
  const codeSplitting = shouldSplit(config);
  const outdir = resolve(rootDir, config.outDir);
  const generatedDir = resolve(rootDir, config.generatedDir);
  const islands = await discoverIslands(rootDir, config.islands);
  const publicPath = normalizePublicPath(config.publicPath);

  await generateIslandRegistries({
    generatedDir,
    islands,
    rootDir,
    runtimeEntry: config.runtimeEntry,
    layoutEntry: config.layoutEntry,
    styles: config.styles,
    hmr: false,
  });

  const entryPoint = resolve(
    rootDir,
    config.clientEntry ?? join(config.generatedDir, 'client-entry.tsx'),
  );

  await rm(outdir, { recursive: true, force: true });
  await mkdir(outdir, { recursive: true });

  const result = await esbuild.build(
    createEsbuildOptions({
      codeSplitting,
      entryPoint,
      hmr: false,
      outdir,
      publicPath,
      stableNames: false,
    }),
  );

  await writeBuildArtifacts(result, {
    codeSplitting,
    entryPoint,
    generatedDir,
    islands,
    outdir,
    publicPath,
    rootDir,
  });

  console.log(`Built Nest React client assets in ${outdir}`);
}

export async function watchNestReactClient(overrides = {}, handlers = {}) {
  const rootDir = resolve(overrides.rootDir ?? process.cwd());
  const config = await loadConfig(rootDir, overrides);
  const codeSplitting = shouldSplit(config);
  const outdir = resolve(rootDir, config.outDir);
  const generatedDir = resolve(rootDir, config.generatedDir);
  const publicPath = normalizePublicPath(config.publicPath);
  const state = {
    islands: await discoverIslands(rootDir, config.islands),
  };

  await generateIslandRegistries({
    generatedDir,
    islands: state.islands,
    rootDir,
    runtimeEntry: config.runtimeEntry,
    layoutEntry: config.layoutEntry,
    styles: config.styles,
    hmr: true,
  });

  const entryPoint = resolve(
    rootDir,
    config.clientEntry ?? join(config.generatedDir, 'client-entry.tsx'),
  );
  const { createReactRefreshPlugin } =
    await import('./react-refresh-plugin.mjs');

  await rm(outdir, { recursive: true, force: true });
  await mkdir(outdir, { recursive: true });

  let firstBuild = null;
  const firstBuildDone = new Promise((resolve, reject) => {
    firstBuild = { resolve, reject };
  });

  const context = await esbuild.context({
    ...createEsbuildOptions({
      codeSplitting,
      entryPoint,
      hmr: true,
      outdir,
      publicPath,
      stableNames: true,
    }),
    plugins: [
      createReactRefreshPlugin({ rootDir }),
      {
        name: 'nest-react-watch-artifacts',
        setup(build) {
          build.onEnd(async (result) => {
            if (result.errors.length > 0) {
              const error = new Error(formatEsbuildErrors(result.errors));
              handlers.onError?.(error, result.errors);
              firstBuild?.reject(error);
              firstBuild = null;
              return;
            }

            try {
              const manifest = await writeBuildArtifacts(result, {
                codeSplitting,
                entryPoint,
                generatedDir,
                islands: state.islands,
                outdir,
                publicPath,
                rootDir,
              });
              handlers.onRebuild?.({
                islands: state.islands,
                manifest,
                metafile: result.metafile,
              });
              firstBuild?.resolve(manifest);
              firstBuild = null;
            } catch (error) {
              handlers.onError?.(error);
              firstBuild?.reject(error);
              firstBuild = null;
            }
          });
        },
      },
    ],
  });

  await context.watch();

  try {
    await firstBuildDone;
  } catch {
    // Keep watching so the next save can recover.
  }

  return {
    async dispose() {
      await context.dispose();
    },
    getIslands() {
      return state.islands;
    },
    async regenerate() {
      const islands = await discoverIslands(rootDir, config.islands);
      const graphChanged =
        islandGraphKey(islands) !== islandGraphKey(state.islands);
      state.islands = islands;
      await generateIslandRegistries({
        generatedDir,
        islands,
        rootDir,
        runtimeEntry: config.runtimeEntry,
        layoutEntry: config.layoutEntry,
        styles: config.styles,
        hmr: true,
      });
      return { graphChanged, islands };
    },
  };
}

export function collectChangedClientModules(
  metafile,
  previousOutputFiles,
  config,
) {
  const urls = [];

  for (const [outputFile, output] of Object.entries(metafile.outputs ?? {})) {
    if (
      previousOutputFiles.has(outputFile) ||
      !outputFile.endsWith('.js') ||
      isRuntimeOutput(outputFile) ||
      isVendorJsOutput(output)
    ) {
      continue;
    }

    urls.push(toPublicAsset(outputFile, config));
  }

  return urls;
}

function islandGraphKey(islands) {
  return islands.map((island) => `${island.name}:${island.file}`).join('|');
}

if (
  process.argv[1] &&
  isSameFile(fileURLToPath(import.meta.url), process.argv[1])
) {
  await buildNestReactClient();
}
