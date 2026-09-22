import React from 'react';
import type { ReactFormState } from 'react-dom/client';
import { renderToReadableStream } from 'react-dom/server';
import { createFromReadableStream } from 'react-server-dom-rspack/client';
import { injectRSCPayload } from 'rsc-html-stream/server';
import type { RscPayload } from './handle-request';

export async function renderHTML(
  rscStream: ReadableStream<Uint8Array>,
  options: {
    bootstrapScripts?: string[];
    formState?: ReactFormState;
    nonce?: string;
  },
) {
  const [rscStream1, rscStream2] = rscStream.tee();

  let payload: Promise<RscPayload>;

  function SsrRoot() {
    payload ??= createFromReadableStream<RscPayload>(rscStream1);
    return React.use(payload).root;
  }

  let htmlStream: ReadableStream<Uint8Array>;
  let status: number | undefined;

  try {
    htmlStream = await renderToReadableStream(<SsrRoot />, {
      bootstrapScripts: options.bootstrapScripts,
      nonce: options.nonce,
      formState: options.formState,
    });
  } catch {
    status = 500;
    htmlStream = await renderToReadableStream(
      <html lang="en">
        <body>
          <noscript>Internal Server Error: SSR failed</noscript>
        </body>
      </html>,
      {
        nonce: options.nonce,
      },
    );
  }

  const responseStream = htmlStream.pipeThrough(
    injectRSCPayload(rscStream2, {
      nonce: options.nonce,
    }),
  );

  return { stream: responseStream, status };
}
