import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { WebSocketServer } from 'ws';
import rspack from '@rspack/core';
import { RspackDevServer } from '@rspack/dev-server';
import { generateFlightEntries } from './codegen.mjs';
import { discoverPages } from './discover-pages.mjs';
import { loadConfig } from './load-config.mjs';
import { writeClientManifest } from './client-manifest.mjs';
import { createRspackConfigs } from './rspack-config.mjs';

const rootDir = process.cwd();
const config = await loadConfig(rootDir, {});
const pages = await discoverPages(config);
const entries = await generateFlightEntries({ config, pages });

const clients = new Set();

function broadcast(message) {
  const payload = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
}

const hmrHttp = createServer();
const wss = new WebSocketServer({ server: hmrHttp });

wss.on('connection', (socket) => {
  clients.add(socket);
  socket.on('close', () => clients.delete(socket));
});

await new Promise((resolve) => {
  hmrHttp.listen(config.hmrPort, resolve);
});

console.log(`nest-can-react: RSC refresh websocket on :${config.hmrPort}`);

const [clientConfig, serverConfig] = createRspackConfigs({
  config,
  entries,
  mode: 'development',
  clientDevServer: { port: config.clientDevPort },
});

const serverCompiler = rspack(serverConfig);
const clientCompiler = rspack(clientConfig);

let serverInitialCompileDone = false;

const waitForServer = new Promise((resolve, reject) => {
  serverCompiler.watch({ aggregateTimeout: 200 }, (error, stats) => {
    if (error) {
      if (!serverInitialCompileDone) {
        reject(error);
      }
      return;
    }

    if (stats?.hasErrors()) {
      console.error(stats.toString({ colors: true }));
      if (!serverInitialCompileDone) {
        reject(new Error('Server RSC compilation failed.'));
      }
      return;
    }

    if (stats) {
      console.log(stats.toString({ colors: true, preset: 'minimal' }));
    }

    if (serverInitialCompileDone) {
      broadcast({ type: 'rsc-update' });
    } else {
      serverInitialCompileDone = true;
      resolve();
    }
  });
});

clientCompiler.hooks.done.tap('nest-can-react-client-manifest', (stats) => {
  if (stats.hasErrors()) {
    console.error(stats.toString({ colors: true }));
    return;
  }

  void writeClientManifest(stats, config);
});

const devServer = new RspackDevServer(clientConfig.devServer, clientCompiler);

const waitForClient = devServer.start().then(() => {
  console.log(
    `nest-can-react: client Fast Refresh (Rspack HMR) on :${config.clientDevPort}`,
  );
});

await Promise.all([waitForServer, waitForClient]);

const nestBin = process.env.NEST_BIN ?? 'npx';
const nestArgs =
  process.env.NEST_ARGS?.split(/\s+/).filter(Boolean) ??
  ['nest', 'start', '--watch'];

const nest = spawn(nestBin, nestArgs, {
  cwd: rootDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    NEST_CAN_REACT_DEV: '1',
    NEST_CAN_REACT_HMR_PORT: String(config.hmrPort),
  },
  shell: process.platform === 'win32',
});

nest.on('exit', (code) => {
  process.exit(code ?? 0);
});

process.on('SIGINT', () => {
  nest.kill('SIGINT');
  void devServer.stop();
  hmrHttp.close();
  process.exit(0);
});
