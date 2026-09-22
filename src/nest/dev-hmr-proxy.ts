import type { Server } from 'node:http';
import { createProxyServer } from 'http-proxy';

const RSC_HMR_PATH = '/__nest_can_react/hmr';
const RSPACK_HMR_PATH = '/__nest_can_react/rspack-hmr';

export type DevHmrProxyOptions = {
  hmrPort: number;
  clientDevPort: number;
};

const attachedServers = new WeakSet<Server>();

export function attachDevHmrProxies(
  server: Server,
  options: DevHmrProxyOptions,
): void {
  if (attachedServers.has(server)) {
    return;
  }

  attachedServers.add(server);

  const rscProxy = createProxyServer({
    target: `http://127.0.0.1:${options.hmrPort}`,
    ws: true,
    changeOrigin: true,
  });

  const rspackProxy = createProxyServer({
    target: `http://127.0.0.1:${options.clientDevPort}`,
    ws: true,
    changeOrigin: true,
  });

  const onProxyError = (
    error: Error,
    _req: unknown,
    socket: { destroy?: () => void } | undefined,
  ) => {
    console.warn(`nest-can-react: HMR proxy error: ${error.message}`);
    socket?.destroy?.();
  };

  rscProxy.on('error', onProxyError);
  rspackProxy.on('error', onProxyError);

  server.on('upgrade', (req, socket, head) => {
    const [pathname, search] = (req.url ?? '').split('?');

    if (pathname === RSC_HMR_PATH) {
      req.url = search ? `/?${search}` : '/';
      rscProxy.ws(req, socket, head);
      return;
    }

    if (pathname === RSPACK_HMR_PATH) {
      req.url = search ? `/ws?${search}` : '/ws';
      rspackProxy.ws(req, socket, head);
    }
  });

  console.log(
    `nest-can-react: dev HMR proxied on ${RSC_HMR_PATH} and ${RSPACK_HMR_PATH}`,
  );
}

export function attachDevHmrProxiesFromEnv(server: Server): void {
  if (process.env.NEST_CAN_REACT_DEV !== '1') {
    return;
  }

  const hmrPort = Number(process.env.NEST_CAN_REACT_HMR_PORT ?? 9101);
  const clientDevPort = Number(
    process.env.NEST_CAN_REACT_CLIENT_DEV_PORT ?? 9102,
  );

  attachDevHmrProxies(server, { hmrPort, clientDevPort });
}
