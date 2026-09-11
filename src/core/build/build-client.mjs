import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import {
  basename,
  dirname,
  extname,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const defaultConfig = {
  outDir: 'public/nest-react',
  publicPath: '/assets/nest-react',
  codeSplitting: true,
  islands: {
    include: ['src/**/*.island.tsx'],
    exclude: ['src/**/*.test.tsx', 'src/**/*.spec.tsx'],
  },
  generatedDir: '.nest-react/generated',
  runtimeEntry: 'src/app.runtime.tsx',
  layoutEntry: undefined,
};

export async function buildNestReactClient(overrides = {}) {
  const rootDir = resolve(overrides.rootDir ?? process.cwd());
  const config = await loadConfig(rootDir, overrides);
  const codeSplitting = shouldSplit(config);
  const outdir = resolve(rootDir, config.outDir);
  const generatedDir = resolve(rootDir, config.generatedDir);
  const islands = await discoverIslands(rootDir, config.islands);

  await generateIslandRegistries({
    generatedDir,
    islands,
    rootDir,
    runtimeEntry: config.runtimeEntry,
    layoutEntry: config.layoutEntry,
  });

  const entryPoint = resolve(
    rootDir,
    config.clientEntry ?? join(config.generatedDir, 'client-entry.tsx'),
  );

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
    islands,
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
  const jsonConfigPath = resolve(rootDir, overrides.config ?? 'nest.react.json');

  if (existsSync(jsonConfigPath)) {
    const fileConfig = JSON.parse(readFileSync(jsonConfigPath, 'utf8'));
    return normalizeConfig({ ...fileConfig, ...overrides });
  }

  const mjsConfigPath = resolve(rootDir, 'nest-react.config.mjs');

  if (!existsSync(mjsConfigPath)) {
    return normalizeConfig({ ...defaultConfig, ...overrides });
  }

  const configModule = await import(pathToFileURL(mjsConfigPath).href);
  const fileConfig = configModule.default ?? configModule;

  return normalizeConfig({ ...fileConfig, ...overrides });
}

function normalizeConfig(config) {
  const client = config.client ?? {};
  const islands = normalizeIslandConfig(config.islands);

  return {
    ...defaultConfig,
    clientEntry: client.entry ?? config.clientEntry,
    outDir: client.outDir ?? config.outDir ?? defaultConfig.outDir,
    publicPath:
      client.publicPath ?? config.publicPath ?? defaultConfig.publicPath,
    codeSplitting:
      client.codeSplitting ?? config.codeSplitting ?? defaultConfig.codeSplitting,
    islands,
    generatedDir: config.generatedDir ?? defaultConfig.generatedDir,
    runtimeEntry:
      config.runtime?.entry ??
      config.runtimeEntry ??
      defaultConfig.runtimeEntry,
    layoutEntry: config.layout ?? config.layoutEntry ?? defaultConfig.layoutEntry,
  };
}

function normalizeIslandConfig(islands) {
  if (Array.isArray(islands)) {
    return {
      include: islands,
      exclude: defaultConfig.islands.exclude,
    };
  }

  return {
    include: islands?.include ?? defaultConfig.islands.include,
    exclude: islands?.exclude ?? defaultConfig.islands.exclude,
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
    config.islands.map((island) => [
      island.name,
      findIslandAssets(island.name, outputs, metafile, config),
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

async function discoverIslands(rootDir, config) {
  const files = await walk(rootDir);
  const include = config.include.map(globToRegex);
  const exclude = config.exclude.map(globToRegex);
  const islands = files
    .map((file) => ({
      file,
      relativeFile: toPosixPath(relative(rootDir, file)),
    }))
    .filter(({ relativeFile }) => include.some((regex) => regex.test(relativeFile)))
    .filter(({ relativeFile }) => !exclude.some((regex) => regex.test(relativeFile)))
    .map(({ file }) => ({
      file,
      name: getIslandName(file),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  assertUniqueIslandNames(islands);

  return islands;
}

async function walk(rootDir) {
  const ignoredDirectories = new Set([
    '.git',
    '.nest-react',
    'dist',
    'node_modules',
    'public',
  ]);
  const entries = await readdir(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(rootDir, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...(await walk(path)));
      }

      continue;
    }

    if (entry.isFile()) {
      files.push(path);
    }
  }

  return files;
}

function getIslandName(file) {
  const fileName = basename(file);
  return fileName.replace(/\.island\.[^.]+$/, '');
}

function assertUniqueIslandNames(islands) {
  const seen = new Map();

  for (const island of islands) {
    const previous = seen.get(island.name);

    if (previous) {
      throw new Error(
        `Duplicate island name "${island.name}" found in ${previous} and ${island.file}.`,
      );
    }

    seen.set(island.name, island.file);
  }
}

async function generateIslandRegistries({
  generatedDir,
  islands,
  rootDir,
  runtimeEntry,
  layoutEntry,
}) {
  await mkdir(generatedDir, { recursive: true });

  await Promise.all([
    writeFile(
      join(generatedDir, 'client-registry.ts'),
      createClientRegistry({ generatedDir, islands, rootDir }),
    ),
    writeFile(
      join(generatedDir, 'server-registry.ts'),
      createServerRegistry({ generatedDir, islands }),
    ),
    writeFile(
      join(generatedDir, 'client-runtime.ts'),
      createClientRuntimeModule({
        generatedDir,
        rootDir,
        runtimeEntry,
      }),
    ),
    writeFile(
      join(generatedDir, 'server-layout.ts'),
      createServerLayoutModule({ generatedDir, rootDir, layoutEntry }),
    ),
    writeFile(
      join(generatedDir, 'client-entry.tsx'),
      createClientEntry({ generatedDir, rootDir }),
    ),
    writeFile(
      join(generatedDir, 'server-boot.ts'),
      createServerBoot({ generatedDir, rootDir }),
    ),
  ]);
}

function createClientEntry({ generatedDir, rootDir }) {
  const mountImport = toImportSpecifier(
    generatedDir,
    resolve(rootDir, 'src/core/client/mount.tsx'),
  );
  const navigationImport = toImportSpecifier(
    generatedDir,
    resolve(rootDir, 'src/core/client/navigation.ts'),
  );
  const runtimeImport = toImportSpecifier(
    generatedDir,
    resolve(rootDir, 'src/core/client/runtime.ts'),
  );

  return [
    `import { installClientRuntime } from ${JSON.stringify(mountImport)};`,
    `import { installNavigation } from ${JSON.stringify(navigationImport)};`,
    `import { reloadManifest } from ${JSON.stringify(runtimeImport)};`,
    'import { registry } from "./client-registry.js";',
    'import { ClientRuntime } from "./client-runtime.js";',
    '',
    'function bootPage() {',
    '  reloadManifest();',
    '}',
    '',
    'async function boot() {',
    '  reloadManifest();',
    '  await installClientRuntime(registry, ClientRuntime);',
    '  installNavigation({',
    '    onPageChanged: bootPage,',
    '  });',
    '}',
    '',
    'void boot();',
    '',
  ].join('\n');
}

function createServerBoot({ generatedDir, rootDir }) {
  const registryImport = toImportSpecifier(
    generatedDir,
    resolve(rootDir, 'src/core/island-registry.ts'),
  );
  const layoutImport = toImportSpecifier(
    generatedDir,
    resolve(rootDir, 'src/core/layout-registry.ts'),
  );

  return [
    `import { registerClientRuntime, registerIslandComponents } from ${JSON.stringify(registryImport)};`,
    `import { registerLayout } from ${JSON.stringify(layoutImport)};`,
    'import { ClientRuntime } from "./client-runtime.js";',
    'import { registry } from "./server-registry.js";',
    'import Layout from "./server-layout.js";',
    '',
    'registerIslandComponents(registry);',
    'registerClientRuntime(ClientRuntime);',
    'registerLayout(Layout);',
    '',
  ].join('\n');
}

function createServerLayoutModule({ generatedDir, rootDir, layoutEntry }) {
  const layoutPath = layoutEntry
    ? resolve(rootDir, layoutEntry)
    : resolve(rootDir, 'src/core/default-layout.tsx');

  if (!existsSync(layoutPath)) {
    throw new Error(`Nest React layout entry "${layoutEntry}" was not found.`);
  }

  const layoutImport = toImportSpecifier(generatedDir, layoutPath);

  return [`export { default } from ${JSON.stringify(layoutImport)};`, ''].join(
    '\n',
  );
}

function createClientRuntimeModule({ generatedDir, rootDir, runtimeEntry }) {
  const runtimePath = resolve(rootDir, runtimeEntry);

  if (!existsSync(runtimePath)) {
    return [
      'import type { ReactNode } from "react";',
      '',
      'export function ClientRuntime({ children }: { children: ReactNode }) {',
      '  return children;',
      '}',
      '',
    ].join('\n');
  }

  const runtimeImport = toImportSpecifier(generatedDir, runtimePath);

  return [
    `export { ClientRuntime } from ${JSON.stringify(runtimeImport)};`,
    '',
  ].join('\n');
}

function createClientRegistry({ generatedDir, islands, rootDir }) {
  const mountImport = toImportSpecifier(
    generatedDir,
    resolve(rootDir, 'src/core/client/mount.tsx'),
  );
  const entries = islands
    .map((island) => {
      const islandImport = toImportSpecifier(generatedDir, island.file);
      return `  ${JSON.stringify(island.name)}: () => import(${JSON.stringify(
        islandImport,
      )}).then((module) => module.${island.name}),`;
    })
    .join('\n');

  return [
    `import type { IslandClientRegistry } from ${JSON.stringify(mountImport)};`,
    '',
    'export const registry = {',
    entries,
    '} satisfies IslandClientRegistry;',
    '',
  ].join('\n');
}

function createServerRegistry({ generatedDir, islands }) {
  const imports = islands
    .map((island) => {
      const islandImport = toImportSpecifier(generatedDir, island.file);
      return `import { ${island.name} } from ${JSON.stringify(islandImport)};`;
    })
    .join('\n');
  const entries = islands.map((island) => `  ${island.name},`).join('\n');

  return [
    imports,
    '',
    'export const registry = {',
    entries,
    '};',
    '',
  ].join('\n');
}

function toImportSpecifier(fromDir, toFile) {
  const relativePath = toPosixPath(relative(fromDir, toFile)).replace(
    /\.[^.]+$/,
    '.js',
  );
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}

function globToRegex(pattern) {
  const escaped = toPosixPath(pattern)
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '__NEST_REACT_GLOBSTAR__')
    .replace(/\*/g, '[^/]*');

  return new RegExp(
    `^${escaped.replace(/__NEST_REACT_GLOBSTAR__/g, '.*')}$`,
  );
}

function toPosixPath(path) {
  return path.split(sep).join('/');
}

function findIslandAssets(name, outputs, metafile, config) {
  const matchingFiles = outputs
    .filter(([file, output]) => isIslandOutput(name, file, output))
    .flatMap(([file]) => collectOutputFiles(file, metafile));

  return [...new Set(matchingFiles)].map((file) => toPublicAsset(file, config));
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
