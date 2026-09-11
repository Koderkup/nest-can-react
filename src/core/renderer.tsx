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
      return '<!DOCTYPE html>' + render(page);
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

    await new Promise<void>((resolve, reject) => {
      let didError = false;
      let stream: ReturnType<typeof renderToPipeableStream>;
      const transform = createRuntimeInjectionTransform(() =>
        createRuntimeHtml(createManifest('streaming', renderState)),
      );

      transform.on('finish', resolve);
      transform.on('error', reject);
      transform.pipe(options.response);

      stream = renderToPipeableStream(page, {
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
  return injectRuntimeHtml(markup, createRuntimeHtml(manifest));
}

function injectRuntimeHtml(markup: string, runtime: string) {
  if (markup.includes('</body>')) {
    return markup.replace('</body>', `${runtime}</body>`);
  }

  return markup + runtime;
}

function createRuntimeHtml(manifest: Record<string, unknown>) {
  return [
    `<script id="nr-manifest" type="application/json">${serializeJson(manifest)}</script>`,
    '<script type="module" src="/assets/nest-react/client.js"></script>',
  ].join('');
}

function createManifest(mode: RenderMode, renderState: FrontendRenderState) {
  return {
    mode,
    transportPath: '/_nr',
    loads: Object.fromEntries(renderState.loadResults),
    islands: renderState.islands,
  };
}

function createRuntimeInjectionTransform(runtimeFactory: () => string) {
  let tail = '';
  const tailSize = 1024;

  return new Transform({
    transform(chunk, _encoding, callback) {
      tail += chunk.toString();

      if (tail.length > tailSize) {
        this.push(tail.slice(0, -tailSize));
        tail = tail.slice(-tailSize);
      }

      callback();
    },
    flush(callback) {
      this.push(injectRuntimeHtml(tail, runtimeFactory()));
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
