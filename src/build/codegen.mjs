import { existsSync, readFileSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toPosixPath } from './load-config.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const flightTemplates = join(packageRoot, 'src/flight');

export async function generateFlightEntries({ config, pages }) {
  await mkdir(config.generatedDir, { recursive: true });
  await removeStaleGeneratedFiles(config.generatedDir);

  const layoutImport = toImportSpecifier(
    config.generatedDir,
    config.layoutEntry,
  );
  const hasRuntime = existsSync(config.runtimeEntry);
  const runtimeImport = hasRuntime
    ? toImportSpecifier(config.generatedDir, config.runtimeEntry)
    : null;

  const pageImports = pages
    .map((page, index) => {
      const spec = toImportSpecifier(config.generatedDir, page.file);
      return `import Page${index} from ${JSON.stringify(spec)};`;
    })
    .join('\n');

  const pageEntries = pages
    .map((page, index) => `  ${JSON.stringify(page.name)}: Page${index},`)
    .join('\n');

  const styleImports = config.styles
    .map((style) => {
      const stylePath = resolve(config.rootDir, style);
      if (!existsSync(stylePath)) {
        throw new Error(`Style "${style}" was not found.`);
      }
      return `import ${JSON.stringify(toImportSpecifier(config.generatedDir, stylePath))};`;
    })
    .join('\n');

  await writeFileIfChanged(
    join(config.generatedDir, 'pages.ts'),
    [
      pageImports,
      '',
      'export const pages = {',
      pageEntries,
      '} as const;',
      '',
      'export type PageName = keyof typeof pages;',
      '',
    ].join('\n'),
  );

  const clientManifestRel = toPosixPath(
    relative(config.rootDir, join(config.serverOutDir, '..', 'client-manifest.json')),
  );

  await writeFileIfChanged(
    join(config.generatedDir, 'entry.rsc.tsx'),
    createRscEntry({ layoutImport, clientManifestRel }),
  );

  await writeFileIfChanged(
    join(config.generatedDir, 'entry.ssr.tsx'),
    createSsrEntry(),
  );

  await writeFileIfChanged(
    join(config.generatedDir, 'entry.client.tsx'),
    createClientEntry({ runtimeImport, styleImports }),
  );

  await writeFileIfChanged(
    join(config.generatedDir, 'request.ts'),
    readTemplate('request.ts'),
  );

  await writeFileIfChanged(
    join(config.generatedDir, 'handle-request.ts'),
    readTemplate('handle-request.ts'),
  );

  await writeFileIfChanged(
    join(config.generatedDir, 'render-html.tsx'),
    readTemplate('render-html.tsx'),
  );

  await writeFileIfChanged(
    join(config.generatedDir, 'client-boot.tsx'),
    readTemplate('client-boot.tsx'),
  );

  await writeFileIfChanged(
    join(config.generatedDir, 'dev-hmr-client.ts'),
    readTemplate('dev-hmr-client.ts'),
  );

  await writeFileIfChanged(
    join(config.generatedDir, 'dev-overlay.ts'),
    readTemplate('dev-overlay.ts'),
  );

  return {
    rscEntry: join(config.generatedDir, 'entry.rsc.tsx'),
    ssrEntry: join(config.generatedDir, 'entry.ssr.tsx'),
    clientEntry: join(config.generatedDir, 'entry.client.tsx'),
  };
}

function createRscEntry({ layoutImport, clientManifestRel }) {
  return `import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import type { ServerEntry } from 'react-server-dom-rspack/server.node';
import { runWithLayoutMeta } from 'nest-can-react';
import Layout from ${JSON.stringify(layoutImport)};
import { pages, type PageName } from './pages';
import { handleRequest, type NestRenderOptions } from './handle-request';

export type { PageName };

type ClientManifest = {
  entryCssFiles?: string[];
  entryJsFiles?: string[];
};

function loadClientManifest(): ClientManifest {
  const manifestPath = join(
    process.cwd(),
    ${JSON.stringify(clientManifestRel)},
  );

  try {
    return JSON.parse(readFileSync(manifestPath, 'utf8')) as ClientManifest;
  } catch {
    return { entryCssFiles: [] };
  }
}

function mergeAssetHrefs(...groups: (string[] | undefined)[]) {
  const seen = new Set<string>();
  const hrefs: string[] = [];

  for (const group of groups) {
    for (const href of group ?? []) {
      if (seen.has(href)) {
        continue;
      }
      seen.add(href);
      hrefs.push(href);
    }
  }

  return hrefs;
}

export async function renderNestPage(
  pageName: string,
  props: Record<string, unknown>,
  options: NestRenderOptions,
): Promise<void> {
  const Page = pages[pageName as PageName];

  if (!Page) {
    throw new Error(
      \`Unknown nest-can-react page "\${pageName}". Known pages: \${Object.keys(pages).join(', ') || '(none)'}.\`,
    );
  }

  const serverEntry = Page as ServerEntry<typeof Page>;
  const clientManifest = loadClientManifest();
  const stylesheetHrefs = mergeAssetHrefs(
    clientManifest.entryCssFiles,
    serverEntry.entryCssFiles,
  );
  const bootstrapScripts = mergeAssetHrefs(
    clientManifest.entryJsFiles,
    serverEntry.entryJsFiles,
  );
  const css = stylesheetHrefs.map((href) => (
    <link key={href} rel="stylesheet" href={href} precedence="default" />
  ));

  await runWithLayoutMeta(async () => {
    const root = (
      <>
        {css}
        <Layout>
          <Page {...props} />
        </Layout>
      </>
    );

    await handleRequest({
      ...options,
      getRoot: () => root,
      bootstrapScripts,
    });
  });
}

export function listPages() {
  return Object.keys(pages);
}

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept();
}
`;
}

function createSsrEntry() {
  return `export { renderHTML } from './render-html';
`;
}

function createClientEntry({ runtimeImport, styleImports }) {
  return `${styleImports}
import { connectNestCanReactDevHmr } from './dev-hmr-client';
import { bootClient } from './client-boot';
${runtimeImport ? `import { ClientRuntime } from ${JSON.stringify(runtimeImport)};` : 'const ClientRuntime = undefined;'}

connectNestCanReactDevHmr();

void bootClient({
  Runtime: ClientRuntime,
});
`;
}

async function removeStaleGeneratedFiles(generatedDir) {
  await Promise.all(
    ['dev-live-reload.tsx', 'hmr-bridge.ts', 'constants.ts'].map((file) =>
      rm(join(generatedDir, file), { force: true }),
    ),
  );
}

function readTemplate(name) {
  return readFileSync(join(flightTemplates, name), 'utf8');
}

function toImportSpecifier(fromDir, toFile) {
  const relativePath = toPosixPath(relative(fromDir, toFile));
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}

async function writeFileIfChanged(path, contents) {
  try {
    if (readFileSync(path, 'utf8') === contents) {
      return false;
    }
  } catch {
    // missing
  }

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents);
  return true;
}
