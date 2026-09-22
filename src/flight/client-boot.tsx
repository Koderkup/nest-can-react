import React, {
  ComponentType,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import {
  createFromFetch,
  createFromReadableStream,
} from 'react-server-dom-rspack/client.browser';
import { rscStream } from 'rsc-html-stream/client';
import type { RscPayload } from './handle-request';
import { createRscRenderRequest } from './request';
import { guardedFullReload, hideDevOverlay, showDevOverlay } from './dev-overlay';

type BootOptions = {
  Runtime?: ComponentType<{ children: ReactNode }>;
};

let refetchGeneration = 0;
let inflightAbort: AbortController | undefined;
let hadRuntimeError = false;

export async function bootClient({ Runtime }: BootOptions = {}) {
  const initialPayload = await createFromReadableStream<RscPayload>(rscStream);
  installRuntimeErrorTracking();
  installFastRefreshFallback();

  function BrowserRoot() {
    const [payload, setPayloadState] = useState(initialPayload);

    const applyPayload = useCallback((value: RscPayload) => {
      React.startTransition(() => {
        setPayloadState(value);
      });
    }, []);

    const fetchRscPayload = useCallback(
      async (options?: { navigation?: boolean }) => {
        await runRscRefetch({
          applyPayload,
          navigation: options?.navigation === true,
        });
      },
      [applyPayload],
    );

    useEffect(() => {
      return listenNavigation(() => {
        void fetchRscPayload({ navigation: true });
      });
    }, [fetchRscPayload]);

    useEffect(() => {
      const onRscUpdate = () => {
        if (hadRuntimeError) {
          guardedFullReload('runtime error recovery');
          return;
        }

        void fetchRscPayload();
      };

      window.addEventListener('ncr:rsc-update', onRscUpdate);
      return () => window.removeEventListener('ncr:rsc-update', onRscUpdate);
    }, [fetchRscPayload]);

    const tree = payload.root;
    return Runtime ? <Runtime>{tree}</Runtime> : tree;
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

async function runRscRefetch({
  applyPayload,
  navigation,
}: {
  applyPayload: (value: RscPayload) => void;
  navigation: boolean;
}) {
  inflightAbort?.abort();
  const abort = new AbortController();
  inflightAbort = abort;
  const generation = ++refetchGeneration;

  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      if (attempt === 0 && !navigation) {
        await waitForWebpackIdle();
      }

      const renderRequest = createRscRenderRequest(window.location.href);
      const responsePromise = fetch(renderRequest, { signal: abort.signal });
      const response = await responsePromise;

      if (!response.ok) {
        throw new Error(`RSC refetch failed (${response.status}).`);
      }

      const nextPayload = await createFromFetch<RscPayload>(responsePromise);

      if (generation !== refetchGeneration) {
        return;
      }

      applyPayload(nextPayload);
      hideDevOverlay();
      notifyRefreshDone();
      if (!navigation) {
        console.info('[nest-can-react] RSC update applied');
      }
      return;
    } catch (error) {
      if (abort.signal.aborted || isAbortError(error)) {
        return;
      }

      lastError = error;

      if (attempt < 2) {
        await delay(120 * (attempt + 1));
      }
    }
  }

  notifyRefreshDone();

  const message =
    lastError instanceof Error ? lastError.message : 'RSC refetch failed.';

  if (navigation) {
    guardedFullReload('navigation refetch failed');
    return;
  }

  showDevOverlay('RSC update failed', message);
  console.warn(`[nest-can-react] ${message}`);
}

function notifyRefreshDone() {
  window.dispatchEvent(new CustomEvent('ncr:rsc-refresh-done'));
}

function installRuntimeErrorTracking() {
  window.addEventListener('error', (event) => {
    if (event.error) {
      hadRuntimeError = true;
    }
  });

  window.addEventListener('unhandledrejection', () => {
    hadRuntimeError = true;
  });
}

function installFastRefreshFallback() {
  const webpackHot = import.meta.webpackHot;

  if (!webpackHot?.addStatusHandler) {
    return;
  }

  let sawHotUpdate = false;

  webpackHot.addStatusHandler((status) => {
    if (status === 'fail' || status === 'abort') {
      sawHotUpdate = false;
      guardedFullReload(`HMR ${status}`);
      return;
    }

    if (status === 'idle') {
      if (sawHotUpdate && hadRuntimeError) {
        sawHotUpdate = false;
        guardedFullReload('runtime error recovery');
        return;
      }

      sawHotUpdate = false;
      return;
    }

    sawHotUpdate = true;
  });
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

function isAbortError(error: unknown) {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
  );
}

function waitForWebpackIdle(timeoutMs = 400) {
  return new Promise<void>((resolve) => {
    const webpackHot = import.meta.webpackHot;
    const status =
      typeof webpackHot?.status === 'function' ? webpackHot.status() : 'idle';

    if (!webpackHot?.addStatusHandler || status === 'idle') {
      resolve();
      return;
    }

    const timer = window.setTimeout(finish, timeoutMs);

    function finish() {
      window.clearTimeout(timer);
      webpackHot?.removeStatusHandler?.(onStatus);
      resolve();
    }

    function onStatus(next: string) {
      if (next === 'idle' || next === 'fail' || next === 'abort') {
        finish();
      }
    }

    webpackHot.addStatusHandler(onStatus);
  });
}

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

declare global {
  interface ImportMeta {
    webpackHot?: {
      accept: (cb?: () => void) => void;
      addStatusHandler?: (cb: (status: string) => void) => void;
      removeStatusHandler?: (cb: (status: string) => void) => void;
      dispose?: (cb: (data: unknown) => void) => void;
      status?: () => string;
    };
  }
}
