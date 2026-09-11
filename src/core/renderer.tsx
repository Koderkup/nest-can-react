import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ModuleRef } from '@nestjs/core';
import { createRenderState, runWithFrontendContext } from './context';

type ServerPage = () => React.ReactNode | Promise<React.ReactNode>;

export async function renderPage(Page: ServerPage, moduleRef: ModuleRef) {
  const renderState = createRenderState();

  const markup = await runWithFrontendContext(
    moduleRef,
    renderState,
    async () => {
      const page = await Page();
      return '<!DOCTYPE html>' + renderToStaticMarkup(page);
    },
  );

  return injectRuntime(markup, {
    transportPath: '/_nr',
    loads: Object.fromEntries(renderState.loadResults),
    islands: renderState.islands,
  });
}

function injectRuntime(markup: string, manifest: Record<string, unknown>) {
  const runtime = [
    `<script id="nr-manifest" type="application/json">${serializeJson(manifest)}</script>`,
    '<script type="module" src="/assets/nest-react/client.js"></script>',
  ].join('');

  if (markup.includes('</body>')) {
    return markup.replace('</body>', `${runtime}</body>`);
  }

  return markup + runtime;
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
