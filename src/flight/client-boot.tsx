import React, { ComponentType, ReactNode, useEffect, useState } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import {
  createFromFetch,
  createFromReadableStream,
} from 'react-server-dom-rspack/client.browser';
import { rscStream } from 'rsc-html-stream/client';
import type { RscPayload } from './handle-request';
import { createRscRenderRequest } from './request';

type BootOptions = {
  Runtime?: ComponentType<{ children: ReactNode }>;
};

export async function bootClient({ Runtime }: BootOptions = {}) {
  let setPayload: ((value: RscPayload) => void) | undefined;

  const initialPayload = await createFromReadableStream<RscPayload>(rscStream);

  function BrowserRoot() {
    const [payload, setPayloadState] = useState(initialPayload);

    useEffect(() => {
      setPayload = (value) => {
        React.startTransition(() => {
          setPayloadState(value);
        });
      };
    }, []);

    useEffect(() => {
      return listenNavigation(() => {
        void fetchRscPayload();
      });
    }, []);

    useEffect(() => {
      const onRscUpdate = () => {
        void fetchRscPayload();
      };
      window.addEventListener('ncr:rsc-update', onRscUpdate);
      return () => window.removeEventListener('ncr:rsc-update', onRscUpdate);
    }, []);

    const tree = payload.root;
    return Runtime ? <Runtime>{tree}</Runtime> : tree;
  }

  async function fetchRscPayload() {
    const renderRequest = createRscRenderRequest(window.location.href);
    const payload = await createFromFetch<RscPayload>(fetch(renderRequest));
    setPayload?.(payload);
  }

  const browserRoot = (
    <React.StrictMode>
      <BrowserRoot />
    </React.StrictMode>
  );

  if (document.documentElement.dataset.ncrHydrate === '0') {
    createRoot(document).render(browserRoot);
  } else {
    hydrateRoot(document, browserRoot, {
      formState: initialPayload.formState,
    });
  }

  if (import.meta.webpackHot) {
    import.meta.webpackHot.accept();
  }
}

function listenNavigation(onNavigation: () => void) {
  window.addEventListener('popstate', onNavigation);

  const oldPushState = window.history.pushState.bind(window.history);
  const oldReplaceState = window.history.replaceState.bind(window.history);

  window.history.pushState = function (...args) {
    const result = oldPushState(...args);
    onNavigation();
    return result;
  };

  window.history.replaceState = function (...args) {
    const result = oldReplaceState(...args);
    onNavigation();
    return result;
  };

  function onClick(event: MouseEvent) {
    const link = (event.target as Element | null)?.closest?.('a');

    if (
      link &&
      link instanceof HTMLAnchorElement &&
      link.href &&
      (!link.target || link.target === '_self') &&
      link.origin === location.origin &&
      !link.hasAttribute('download') &&
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.shiftKey &&
      !event.defaultPrevented
    ) {
      event.preventDefault();
      history.pushState(null, '', link.href);
    }
  }

  document.addEventListener('click', onClick);

  return () => {
    document.removeEventListener('click', onClick);
    window.removeEventListener('popstate', onNavigation);
    window.history.pushState = oldPushState;
    window.history.replaceState = oldReplaceState;
  };
}

declare global {
  interface ImportMeta {
    webpackHot?: {
      accept: (cb?: () => void) => void;
      on: (event: string, cb: () => void) => void;
    };
  }
}
