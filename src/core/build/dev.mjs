import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  collectChangedClientModules,
  watchNestReactClient,
} from './build-client.mjs';
import { classifyChange, toPosixPath } from './dev-classify.mjs';
import { broadcast, startProxy, waitFor, waitForPort } from './dev-proxy.mjs';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const publicPort = Number(process.env.PORT ?? 3000);
const nestPort = Number(process.env.NEST_REACT_NEST_PORT ?? publicPort + 1);
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
const server = startProxy(publicPort, nestPort);

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
  const kind = classifyChange(file, rootDir);

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

async function shutdown() {
  clearTimeout(serverReloadTimer);
  clearTimeout(graphDebounceTimer);
  nestProcess?.kill('SIGTERM');
  await client.dispose().catch(() => undefined);
  server.close();
  process.exit(0);
}
