import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  collectChangedClientModules,
  watchNestReactClient,
} from './build-client.mjs';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const publicPort = Number(process.env.PORT ?? 3000);
const nestPort = Number(process.env.NEST_REACT_NEST_PORT ?? publicPort + 1);
const sseClients = new Set();
let previousOutputFiles = new Set();
let seenFirstClientBuild = false;

let lastChange = 'none';
let forceFullReload = false;
let nestStartCount = 0;
let nestError = '';
let serverReloadTimer;
let graphDebounceTimer;
let nestProcess;

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

const client = await watchNestReactClient(
  { rootDir },
  {
    onRebuild({ manifest, metafile }) {
      const outputFiles = new Set(Object.keys(metafile.outputs ?? {}));
      const modules = collectChangedClientModules(
        metafile,
        previousOutputFiles,
        {
          outdir: resolve(rootDir, 'public/nest-react'),
          publicPath: manifest.publicPath,
          rootDir,
        },
      );
      previousOutputFiles = outputFiles;

      if (!seenFirstClientBuild) {
        seenFirstClientBuild = true;
        console.log('[nest-react] client rebuilt');
        return;
      }

      console.log('[nest-react] client rebuilt');
      broadcast({ type: 'clear-error' });

      if (lastChange === 'server') {
        return;
      }

      if (forceFullReload) {
        forceFullReload = false;
        lastChange = 'none';
        broadcast({ type: 'full-reload' });
        return;
      }

      console.log('[nest-react] Fast Refresh', modules);
      broadcast({
        type: 'client-update',
        css: manifest.css ?? [],
        islandCss: manifest.islandCss ?? {},
        modules,
      });
      lastChange = 'none';
    },
    onError(error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[nest-react] client build failed\n' + message);
      broadcast({ type: 'error', message });
    },
  },
);

nestProcess = startNest();
await waitForPort(nestPort);
const server = startProxy();

watchSourceFiles();
watchConfigFile();

console.log(`[nest-react] dev server http://localhost:${publicPort}`);

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function startNest() {
  const nestBin = resolve(rootDir, 'node_modules/.bin/nest');
  const child = spawn(nestBin, ['start', '--watch'], {
    cwd: rootDir,
    env: {
      ...process.env,
      PORT: String(nestPort),
      NODE_ENV: process.env.NODE_ENV ?? 'development',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => {
    const text = String(chunk);
    process.stdout.write(chunk);

    if (text.includes('successfully started')) {
      nestStartCount += 1;
      nestError = '';
      broadcast({ type: 'clear-error' });
    }
  });

  child.stderr.on('data', (chunk) => {
    const text = String(chunk);
    process.stderr.write(chunk);
    nestError += text;

    if (/error TS\d+|Found \d+ error/.test(nestError)) {
      broadcast({ type: 'error', message: nestError.trim() });
    }
  });

  child.on('exit', (code, signal) => {
    if (signal === 'SIGTERM' || signal === 'SIGINT' || code == null) {
      return;
    }

    console.error(`[nest-react] Nest exited with code ${code}`);
  });

  return child;
}

function startProxy() {
  const server = http.createServer((req, res) => {
    const path = (req.url ?? '/').split('?')[0];

    if (path === '/_nr/hmr') {
      attachSseClient(req, res);
      return;
    }

    proxyRequest(req, res);
  });

  server.listen(publicPort);
  return server;
}

function attachSseClient(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('\n');
  sseClients.add(res);

  const ping = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(ping);
      sseClients.delete(res);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(ping);
    sseClients.delete(res);
  });
}

function broadcast(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;

  for (const client of sseClients) {
    client.write(payload);
  }
}

