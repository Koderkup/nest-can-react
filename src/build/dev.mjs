import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { WebSocketServer } from 'ws';
import rspack from '@rspack/core';
import { generateFlightEntries } from './codegen.mjs';
import { discoverPages } from './discover-pages.mjs';
import { loadConfig } from './load-config.mjs';
import { createRspackConfigs } from './rspack-config.mjs';

const rootDir = process.cwd();
const config = await loadConfig(rootDir, {});
const pages = await discoverPages(config);
const entries = await generateFlightEntries({ config, pages });

const clients = new Set();

function broadcastRscUpdate() {
  const payload = JSON.stringify({ type: 'rsc-update' });
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

console.log(`nest-can-react: RSC HMR websocket on :${config.hmrPort}`);

const configs = createRspackConfigs({
  config,
  entries,
  mode: 'development',
  onServerComponentChanges() {
    broadcastRscUpdate();
  },
});

const compiler = rspack(configs);

await new Promise((resolve, reject) => {
  compiler.watch({ aggregateTimeout: 200 }, (error, stats) => {
    if (error) {
      reject(error);
      return;
    }

    if (stats?.hasErrors()) {
      console.error(stats.toString({ colors: true }));
    } else if (stats) {
      console.log(stats.toString({ colors: true, preset: 'minimal' }));
    }

    resolve();
  });
});

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
  hmrHttp.close();
  process.exit(0);
});
