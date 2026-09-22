import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toPosixPath } from './load-config.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const flightTemplates = join(packageRoot, 'src/flight');

export async function generateFlightEntries({ config, pages }) {
  await mkdir(config.generatedDir, { recursive: true });

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

  await writeFileIfChanged(
    join(config.generatedDir, 'entry.rsc.tsx'),
    createRscEntry({
      layoutImport,
      hmrPort: config.hmrPort,
    }),
  );

  await writeFileIfChanged(
    join(config.generatedDir, 'entry.ssr.tsx'),
    createSsrEntry(),
  );

  await writeFileIfChanged(
    join(config.generatedDir, 'entry.client.tsx'),
    createClientEntry({
      runtimeImport,
      styleImports,
      hmrPort: config.hmrPort,
    }),
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
    join(config.generatedDir, 'hmr-bridge.ts'),
    createHmrBridge(config.hmrPort),
  );

  return {
    rscEntry: join(config.generatedDir, 'entry.rsc.tsx'),
    ssrEntry: join(config.generatedDir, 'entry.ssr.tsx'),
    clientEntry: join(config.generatedDir, 'entry.client.tsx'),
  };
}

function createRscEntry({ layoutImport, hmrPort }) {
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
};

function loadClientManifest(): ClientManifest {
  const manifestPath = join(
    process.cwd(),
    '.nest-can-react/server/client-manifest.json',
  );

  try {
    return JSON.parse(readFileSync(manifestPath, 'utf8')) as ClientManifest;
  } catch {
    return { entryCssFiles: [] };
  }
}

function mergeStylesheetHrefs(...groups: (string[] | undefined)[]) {
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
  const stylesheetHrefs = mergeStylesheetHrefs(
    clientManifest.entryCssFiles,
    serverEntry.entryCssFiles,
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
      bootstrapScripts: serverEntry.entryJsFiles,
    });
  });
}

export function listPages() {
  return Object.keys(pages);
}

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept();
}

export const __NCR_HMR_PORT__ = ${JSON.stringify(hmrPort)};
`;
}

function createSsrEntry() {
  return `export { renderHTML } from './render-html';
`;
}

function createClientEntry({ runtimeImport, styleImports, hmrPort }) {
  return `${styleImports}
import { bootClient } from './client-boot';
import { connectHmr } from './hmr-bridge';
${runtimeImport ? `import { ClientRuntime } from ${JSON.stringify(runtimeImport)};` : 'const ClientRuntime = undefined;'}

connectHmr(${JSON.stringify(hmrPort)});

void bootClient({
  Runtime: ClientRuntime,
});
`;
}

function createHmrBridge(hmrPort) {
  return `type HmrMessage = { type: string };

export function connectHmr(port = ${hmrPort}) {
  if (typeof window === 'undefined') {
    return;
  }

  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.hostname;
  const url = \`\${protocol}://\${host}:\${port}\`;

  let socket: WebSocket | undefined;
  let retries = 0;

  const connect = () => {
    socket = new WebSocket(url);

    socket.addEventListener('open', () => {
      retries = 0;
    });

    socket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(String(event.data)) as HmrMessage;
        if (message.type === 'rsc-update') {
          window.dispatchEvent(new CustomEvent('ncr:rsc-update'));
        } else if (
          message.type === 'live-reload' ||
          message.type === 'client-reload'
        ) {
          window.location.reload();
        }
      } catch {
        // ignore malformed payloads
      }
    });

    socket.addEventListener('close', () => {
      retries += 1;
      const delay = Math.min(10_000, 500 * retries);
      window.setTimeout(connect, delay);
    });
  };

  connect();
}
`;
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
