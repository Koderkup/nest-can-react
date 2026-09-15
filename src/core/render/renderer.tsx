import React from 'react';
import {
  renderToPipeableStream,
  renderToStaticMarkup,
  renderToString,
} from 'react-dom/server';
import { ModuleRef } from '@nestjs/core';
import { Response } from 'express';
import { createRenderState, runWithFrontendContext } from '../data/context';
import DefaultLayout from './default-layout';
import {
  ClientHookOnServerError,
  isClientHookError,
  rethrowIfClientHookError,
  sendClientHookErrorResponse,
  toClientHookOnServerError,
} from '../errors/dev-hook-error';
import { getLayout } from './layout-registry';
import {
  createRuntimeInjectionTransform,
  injectRuntime,
} from './runtime-html';
import { createManifest, createRuntimeParts } from './runtime-parts';

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

  try {
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
  } catch (error) {
    rethrowIfClientHookError(error);
  }
}

async function renderStreamingPage(
  Page: ServerPage,
  moduleRef: ModuleRef,
  options: Extract<RenderPageOptions, { mode: 'streaming' }>,
) {
  const renderState = createRenderState();

  try {
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
            options.response.status(
              didError ? 500 : (options.statusCode ?? 200),
            );
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
  } catch (error) {
    if (
      error instanceof ClientHookOnServerError ||
      isClientHookError(error)
    ) {
      sendClientHookErrorResponse(
        options.response,
        toClientHookOnServerError(error),
      );
      return;
    }

    throw error;
  }
}
