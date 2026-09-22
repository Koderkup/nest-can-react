import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { experiments } from '@rspack/core';
import ReactRefreshPlugin from '@rspack/plugin-react-refresh';

const { createPlugins, Layers } = experiments.rsc;

export function createRspackConfigs({
  config,
  entries,
  mode = 'production',
  onServerComponentChanges,
  clientDevServer,
}) {
  const { ServerPlugin, ClientPlugin } = createPlugins();
  const isDev = mode === 'development';
  const publicPath = `${config.publicPath}/`;

  function createRscRule({ refresh }) {
    return {
      test: /\.(?:js|mjs|cjs|jsx|ts|tsx)$/,
      exclude:
        /node_modules[\\/](?!nest-can-react|rsc-html-stream|react-server-dom-rspack)/,
      use: {
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: {
              syntax: 'typescript',
              tsx: true,
              decorators: true,
            },
            transform: {
              react: {
                runtime: 'automatic',
                development: isDev,
                refresh,
              },
              legacyDecorator: true,
              decoratorMetadata: true,
            },
          },
          rspackExperiments: {
            reactServerComponents: true,
          },
        },
      },
    };
  }

  // React Refresh globals exist only in the client bundle.
  const clientRscRule = createRscRule({ refresh: isDev });
  const serverRscRule = createRscRule({ refresh: false });

  const assetRule = {
    test: /\.(png|jpe?g|gif|svg|webp|woff2?|ttf|eot)$/i,
    type: 'asset',
    parser: {
      dataUrlCondition: {
        maxSize: 8 * 1024,
      },
    },
  };

  const cssRule = {
    test: /\.css$/,
    type: 'css',
  };

  const clientDevHost = clientDevServer?.host ?? '127.0.0.1';
  const clientDevPort = clientDevServer?.port;

  const clientConfig = {
    name: 'client',
    mode,
    target: 'web',
    entry: {
      main: {
        import: [entries.clientEntry],
      },
    },
    output: {
      path: config.outDir,
      publicPath,
      filename: isDev ? '[name].js' : '[name].[contenthash:8].js',
      chunkFilename: isDev ? '[name].js' : '[name].[contenthash:8].js',
      cssFilename: isDev ? '[name].css' : '[name].[contenthash:8].css',
      clean: !clientDevServer,
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
    },
    module: {
      rules: [clientRscRule, cssRule, assetRule],
    },
    plugins: [
      new ClientPlugin(),
      isDev && new ReactRefreshPlugin(),
    ].filter(Boolean),
    experiments: {
      css: true,
    },
    optimization: {
      minimize: !isDev,
    },
    devtool: isDev ? 'cheap-module-source-map' : 'source-map',
    stats: 'errors-warnings',
    ...(clientDevPort != null
      ? {
          devServer: {
            hot: true,
            liveReload: false,
            host: clientDevHost,
            port: clientDevPort,
            devMiddleware: {
              writeToDisk: (filePath) => {
                const normalized = filePath.replace(/\\/g, '/');
                const outDir = config.outDir.replace(/\\/g, '/');
                return normalized.includes(outDir);
              },
            },
            client: {
              webSocketURL: {
                protocol: 'ws',
                hostname: clientDevHost,
                port: clientDevPort,
                pathname: '/ws',
              },
              logging: 'warn',
              overlay: true,
            },
            allowedHosts: 'all',
          },
        }
      : {}),
  };

  const serverConfig = {
    name: 'server',
    mode,
    target: 'node',
    entry: {
      main: {
        import: [entries.rscEntry],
        layer: Layers.rsc,
      },
    },
    output: {
      path: config.serverOutDir,
      filename: 'rsc.js',
      library: {
        type: 'commonjs2',
      },
      clean: !isDev,
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
    },
    module: {
      rules: [
        {
          resource: entries.ssrEntry,
          layer: Layers.ssr,
        },
        {
          resource: /[/\\]render-html\.tsx$/,
          layer: Layers.ssr,
        },
        {
          resource: entries.rscEntry,
          layer: Layers.rsc,
          resolve: {
            conditionNames: ['react-server', '...'],
          },
        },
        {
          issuerLayer: Layers.rsc,
          exclude: [entries.ssrEntry, /[/\\]render-html\.tsx$/],
          resolve: {
            conditionNames: ['react-server', '...'],
          },
        },
        serverRscRule,
        cssRule,
        assetRule,
      ],
    },
    plugins: [
      new ServerPlugin(
        onServerComponentChanges
          ? { onServerComponentChanges }
          : undefined,
      ),
    ],
    experiments: {
      css: true,
      layers: true,
    },
    externalsPresets: {
      node: true,
    },
    externals: [
      // Keep Nest/runtime deps external; React Flight packages must be bundled with correct conditions.
      function ({ request }, callback) {
        if (!request) {
          return callback();
        }

        if (
          request.startsWith('react') ||
          request.startsWith('react-dom') ||
          request.startsWith('react-server-dom-rspack') ||
          request.startsWith('rsc-html-stream')
        ) {
          return callback();
        }

        // Share Nest process module instance for layout meta ALS, etc.
        if (
          request === 'nest-can-react' ||
          request.startsWith('nest-can-react/')
        ) {
          return callback(null, `commonjs ${request}`);
        }

        if (
          request.startsWith('.') ||
          request.startsWith('/') ||
          path.isAbsolute(request)
        ) {
          return callback();
        }

        return callback(null, `commonjs ${request}`);
      },
    ],
    optimization: {
      minimize: false,
    },
    devtool: isDev ? 'cheap-module-source-map' : 'source-map',
    stats: 'errors-warnings',
  };

  return [clientConfig, serverConfig];
}

export function packageDirname() {
  return path.dirname(fileURLToPath(import.meta.url));
}