function proxyRequest(req, res, retried = false) {
  const proxyReq = http.request(
    {
      hostname: '127.0.0.1',
      port: nestPort,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on('error', () => {
    if (!retried && req.method === 'GET' && !res.headersSent) {
      waitForPort(nestPort, 8000)
        .then(() => proxyRequest(req, res, true))
        .catch(sendProxyUnavailable);
      return;
    }

    sendProxyUnavailable();
  });

  req.pipe(proxyReq);

  function sendProxyUnavailable() {
    if (!res.headersSent) {
      res.writeHead(502, { 'content-type': 'text/plain' });
      res.end('Nest React dev proxy: server unavailable');
    }
  }
}

function watchSourceFiles() {
  watch(join(rootDir, 'src'), { recursive: true }, (event, filename) => {
    if (!filename) {
      return;
    }

    handleFileChange(join(rootDir, 'src', filename), event);
  });
}

function watchConfigFile() {
  watch(join(rootDir, 'nest.react.json'), () => {
    lastChange = 'server';
    forceFullReload = true;
    queueGraphRefresh();
    scheduleServerReload();
  });
}

function handleFileChange(file, event = 'change') {
  const kind = classifyChange(file);

  if (kind === 'ignore') {
    return;
  }

  if (kind === 'server') {
    lastChange = 'server';
    scheduleServerReload();
    return;
  }

  if (kind === 'client-protocol') {
    lastChange = 'server';
    forceFullReload = true;
    scheduleServerReload();
    return;
  }

  if (lastChange !== 'server') {
    lastChange = 'client';
  }

  if (event === 'rename' && /\.island\.[jt]sx$/.test(toPosixPath(file))) {
    queueGraphRefresh();
  }
}

function queueGraphRefresh() {
  clearTimeout(graphDebounceTimer);
  graphDebounceTimer = setTimeout(() => {
    void refreshIslandGraph();
  }, 200);
}

async function refreshIslandGraph() {
  try {
    const { graphChanged } = await client.regenerate();

    if (graphChanged) {
      lastChange = 'server';
      forceFullReload = true;
      scheduleServerReload();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[nest-react] island graph update failed\n' + message);
    broadcast({ type: 'error', message });
  }
}

function scheduleServerReload() {
  clearTimeout(serverReloadTimer);
  const generation = nestStartCount;
  serverReloadTimer = setTimeout(async () => {
    try {
      await waitFor(() => nestStartCount > generation, 20000);
      await waitForPort(nestPort);
      broadcast({ type: 'clear-error' });
      broadcast({ type: 'server-reload' });
      lastChange = 'none';
      forceFullReload = false;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      broadcast({
        type: 'error',
        message: nestError.trim() || message,
      });
    }
  }, 400);
}

function classifyChange(file) {
  const path = toPosixPath(relative(rootDir, file));

  if (
    path.includes('/node_modules/') ||
    path.includes('/dist/') ||
    path.includes('/public/') ||
    path.includes('/.nest-react/') ||
    path.includes('/.git/') ||
    path.includes('/src/core/build/') ||
    /\.d\.ts$/.test(path) ||
    /\.map$/.test(path)
  ) {
    return 'ignore';
  }

  if (
    /\/src\/core\/client\/(mount|navigation|runtime|hmr|refresh-runtime)\.[jt]sx?$/.test(
      path,
    )
  ) {
    return 'client-protocol';
  }

  if (path.includes('/src/core/client/')) {
    return 'client';
  }

  if (/\.island\.[jt]sx$/.test(path)) {
    return 'client';
  }

  if (
    /app\.runtime\.[jt]sx$/.test(path) ||
    /\/context\/.*\.[jt]sx$/.test(path)
  ) {
    return 'client';
  }

  if (/\.(css|module\.css)$/.test(path)) {
    return 'client';
  }

  if (
    /\.(png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|eot)$/.test(path) &&
    path.startsWith('src/')
  ) {
    return 'client';
  }

  if (/\.page\.[jt]sx$/.test(path) || /(?:^|\/)layout\.[jt]sx$/.test(path)) {
    return 'server';
  }

  if (path.startsWith('src/core/')) {
    return 'server';
  }

  if (
    /\.(controller|module|service|filter|guard|interceptor|pipe)\.[jt]s$/.test(
      path,
    )
  ) {
    return 'server';
  }

  if (path.startsWith('src/') && /\.[jt]sx?$/.test(path)) {
    return 'server';
  }

  return 'ignore';
}

function waitForPort(port, timeoutMs = 20000) {
  const start = Date.now();

  return new Promise((resolveWait, reject) => {
    const attempt = () => {
      const socket = net.connect({ port, host: '127.0.0.1' }, () => {
        socket.end();
        resolveWait();
      });

      socket.on('error', () => {
        socket.destroy();

        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timed out waiting for port ${port}`));
          return;
        }

        setTimeout(attempt, 120);
      });
    };

    attempt();
  });
}

function waitFor(predicate, timeoutMs) {
  const start = Date.now();

  return new Promise((resolveWait, reject) => {
    const attempt = () => {
      if (predicate()) {
        resolveWait();
        return;
      }

      if (Date.now() - start > timeoutMs) {
        reject(new Error('Timed out waiting for Nest restart'));
        return;
      }

      setTimeout(attempt, 100);
    };

    attempt();
  });
}

function toPosixPath(path) {
  return path.split(sep).join('/');
}

async function shutdown() {
  clearTimeout(serverReloadTimer);
  clearTimeout(graphDebounceTimer);
  nestProcess?.kill('SIGTERM');
  await client.dispose().catch(() => undefined);
  server.close();
  process.exit(0);
}
