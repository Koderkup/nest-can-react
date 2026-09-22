import {
  guardedFullReload,
  hideBuildingIndicator,
  hideDevOverlay,
  showBuildingIndicator,
  showDevOverlay,
} from './dev-overlay';

export type DevHmrMessage = {
  type: string;
  buildId?: string | number;
  hash?: string;
  reason?: string;
  errors?: Array<{ message: string }>;
};

const HMR_PATH = '/__nest_can_react/hmr';

export function connectNestCanReactDevHmr() {
  if (typeof window === 'undefined') {
    return;
  }

  if (process.env.NODE_ENV === 'production') {
    return;
  }

  let retries = 0;
  let socket: WebSocket | undefined;
  let retryTimer: number | undefined;
  let lastBuildId: string | undefined;
  let seenHello = false;
  let didDisconnect = false;
  let disposed = false;

  const connect = () => {
    if (disposed) {
      return;
    }

    if (retryTimer != null) {
      window.clearTimeout(retryTimer);
      retryTimer = undefined;
    }

    if (socket) {
      socket.onopen = null;
      socket.onclose = null;
      socket.onerror = null;
      socket.onmessage = null;

      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close();
      }
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}${HMR_PATH}`;
    socket = new WebSocket(url);

    socket.addEventListener('open', () => {
      retries = 0;
    });

    socket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(String(event.data)) as DevHmrMessage;
        handleMessage(message);
      } catch {
        // ignore malformed payloads
      }
    });

    socket.addEventListener('close', () => {
      didDisconnect = true;
      scheduleReconnect();
    });
  };

  const handleMessage = (message: DevHmrMessage) => {
    switch (message.type) {
      case 'ping':
        return;
      case 'hello': {
        const nextBuildId =
          message.buildId == null ? undefined : String(message.buildId);
        const missed =
          seenHello &&
          nextBuildId != null &&
          lastBuildId != null &&
          nextBuildId !== lastBuildId;
        const nestMaybeRestarted = didDisconnect && seenHello;

        lastBuildId = nextBuildId ?? lastBuildId;
        seenHello = true;
        didDisconnect = false;

        if (missed || nestMaybeRestarted) {
          dispatchRscUpdate(nextBuildId);
        }
        return;
      }
      case 'building':
        showBuildingIndicator();
        window.dispatchEvent(new CustomEvent('ncr:building'));
        return;
      case 'build-error': {
        hideBuildingIndicator();
        const body =
          message.errors?.map((error) => error.message).join('\n\n') ??
          'Compilation failed.';
        showDevOverlay('Server compile error', body);
        window.dispatchEvent(
          new CustomEvent('ncr:build-error', { detail: message.errors }),
        );
        return;
      }
      case 'build-ok':
        hideBuildingIndicator();
        hideDevOverlay();
        if (message.buildId != null) {
          lastBuildId = String(message.buildId);
        }
        window.dispatchEvent(new CustomEvent('ncr:build-ok'));
        return;
      case 'rsc-update':
        hideBuildingIndicator();
        hideDevOverlay();
        if (message.buildId != null) {
          lastBuildId = String(message.buildId);
        }
        dispatchRscUpdate(message.buildId);
        return;
      case 'reload':
        guardedFullReload(message.reason ?? 'server requested reload');
        return;
      default:
        return;
    }
  };

  const scheduleReconnect = () => {
    if (disposed) {
      return;
    }

    retries += 1;
    const delay = Math.min(10_000, 500 * retries);
    retryTimer = window.setTimeout(connect, delay);
  };

  const reconnectNow = () => {
    if (disposed) {
      return;
    }

    if (socket?.readyState === WebSocket.OPEN) {
      return;
    }

    retries = 0;
    connect();
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      reconnectNow();
    }
  };

  const onPageHide = () => {
    disposed = true;

    if (retryTimer != null) {
      window.clearTimeout(retryTimer);
    }

    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('online', reconnectNow);
    window.removeEventListener('pagehide', onPageHide);
    socket?.close();
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('online', reconnectNow);
  window.addEventListener('pagehide', onPageHide);

  connect();
}

function dispatchRscUpdate(buildId?: string | number) {
  window.dispatchEvent(
    new CustomEvent('ncr:rsc-update', {
      detail: buildId == null ? undefined : { buildId },
    }),
  );
}

export { guardedFullReload };
