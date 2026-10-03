import { spawn } from 'node:child_process';
import rspack from '@rspack/core';
import { RspackDevServer } from '@rspack/dev-server';
import { generateFlightEntries } from './codegen.mjs';
import { discoverPages } from './discover-pages.mjs';
import { loadConfig } from './load-config.mjs';
import { writeClientManifest } from './client-manifest.mjs';
import { createRspackConfigs } from './rspack-config.mjs';
import { syncServerAssetsToClientOut } from './sync-server-assets.mjs';
import { createDevWatchers } from './dev-watch.mjs';
import {
  createCompileGate,
  createDevHmrHub,
  formatStatsErrors,
} from './dev-hmr-hub.mjs';

const rootDir = process.cwd();
let config = await loadConfig(rootDir, {});
let pages = await discoverPages(config);
const entries = await generateFlightEntries({ config, pages });

const hub = createDevHmrHub();
const gate = createCompileGate({ hub });

await hub.listen(config.hmrPort);
console.log(
  `nest-can-react: internal RSC HMR hub on :${config.hmrPort} (browser uses /__nest_can_react/hmr on Nest port)`,
);

const [clientConfig, serverConfig] = createRspackConfigs({
  config,
  entries,
  mode: 'development',
  clientDevServer: { port: config.clientDevPort },
  onServerComponentChanges: () => {
    gate.markServerComponentChanged();
  },
});

const serverCompiler = rspack(serverConfig);
const clientCompiler = rspack(clientConfig);

let serverInitialCompileDone = false;
let clientInitialCompileDone = false;

serverCompiler.hooks.invalid.tap('nest-can-react-hmr', () => {
  gate.invalid('server');
});

clientCompiler.hooks.invalid.tap('nest-can-react-hmr', () => {
  gate.invalid('client');
});

const waitForServer = new Promise((resolve, reject) => {
  serverCompiler.watch({ aggregateTimeout: 200 }, (error, stats) => {
    if (error) {
      const errors = [{ message: error.stack ?? error.message }];
      gate.done('server', { errors });

      if (!serverInitialCompileDone) {
        reject(error);
      }
      return;
    }

    if (stats?.hasErrors()) {
      console.error(stats.toString({ colors: true }));
      gate.done('server', {
        errors: formatStatsErrors(stats, 'Server RSC compilation failed.'),
      });

      if (!serverInitialCompileDone) {
        reject(new Error('Server RSC compilation failed.'));
      }
      return;
    }

    if (stats) {
      console.log(stats.toString({ colors: true, preset: 'minimal' }));
    }

    void syncServerAssetsToClientOut(config.serverOutDir, config.outDir);

    gate.done('server', { hash: stats?.hash });

    if (!serverInitialCompileDone) {
      serverInitialCompileDone = true;
      resolve();
    }
  });
});

clientCompiler.hooks.done.tap('nest-can-react-client-manifest', (stats) => {
  if (stats.hasErrors()) {
    console.error(stats.toString({ colors: true }));
    gate.done('client', {
      errors: formatStatsErrors(stats, 'Client compilation failed.'),
    });
    return;
  }

  void writeClientManifest(stats, config);
  gate.done('client', { hash: stats.hash });

  if (clientInitialCompileDone) {
    console.log('nest-can-react: client updated (Rspack Fast Refresh)');
  } else {
    clientInitialCompileDone = true;
  }
});

const devServer = new RspackDevServer(clientConfig.devServer, clientCompiler);

const waitForClient = devServer.start().then(() => {
  console.log(
    `nest-can-react: client compiler on http://127.0.0.1:${config.clientDevPort} (browser WS /__nest_can_react/rspack-hmr)`,
  );
});

await Promise.all([waitForServer, waitForClient]);

const watchers = createDevWatchers({
  config,
  onPagesChanged: () => regeneratePages(),
  onConfigChanged: () => reloadConfigAndRegenerate(),
});

const nestBin = process.env.NEST_BIN ?? 'npx';
const nestArgs =
  process.env.NEST_ARGS?.split(/\s+/).filter(Boolean) ??
  ['nest', 'start', '--watch'];

const nest = spawn(nestBin, nestArgs, {
  cwd: rootDir,
  stdio: ['inherit', 'pipe', 'inherit'],
  env: {
    ...process.env,
    NEST_CAN_REACT_DEV: '1',
    NEST_CAN_REACT_HMR_PORT: String(config.hmrPort),
    NEST_CAN_REACT_CLIENT_DEV_PORT: String(config.clientDevPort),
    NEST_CAN_REACT_PUBLIC_PATH: config.publicPath,
  },
  shell: process.platform === 'win32',
});

let nestReady = false;

nest.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  const text = String(chunk);

  if (!/successfully started/i.test(text)) {
    return;
  }

  if (!nestReady) {
    nestReady = true;
    return;
  }

  console.log('nest-can-react: Nest restarted → Flight refetch');
  setTimeout(() => {
    gate.notifyRscUpdate('nest-restart');
  }, 250);
});

nest.on('exit', (code) => {
  process.exit(code ?? 0);
});

process.on('SIGINT', () => {
  nest.kill('SIGINT');
  void devServer.stop();
  watchers.dispose();
  hub.close();
  process.exit(0);
});

/**
 * Reload the config file so `pages.include`, `styles`, and `layout` changes
 * take effect. Rspack already watches the generated entry, so codegen is
 * enough; only compiler-level options (ports, outDir) need a restart.
 */
async function reloadConfigAndRegenerate() {
  const next = await loadConfig(rootDir, {});

  if (
    next.outDir !== config.outDir ||
    next.serverOutDir !== config.serverOutDir ||
    next.publicPath !== config.publicPath ||
    next.hmrPort !== config.hmrPort ||
    next.clientDevPort !== config.clientDevPort
  ) {
    console.log(
      'nest-can-react: config changed — restart dev to apply compiler options',
    );
  }

  config = next;
  await regeneratePages();
  watchers.reconfigure(config);
}

/**
 * Re-run discovery and codegen when the page set changed. Rspack already
 * watches the generated entry, so rewriting it is enough to rebuild the RSC
 * bundle; no compiler restart is needed.
 */
async function regeneratePages() {
  const nextPages = await discoverPages(config);
  const previous = pages.map((page) => page.file).sort().join('|');
  const next = nextPages.map((page) => page.file).sort().join('|');

  if (previous === next) {
    return;
  }

  pages = nextPages;
  await generateFlightEntries({ config, pages });
  console.log(
    `nest-can-react: pages changed (${pages.length}) — regenerated entries`,
  );
}
