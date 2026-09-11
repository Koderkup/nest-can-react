import React from 'react';
import {
  renderToPipeableStream,
  renderToStaticMarkup,
  renderToString,
} from 'react-dom/server';
import { ModuleRef } from '@nestjs/core';
import { Response } from 'express';
import { Transform } from 'node:stream';
import {
  FrontendRenderState,
  createRenderState,
  runWithFrontendContext,
} from './context';
import { getClientAssetManifest, getIslandAssetHints } from './client-assets';
import DefaultLayout from './default-layout';
import { getLayout } from './layout-registry';

type ServerPage = () => React.ReactNode | Promise<React.ReactNode>;

export type RenderMode = 'static' | 'hydrated' | 'streaming';

export type RenderPageOptions =
  | { mode?: 'static' }
  | { mode: 'hydrated' }
  | {
      mode: 'streaming';
      response: Response;
      statusCode?: number;
    };

export async function renderPage(
  Page: ServerPage,
  moduleRef: ModuleRef,
  options?:
    Extract<RenderPageOptions, { mode?: 'static' }> | { mode: 'hydrated' },
): Promise<string>;
export async function renderPage(
  Page: ServerPage,
  moduleRef: ModuleRef,
  options: Extract<RenderPageOptions, { mode: 'streaming' }>,
): Promise<void>;
export async function renderPage(
  Page: ServerPage,
  moduleRef: ModuleRef,
  options: RenderPageOptions = { mode: 'static' },
) {
  if (options.mode === 'streaming') {
    return renderStreamingPage(Page, moduleRef, options);
  }

  if (options.mode === 'hydrated') {
    return renderBufferedPage(Page, moduleRef, 'hydrated', renderToString);
  }

  return renderBufferedPage(Page, moduleRef, 'static', renderToStaticMarkup);
}

async function renderBufferedPage(
  Page: ServerPage,
  moduleRef: ModuleRef,
  mode: RenderMode,
  render: (node: React.ReactNode) => string,
) {
  const renderState = createRenderState();

  const markup = await runWithFrontendContext(
    moduleRef,
    renderState,
    async () => {
      const page = await Page();
      const Layout = getLayout() ?? DefaultLayout;
      return '<!DOCTYPE html>' + render(<Layout>{page}</Layout>);
    },
  );

  return injectRuntime(markup, createManifest(mode, renderState));
}

async function renderStreamingPage(
  Page: ServerPage,
  moduleRef: ModuleRef,
  options: Extract<RenderPageOptions, { mode: 'streaming' }>,
) {
  const renderState = createRenderState();

  await runWithFrontendContext(moduleRef, renderState, async () => {
    const page = await Page();
    const Layout = getLayout() ?? DefaultLayout;
    const documentTree = <Layout>{page}</Layout>;

    await new Promise<void>((resolve, reject) => {
      let didError = false;
      let stream: ReturnType<typeof renderToPipeableStream>;
      const transform = createRuntimeInjectionTransform(() =>
        createRuntimeParts(createManifest('streaming', renderState)),
      );

      transform.on('finish', resolve);
      transform.on('error', reject);
      transform.pipe(options.response);

      stream = renderToPipeableStream(documentTree, {
        onShellReady() {
          options.response.status(didError ? 500 : (options.statusCode ?? 200));
          options.response.setHeader('content-type', 'text/html');
          transform.write('<!DOCTYPE html>');
          stream.pipe(transform);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          didError = true;
          console.error(error);
        },
      });
    });
  });
}

function injectRuntime(markup: string, manifest: Record<string, unknown>) {
  return injectRuntimeHtml(markup, createRuntimeParts(manifest));
}

function injectRuntimeHtml(
  markup: string,
  parts: { documentAssets: string; moduleScript: string },
) {
  return injectRuntimeAssets(ensureDocumentSlots(markup), parts);
}

