import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

export function createDevHmrHub() {
  const clients = new Set();
  const httpServer = createServer();
  const wss = new WebSocketServer({ server: httpServer });
  let buildId = '0';
  let pingTimer;

  function broadcast(message) {
    const payload = JSON.stringify(message);

    for (const client of clients) {
      if (client.readyState === 1) {
        client.send(payload);
      }
    }
  }

  function setBuildId(nextBuildId) {
    buildId = String(nextBuildId ?? Date.now());
    return buildId;
  }

  function getBuildId() {
    return buildId;
  }

  wss.on('connection', (socket) => {
    socket.isAlive = true;
    clients.add(socket);
    socket.send(JSON.stringify({ type: 'hello', buildId }));

    socket.on('pong', () => {
      socket.isAlive = true;
    });

    socket.on('close', () => {
      clients.delete(socket);
    });

    socket.on('error', () => {
      clients.delete(socket);
    });
  });

  pingTimer = setInterval(() => {
    for (const client of [...clients]) {
      if (client.isAlive === false) {
        client.terminate();
        clients.delete(client);
        continue;
      }

      client.isAlive = false;
      client.ping();
    }
  }, 20_000);

  pingTimer.unref?.();

  function listen(port) {
    return new Promise((resolve) => {
      httpServer.listen(port, resolve);
    });
  }

  function close() {
    clearInterval(pingTimer);

    for (const client of clients) {
      client.terminate();
    }

    clients.clear();
    wss.close();
    httpServer.close();
  }

  return {
    broadcast,
    close,
    getBuildId,
    listen,
    setBuildId,
    get size() {
      return clients.size;
    },
  };
}

export function formatStatsErrors(stats, fallback) {
  if (!stats) {
    return [{ message: fallback ?? 'Compilation failed.' }];
  }

  const json = stats.toJson({ errors: true, errorDetails: false });
  const errors = json.errors ?? [];

  if (errors.length === 0) {
    return [{ message: fallback ?? 'Compilation failed.' }];
  }

  return errors.map((error) => ({
    message: String(error.message ?? error)
      .replace(/\u001b\[[0-9;]*m/g, '')
      .slice(0, 4000),
  }));
}

export function createCompileGate({ hub, debounceMs = 120 }) {
  const compiling = {
    client: false,
    server: false,
  };
  let buildingSent = false;
  let lastServerHash;
  let lastNotifiedHash;
  let notifyTimer;
  let initial = true;
  let serverComponentDirty = false;
  let clientCompiledThisRound = false;
  let hadServerError = false;

  function invalid(which) {
    compiling[which] = true;

    if (which === 'client') {
      clientCompiledThisRound = true;
    }

    if (!buildingSent) {
      buildingSent = true;
      hub.broadcast({ type: 'building' });
    }
  }

  function markServerComponentChanged() {
    serverComponentDirty = true;
  }

  function scheduleNotify() {
    clearTimeout(notifyTimer);
    notifyTimer = setTimeout(flush, debounceMs);
  }

  function flush() {
    if (compiling.server || compiling.client) {
      return;
    }

    buildingSent = false;

    if (initial) {
      initial = false;
      lastNotifiedHash = lastServerHash;
      hub.setBuildId(lastServerHash ?? Date.now());
      serverComponentDirty = false;
      clientCompiledThisRound = false;
      return;
    }

    const buildId = hub.setBuildId(lastServerHash ?? Date.now());
    hub.broadcast({ type: 'build-ok', buildId });

    const hashChanged = lastServerHash !== lastNotifiedHash;
    const shouldRefetch =
      serverComponentDirty ||
      hadServerError ||
      (hashChanged && !clientCompiledThisRound);

    serverComponentDirty = false;
    clientCompiledThisRound = false;
    hadServerError = false;
    lastNotifiedHash = lastServerHash;

    if (!shouldRefetch) {
      return;
    }

    hub.broadcast({
      type: 'rsc-update',
      buildId,
      hash: lastServerHash,
    });

    const connected = hub.size;
    console.log(
      connected > 0
        ? `nest-can-react: RSC updated → ${connected} tab(s) (Flight refetch)`
        : 'nest-can-react: RSC updated (no tabs connected yet)',
    );
  }

  function done(which, { hash, errors = [] } = {}) {
    compiling[which] = false;

    if (which === 'server') {
      if (errors.length > 0) {
        buildingSent = false;
        hadServerError = true;
        hub.broadcast({
          type: 'build-error',
          errors: errors.map((error) => ({
            message: String(error.message ?? error).slice(0, 4000),
          })),
        });
        console.error('nest-can-react: server compile error');
        return;
      }

      lastServerHash = hash;
    }

    if (which === 'client' && errors.length > 0) {
      buildingSent = false;
      hub.broadcast({ type: 'build-ok', buildId: hub.getBuildId() });
      return;
    }

    scheduleNotify();
  }

  function notifyRscUpdate(reason) {
    const buildId = hub.getBuildId();
    hub.broadcast({
      type: 'rsc-update',
      buildId,
      hash: lastServerHash,
      reason,
    });
  }

  return {
    done,
    invalid,
    markServerComponentChanged,
    notifyRscUpdate,
  };
}
