import http from 'node:http';
import net from 'node:net';

export const sseClients = new Set();

export function startProxy(publicPort, nestPort) {
  const server = http.createServer((req, res) => {
    const path = (req.url ?? '/').split('?')[0];

    if (path === '/_nr/hmr') {
      attachSseClient(req, res);
      return;
    }

    proxyRequest(req, res, nestPort);
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

export function broadcast(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;

  for (const client of sseClients) {
    client.write(payload);
  }
}

function proxyRequest(req, res, nestPort, retried = false) {
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
        .then(() => proxyRequest(req, res, nestPort, true))
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

export function waitForPort(port, timeoutMs = 20000) {
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

export function waitFor(predicate, timeoutMs) {
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
