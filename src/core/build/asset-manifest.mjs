import { writeFile } from 'node:fs/promises';
import { basename, extname, join, relative, resolve, sep } from 'node:path';
import { collectCssFromJsGraph } from './asset-css.mjs';
import { toPosixPath } from './load-config.mjs';

export async function writeBuildArtifacts(result, config) {
  const manifest = createAssetManifest(result.metafile, config);

  await writeFile(
    join(config.outdir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  await writeFile(
    join(config.generatedDir, 'asset-urls.json'),
    `${JSON.stringify(
      createAssetUrlMap(result.metafile, {
        outdir: config.outdir,
        publicPath: config.publicPath,
        rootDir: config.rootDir,
      }),
      null,
      2,
    )}\n`,
  );

  return manifest;
}

function createAssetManifest(metafile, config) {
  const jsOutputs = Object.entries(metafile.outputs).filter(([file]) =>
    file.endsWith('.js'),
  );
  const runtimeOutput =
    jsOutputs.find(([, output]) =>
      isSameFile(
        resolve(config.rootDir, output.entryPoint ?? ''),
        config.entryPoint,
      ),
    ) ?? jsOutputs[0];

  if (!runtimeOutput) {
    throw new Error('Nest React client build did not emit a runtime bundle.');
  }

  const islands = Object.fromEntries(
    config.islands.map((island) => [
      island.name,
      findIslandAssets(island.name, jsOutputs, metafile, config),
    ]),
  );
  const islandCss = Object.fromEntries(
    config.islands.map((island) => [
      island.name,
      findIslandCss(island.name, jsOutputs, metafile, config),
    ]),
  );

  return {
    version: 1,
    codeSplitting: config.codeSplitting,
    publicPath: config.publicPath,
    runtime: toPublicAsset(runtimeOutput[0], config),
    css: collectCssFromJsGraph(runtimeOutput[0], metafile, {
      followDynamic: false,
    }).map((file) => toPublicAsset(file, config)),
    chunks: jsOutputs
      .filter(([file]) => file !== runtimeOutput[0])
      .map(([file]) => toPublicAsset(file, config)),
    islands,
    islandCss,
  };
}

function findIslandAssets(name, outputs, metafile, config) {
  const matchingFiles = outputs
    .filter(([file, output]) => isIslandOutput(name, file, output))
    .flatMap(([file]) => collectOutputFiles(file, metafile));

  return [...new Set(matchingFiles)].map((file) => toPublicAsset(file, config));
}

function findIslandCss(name, outputs, metafile, config) {
  const cssFiles = outputs
    .filter(([file, output]) => isIslandOutput(name, file, output))
    .flatMap(([file]) =>
      collectCssFromJsGraph(file, metafile, { followDynamic: true }),
    );

  return [...new Set(cssFiles)].map((file) => toPublicAsset(file, config));
}

function isIslandOutput(name, file, output) {
  const entryBase = output.entryPoint
    ? normalizeIslandOutputName(
        basename(output.entryPoint, extname(output.entryPoint)),
      )
    : '';
  const outputBase = normalizeIslandOutputName(basename(file, extname(file)));

  return entryBase === name || outputBase.startsWith(`${name}-`);
}

function normalizeIslandOutputName(name) {
  return name.replace(/\.island(?=-|$)/, '');
}

function collectOutputFiles(file, metafile, seen = new Set()) {
  if (seen.has(file) || !metafile.outputs[file]) {
    return [];
  }

  seen.add(file);

  return [
    file,
    ...metafile.outputs[file].imports.flatMap((entry) =>
      collectOutputFiles(entry.path, metafile, seen),
    ),
  ].filter((outputFile) => outputFile.endsWith('.js'));
}

const staticAssetExtensions = new Set([
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

function createAssetUrlMap(metafile, config) {
  const map = {};

  for (const [outputFile, output] of Object.entries(metafile.outputs)) {
    if (!staticAssetExtensions.has(extname(outputFile).toLowerCase())) {
      continue;
    }

    const publicUrl = toPublicAsset(outputFile, config);

    for (const input of Object.keys(output.inputs ?? {})) {
      if (!staticAssetExtensions.has(extname(input).toLowerCase())) {
        continue;
      }

      map[toPosixPath(input)] = publicUrl;
      map[basename(input)] = publicUrl;
    }
  }

  return map;
}

export function toPublicAsset(file, config) {
  const absoluteFile = resolve(config.rootDir, file);
  const relativeFile = relative(config.outdir, absoluteFile)
    .split(sep)
    .join('/');
  return `${config.publicPath}/${relativeFile}`;
}

export function isRuntimeOutput(outputFile) {
  const name = outputFile.split('/').pop() ?? '';
  return /^runtime(?:-[A-Z0-9]+)?\.js$/i.test(name);
}

export function isVendorJsOutput(output) {
  const inputs = Object.keys(output.inputs ?? {});

  return (
    inputs.length > 0 &&
    inputs.every((input) => toPosixPath(input).includes('node_modules/'))
  );
}

export function isSameFile(left, right) {
  return resolve(left) === resolve(right);
}