function injectRuntimeAssets(
  markup: string,
  parts: { documentAssets: string; moduleScript: string },
) {
  const bodyClose = markup.lastIndexOf('</body>');

  if (bodyClose === -1) {
    return `${markup}${parts.documentAssets}</div>${parts.moduleScript}`;
  }

  const beforeBodyClose = markup.slice(0, bodyClose);
  const afterBodyClose = markup.slice(bodyClose);
  const documentClose = beforeBodyClose.lastIndexOf('</div>');

  if (documentClose === -1) {
    return `${beforeBodyClose}${parts.documentAssets}</div>${parts.moduleScript}${afterBodyClose}`;
  }

  return `${beforeBodyClose.slice(0, documentClose)}${parts.documentAssets}${beforeBodyClose.slice(documentClose)}${parts.moduleScript}${afterBodyClose}`;
}

function ensureDocumentSlots(markup: string) {
  if (markup.includes('id="nr-document"')) {
    return markup;
  }

  return markup.replace(
    /<body([^>]*)>([\s\S]*)<\/body>/i,
    '<body$1><div id="nr-runtime"></div><div id="nr-document">$2</div></body>',
  );
}

function createRuntimeParts(manifest: Record<string, unknown>) {
  const clientAssets = getClientAssetManifest();
  const islandNames = getManifestIslandNames(manifest);
  const preloadAssets = [
    clientAssets.runtime,
    ...getIslandAssetHints(islandNames),
  ];

  return {
    documentAssets: [
      ...preloadAssets.map(
        (asset) =>
          `<link rel="modulepreload" href="${escapeHtmlAttribute(asset)}">`,
      ),
      `<script id="nr-manifest" type="application/json">${serializeJson(manifest)}</script>`,
    ].join(''),
    moduleScript: `<script type="module" src="${escapeHtmlAttribute(clientAssets.runtime)}"></script>`,
  };
}

function createManifest(mode: RenderMode, renderState: FrontendRenderState) {
  return {
    mode,
    transportPath: '/_nr',
    loads: Object.fromEntries(renderState.loadResults),
    islands: renderState.islands,
  };
}

function createRuntimeInjectionTransform(
  runtimeFactory: () => { documentAssets: string; moduleScript: string },
) {
  let pending = '';
  let tail = '';
  let insertedSlots = false;
  const tailSize = 2048;

  return new Transform({
    transform(chunk, _encoding, callback) {
      pending += chunk.toString();

      if (
        !insertedSlots &&
        !pending.includes('id="nr-document"') &&
        /<body[^>]*>/i.test(pending)
      ) {
        pending = pending.replace(
          /<body([^>]*)>/i,
          '<body$1><div id="nr-runtime"></div><div id="nr-document">',
        );
        insertedSlots = true;
      }

      if (!/<body[^>]*>/i.test(pending) && tail.length === 0) {
        callback();
        return;
      }

      tail += pending;
      pending = '';

      if (tail.length > tailSize) {
        this.push(tail.slice(0, -tailSize));
        tail = tail.slice(-tailSize);
      }

      callback();
    },
    flush(callback) {
      let markup = pending + tail;

      if (insertedSlots) {
        markup = markup.replace(/<\/body>/i, '</div></body>');
      }

      this.push(injectRuntimeAssets(markup, runtimeFactory()));
      callback();
    },
  });
}

function serializeJson(value: unknown) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (char) => {
    const escaped: Record<string, string> = {
      '<': '\\u003c',
      '>': '\\u003e',
      '&': '\\u0026',
      '\u2028': '\\u2028',
      '\u2029': '\\u2029',
    };

    return escaped[char];
  });
}

function getManifestIslandNames(manifest: Record<string, unknown>) {
  const islands = manifest.islands;

  if (!Array.isArray(islands)) {
    return [];
  }

  return [
    ...new Set(
      islands
        .map((island) =>
          typeof island === 'object' && island !== null && 'name' in island
            ? island.name
            : undefined,
        )
        .filter((name): name is string => typeof name === 'string'),
    ),
  ];
}

function escapeHtmlAttribute(value: string) {
  return value.replace(/[&"]/g, (char) => {
    const escaped: Record<string, string> = {
      '&': '&amp;',
      '"': '&quot;',
    };

    return escaped[char];
  });
}
