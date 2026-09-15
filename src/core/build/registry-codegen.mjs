import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { toPosixPath } from './load-config.mjs';

export async function generateIslandRegistries({
  generatedDir,
  islands,
  rootDir,
  runtimeEntry,
  layoutEntry,
  styles,
  hmr = false,
}) {
  await mkdir(generatedDir, { recursive: true });

  await Promise.all([
    writeFileIfChanged(
      join(generatedDir, 'client-registry.ts'),
      createClientRegistry({ generatedDir, islands, rootDir }),
    ),
    writeFileIfChanged(
      join(generatedDir, 'server-registry.ts'),
      createServerRegistry({ generatedDir, islands }),
    ),
    writeFileIfChanged(
      join(generatedDir, 'client-runtime.ts'),
      createClientRuntimeModule({
        generatedDir,
        rootDir,
        runtimeEntry,
      }),
    ),
    writeFileIfChanged(
      join(generatedDir, 'server-layout.ts'),
      createServerLayoutModule({ generatedDir, rootDir, layoutEntry }),
    ),
    writeFileIfChanged(
      join(generatedDir, 'client-styles.ts'),
      createClientStyles({ generatedDir, rootDir, styles }),
    ),
    writeFileIfChanged(
      join(generatedDir, 'client-entry.tsx'),
      createClientEntry({ generatedDir, rootDir, hmr }),
    ),
    writeFileIfChanged(
      join(generatedDir, 'server-boot.ts'),
      createServerBoot({ generatedDir, rootDir }),
    ),
  ]);
}

function createClientStyles({ generatedDir, rootDir, styles }) {
  if (!styles.length) {
    return 'export {};\n';
  }

  return `${styles
    .map((style) => {
      const stylePath = resolve(rootDir, style);

      if (!existsSync(stylePath)) {
        throw new Error(`Nest React client style "${style}" was not found.`);
      }

      return `import ${JSON.stringify(toStyleImportSpecifier(generatedDir, stylePath))};`;
    })
    .join('\n')}\n`;
}

function createClientEntry({ generatedDir, rootDir, hmr = false }) {
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
  const refreshImport = toImportSpecifier(
    generatedDir,
    resolve(rootDir, 'src/core/client/refresh-runtime.ts'),
  );
  const hmrImport = toImportSpecifier(
    generatedDir,
    resolve(rootDir, 'src/core/client/hmr.ts'),
  );

  return [
    ...(hmr
      ? [
          `import ${JSON.stringify(refreshImport)};`,
          `import { installHmr } from ${JSON.stringify(hmrImport)};`,
        ]
      : []),
    'import "./client-styles.js";',
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
    ...(hmr ? ['  installHmr();'] : []),
    '}',
    '',
    'void boot();',
    '',
  ].join('\n');
}

function createServerBoot({ generatedDir, rootDir }) {
  const registryImport = toImportSpecifier(
    generatedDir,
    resolve(rootDir, 'src/core/island/island-registry.ts'),
  );
  const layoutImport = toImportSpecifier(
    generatedDir,
    resolve(rootDir, 'src/core/render/layout-registry.ts'),
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
    : resolve(rootDir, 'src/core/render/default-layout.tsx');

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

  return [imports, '', 'export const registry = {', entries, '};', ''].join(
    '\n',
  );
}

function toImportSpecifier(fromDir, toFile) {
  const relativePath = toPosixPath(relative(fromDir, toFile)).replace(
    /\.[^.]+$/,
    '.js',
  );
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}

function toStyleImportSpecifier(fromDir, toFile) {
  const relativePath = toPosixPath(relative(fromDir, toFile));
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}

async function writeFileIfChanged(path, contents) {
  try {
    if (readFileSync(path, 'utf8') === contents) {
      return false;
    }
  } catch {
    // File does not exist yet.
  }

  await writeFile(path, contents);
  return true;
}
