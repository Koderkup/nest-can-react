import { existsSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const defaultConfig = {
  outDir: 'public/nest-can-react',
  serverOutDir: '.nest-can-react/server',
  publicPath: '/assets/nest-can-react',
  pages: {
    include: ['src/**/*.page.tsx'],
    exclude: ['src/**/*.test.tsx', 'src/**/*.spec.tsx'],
  },
  styles: [],
  generatedDir: '.nest-can-react/generated',
  layoutEntry: 'src/layout.tsx',
  runtimeEntry: 'src/app.runtime.tsx',
  hmrPort: 9101,
};

export async function loadConfig(rootDir, overrides = {}) {
  const jsonConfigPath = resolve(
    rootDir,
    overrides.config ?? 'nest.react.json',
  );

  if (existsSync(jsonConfigPath)) {
    const fileConfig = JSON.parse(readFileSync(jsonConfigPath, 'utf8'));
    return normalizeConfig({ ...fileConfig, ...overrides }, rootDir);
  }

  const mjsConfigPath = resolve(rootDir, 'nest-can-react.config.mjs');

  if (!existsSync(mjsConfigPath)) {
    return normalizeConfig({ ...defaultConfig, ...overrides }, rootDir);
  }

  const configModule = await import(pathToFileURL(mjsConfigPath).href);
  const fileConfig = configModule.default ?? configModule;

  return normalizeConfig({ ...fileConfig, ...overrides }, rootDir);
}

function normalizeConfig(config, rootDir) {
  const client = config.client ?? {};
  const pages = normalizePagesConfig(config.pages);

  return {
    rootDir,
    outDir: resolve(
      rootDir,
      client.outDir ?? config.outDir ?? defaultConfig.outDir,
    ),
    serverOutDir: resolve(
      rootDir,
      config.serverOutDir ?? defaultConfig.serverOutDir,
    ),
    publicPath: normalizePublicPath(
      client.publicPath ?? config.publicPath ?? defaultConfig.publicPath,
    ),
    pages,
    styles: normalizeStyles(client.styles ?? config.styles),
    generatedDir: resolve(
      rootDir,
      config.generatedDir ?? defaultConfig.generatedDir,
    ),
    layoutEntry: resolve(
      rootDir,
      config.layout ?? config.layoutEntry ?? defaultConfig.layoutEntry,
    ),
    runtimeEntry: resolve(
      rootDir,
      config.runtime?.entry ??
        config.runtimeEntry ??
        defaultConfig.runtimeEntry,
    ),
    hmrPort: Number(config.hmrPort ?? defaultConfig.hmrPort),
  };
}

function normalizePagesConfig(pages) {
  if (Array.isArray(pages)) {
    return {
      include: pages,
      exclude: defaultConfig.pages.exclude,
    };
  }

  return {
    include: pages?.include ?? defaultConfig.pages.include,
    exclude: pages?.exclude ?? defaultConfig.pages.exclude,
  };
}

function normalizeStyles(styles) {
  if (styles == null) {
    return [];
  }

  if (!Array.isArray(styles)) {
    throw new Error('client.styles must be an array of file paths.');
  }

  return styles;
}

export function normalizePublicPath(publicPath) {
  return `/${publicPath}`.replace(/\/+/g, '/').replace(/\/$/, '');
}

export function toPosixPath(path) {
  return path.split(sep).join('/');
}
