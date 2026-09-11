import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const ownDir = dirname(fileURLToPath(import.meta.url));

const defaultConfig = {
  clientEntry: 'src/demo/client/entry.tsx',
  outDir: 'public/nest-react',
  publicPath: '/assets/nest-react',
  codeSplitting: true,
  islands: [],
};

export async function buildNestReactClient(overrides = {}) {
  const rootDir = resolve(overrides.rootDir ?? process.cwd());
  const config = await loadConfig(rootDir, overrides);
  const codeSplitting = shouldSplit(config);
  const entryPoint = resolve(rootDir, config.clientEntry);
  const outdir = resolve(rootDir, config.outDir);

  await rm(outdir, { recursive: true, force: true });
  await mkdir(outdir, { recursive: true });

  const result = await esbuild.build({
    entryPoints: [entryPoint],
    outdir,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2022'],
    jsx: 'automatic',
    sourcemap: true,
    minify: process.env.NODE_ENV === 'production',
    splitting: codeSplitting,
    entryNames: codeSplitting ? 'runtime-[hash]' : 'client-[hash]',
    chunkNames: 'chunks/[name]-[hash]',
    metafile: true,
    define: {
      'process.env.NODE_ENV': JSON.stringify(
        process.env.NODE_ENV ?? 'development',
      ),
    },
  });

  const manifest = createAssetManifest(result.metafile, {
    codeSplitting,
    entryPoint,
    islands: config.islands ?? [],
    outdir,
    publicPath: normalizePublicPath(config.publicPath),
    rootDir,
  });

  await writeFile(
    join(outdir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  console.log(`Built Nest React client assets in ${outdir}`);
}

async function loadConfig(rootDir, overrides) {
  const configPath = resolve(
    rootDir,
    overrides.config ?? 'nest-react.config.mjs',
  );

  if (!existsSync(configPath)) {
    return { ...defaultConfig, ...overrides };
  }

  const configModule = await import(pathToFileURL(configPath).href);
  const fileConfig = configModule.default ?? configModule;

  return {
    ...defaultConfig,
    ...fileConfig,
    ...overrides,
  };
}

function shouldSplit(config) {
  if (process.argv.includes('--no-code-splitting')) {
    return false;
  }

  if (process.env.NEST_REACT_CODE_SPLITTING === 'false') {
    return false;
  }

  return config.codeSplitting !== false;
}

function createAssetManifest(metafile, config) {
  const outputs = Object.entries(metafile.outputs).filter(([file]) =>
    file.endsWith('.js'),
  );
  const runtimeOutput =
    outputs.find(([, output]) =>
      isSameFile(resolve(config.rootDir, output.entryPoint ?? ''), config.entryPoint),
    ) ?? outputs[0];

  if (!runtimeOutput) {
    throw new Error('Nest React client build did not emit a runtime bundle.');
  }

  const islands = Object.fromEntries(
    config.islands.map((name) => [
      name,
      findIslandAssets(name, outputs, metafile, config),
    ]),
  );

  return {
    version: 1,
    codeSplitting: config.codeSplitting,
    publicPath: config.publicPath,
    runtime: toPublicAsset(runtimeOutput[0], config),
    chunks: outputs
      .filter(([file]) => file !== runtimeOutput[0])
      .map(([file]) => toPublicAsset(file, config)),
    islands,
  };
}

function findIslandAssets(name, outputs, metafile, config) {
  const matchingFiles = outputs
    .filter(([file, output]) => isIslandOutput(name, file, output))
    .flatMap(([file]) => collectOutputFiles(file, metafile));

  return [...new Set(matchingFiles)].map((file) => toPublicAsset(file, config));
}

function isIslandOutput(name, file, output) {
  const entryBase = output.entryPoint
    ? basename(output.entryPoint, extname(output.entryPoint))
    : '';
  const outputBase = basename(file, extname(file));

  return entryBase === name || outputBase.startsWith(`${name}-`);
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

function toPublicAsset(file, config) {
  const absoluteFile = resolve(config.rootDir, file);
  const relativeFile = relative(config.outdir, absoluteFile).split(sep).join('/');
  return `${config.publicPath}/${relativeFile}`;
}

function normalizePublicPath(publicPath) {
  return `/${publicPath}`.replace(/\/+/g, '/').replace(/\/$/, '');
}

function isSameFile(left, right) {
  return resolve(left) === resolve(right);
}

if (process.argv[1] && isSameFile(fileURLToPath(import.meta.url), process.argv[1])) {
  await buildNestReactClient();
}
