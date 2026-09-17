import React, {
  ComponentType,
  isValidElement,
  ReactElement,
  ReactNode,
} from 'react';
import {
  renderToPipeableStream,
  renderToStaticMarkup,
  renderToString,
} from 'react-dom/server';
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
  page: ReactElement,
  options?: Extract<RenderPageOptions, { mode?: 'static' }> | { mode: 'hydrated' },
): Promise<string>;
export async function renderPage(
  page: ReactElement,
  options: Extract<RenderPageOptions, { mode: 'streaming' }>,
): Promise<void>;
export async function renderPage<P extends object>(
  Page: ComponentType<P>,
  props: P,
  options?: Extract<RenderPageOptions, { mode?: 'static' }> | { mode: 'hydrated' },
): Promise<string>;
export async function renderPage<P extends object>(
  Page: ComponentType<P>,
  props: P,
  options: Extract<RenderPageOptions, { mode: 'streaming' }>,
): Promise<void>;
export async function renderPage(
  pageOrType: ReactElement | ComponentType<any>,
  propsOrOptions?: object,
  maybeOptions?: RenderPageOptions,
) {
  const options = resolveOptions(pageOrType, propsOrOptions, maybeOptions);

  if (options.mode === 'streaming') {
    return renderStreamingPage(pageOrType, propsOrOptions, options);
  }

  if (options.mode === 'hydrated') {
    return renderBufferedPage(
      pageOrType,
      propsOrOptions,
      'hydrated',
      renderToString,
    );
  }

  return renderBufferedPage(
    pageOrType,
    propsOrOptions,
    'static',
    renderToStaticMarkup,
  );
}

function resolveOptions(
  pageOrType: ReactElement | ComponentType<any>,
  propsOrOptions?: object,
  maybeOptions?: RenderPageOptions,
): RenderPageOptions {
  if (isValidElement(pageOrType)) {
    return (propsOrOptions as RenderPageOptions | undefined) ?? { mode: 'static' };
  }

  return maybeOptions ?? { mode: 'static' };
}

function resolvePageNode(
  pageOrType: ReactElement | ComponentType<any>,
  propsOrOptions?: object,
): ReactNode {
  if (isValidElement(pageOrType)) {
    return invokePageType(pageOrType.type, pageOrType.props as object);
  }

  return invokePageType(pageOrType, propsOrOptions ?? {});
}

function invokePageType(type: unknown, props: object): ReactNode {
  if (typeof type !== 'function') {
    throw new Error(
      'renderPage expected a function component or <Page {...props} />.',
    );
  }

  return (type as (props: object) => ReactNode)(props);
}

async function renderBufferedPage(
  pageOrType: ReactElement | ComponentType<any>,
  propsOrOptions: object | undefined,
  mode: RenderMode,
  render: (node: ReactNode) => string,
) {
  const renderState = createRenderState();

  try {
    const markup = await runWithFrontendContext(renderState, () => {
      const page = resolvePageNode(pageOrType, propsOrOptions);
      const Layout = getLayout() ?? DefaultLayout;
      return '<!DOCTYPE html>' + render(<Layout>{page}</Layout>);
    });

    return injectRuntime(markup, createManifest(mode, renderState));
  } catch (error) {
    rethrowIfClientHookError(error);
  }
}

async function renderStreamingPage(
  pageOrType: ReactElement | ComponentType<any>,
  propsOrOptions: object | undefined,
  options: Extract<RenderPageOptions, { mode: 'streaming' }>,
) {
  const renderState = createRenderState();

  try {
    await runWithFrontendContext(renderState, async () => {
      const page = resolvePageNode(pageOrType, propsOrOptions);
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
