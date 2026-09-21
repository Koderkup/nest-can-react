import { existsSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const defaultConfig = {
  outDir: 'public/nest-react',
  publicPath: '/assets/nest-react',
  codeSplitting: true,
  styles: [],
  islands: {
    include: ['src/**/*.island.tsx'],
    exclude: ['src/**/*.test.tsx', 'src/**/*.spec.tsx'],
  },
  generatedDir: '.nest-react/generated',
  runtimeEntry: 'src/app.runtime.tsx',
  layoutEntry: undefined,
};

export async function loadConfig(rootDir, overrides) {
  const jsonConfigPath = resolve(
    rootDir,
    overrides.config ?? 'nest.react.json',
  );

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
      client.codeSplitting ??
      config.codeSplitting ??
      defaultConfig.codeSplitting,
    styles: normalizeStyles(client.styles ?? config.styles),
    islands,
    generatedDir: config.generatedDir ?? defaultConfig.generatedDir,
    runtimeEntry:
      config.runtime?.entry ??
      config.runtimeEntry ??
      defaultConfig.runtimeEntry,
    layoutEntry:
      config.layout ?? config.layoutEntry ?? defaultConfig.layoutEntry,
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

function normalizeStyles(styles) {
  if (styles == null) {
    return [];
  }

  if (!Array.isArray(styles)) {
    throw new Error('client.styles must be an array of file paths.');
  }

  return styles;
}

export function shouldSplit(config) {
  if (process.argv.includes('--no-code-splitting')) {
    return false;
  }

  if (process.env.NEST_REACT_CODE_SPLITTING === 'false') {
    return false;
  }

  return config.codeSplitting !== false;
}

export function normalizePublicPath(publicPath) {
  return `/${publicPath}`.replace(/\/+/g, '/').replace(/\/$/, '');
}

export function toPosixPath(path) {
  return path.split(sep).join('/');
}
