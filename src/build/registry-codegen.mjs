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
      createClientRegistry({ islands, generatedDir }),
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
      createClientEntry({ hmr }),
    ),
    writeFileIfChanged(join(generatedDir, 'server-boot.ts'), createServerBoot()),
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

function createClientEntry({ hmr = false }) {
  const clientImports = hmr
    ? 'installClientRuntime, installHmr, installNavigation, reloadManifest'
    : 'installClientRuntime, installNavigation, reloadManifest';

  return [
    'import "./client-styles.js";',
    `import { ${clientImports} } from "nest-can-react/client";`,
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

function createServerBoot() {
  return [
    'import {',
    '  registerClientRuntime,',
    '  registerIslandComponents,',
    '  registerLayout,',
    '} from "nest-can-react/register";',
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
  if (!layoutEntry) {
    return 'export { default } from "nest-can-react/layout";\n';
  }

  const layoutPath = resolve(rootDir, layoutEntry);

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

function createClientRegistry({ generatedDir, islands }) {
  const entries = islands
    .map((island) => {
      const islandImport = toImportSpecifier(generatedDir, island.file);
      return `  ${JSON.stringify(island.name)}: () => import(${JSON.stringify(
        islandImport,
      )}).then((module) => module.${island.name}),`;
    })
    .join('\n');

  return [
    'import type { IslandClientRegistry } from "nest-can-react/client";',
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
  // Keep the real source extension so the runtime TSX loader can compile
  // islands and layout files. Rewriting to `.js` is unresolved for `.tsx`.
  const relativePath = toPosixPath(relative(fromDir, toFile));
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
