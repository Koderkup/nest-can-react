import { relative } from 'node:path';

const CLIENT_HOOKS = [
  'useSyncExternalStore',
  'useInsertionEffect',
  'useLayoutEffect',
  'useImperativeHandle',
  'useDeferredValue',
  'useActionState',
  'useOptimistic',
  'useTransition',
  'useCallback',
  'useContext',
  'useDebugValue',
  'useEffect',
  'useReducer',
  'useMemo',
  'useRef',
  'useId',
  'useState',
  'use',
] as const;

const FALLBACK_HOOK_NAME = 'a client hook';

export class ClientHookOnServerError extends Error {
  readonly hookName: string;
  readonly source?: string;
  readonly cause: unknown;

  constructor(hookName: string, source: string | undefined, cause: unknown) {
    super(`${hookName} cannot run in a server page.`);
    this.name = 'ClientHookOnServerError';
    this.hookName = hookName;
    this.source = source;
    this.cause = cause;
  }
}

export function toClientHookOnServerError(error: unknown) {
  if (error instanceof ClientHookOnServerError) {
    return error;
  }

  const stack = getErrorStack(error);
  return new ClientHookOnServerError(
    getClientHookName(error) ?? FALLBACK_HOOK_NAME,
    getAppSource(stack),
    error,
  );
}

export function rethrowIfClientHookError(error: unknown): never {
  if (error instanceof ClientHookOnServerError) {
    throw error;
  }

  if (isClientHookError(error)) {
    throw toClientHookOnServerError(error);
  }

  throw error;
}

export function isClientHookError(error: unknown) {
  const message = getErrorMessage(error);
  const stack = getErrorStack(error);

  if (/Invalid hook call/i.test(message)) {
    return true;
  }

  if (/throwInvalidHookError/.test(stack)) {
    return true;
  }

  if (/Hooks can only be called/i.test(message)) {
    return true;
  }

  if (getClientHookName(error)) {
    return (
      /Cannot read propert(?:y|ies) of null/i.test(message) ||
      /dispatcher is (null|undefined)/i.test(message) ||
      /Invalid hook call/i.test(stack)
    );
  }

  return false;
}

export function getClientHookName(error: unknown) {
  const message = getErrorMessage(error);
  const stack = getErrorStack(error);
  const fromMessage = message.match(
    /reading ['"](use(?:SyncExternalStore|InsertionEffect|LayoutEffect|ImperativeHandle|DeferredValue|ActionState|Optimistic|Transition|Callback|Context|DebugValue|Effect|Reducer|Memo|Ref|Id|State)?)['"]/,
  );

  if (fromMessage?.[1] && isKnownHook(fromMessage[1])) {
    return fromMessage[1];
  }

  for (const hook of CLIENT_HOOKS) {
    const pattern = new RegExp(
      String.raw`(?:^|\n)\s*at (?:\S+\.)*${hook}\b`,
    );

    if (pattern.test(stack)) {
      return hook;
    }
  }

  return undefined;
}

function isKnownHook(name: string): name is (typeof CLIENT_HOOKS)[number] {
  return (CLIENT_HOOKS as readonly string[]).includes(name);
}

export function getAppSource(stack: string) {
  const cwd = process.cwd();

  for (const line of stack.split('\n')) {
    if (line.includes('node_modules')) {
      continue;
    }

    const match =
      line.match(/\((.+):(\d+):(\d+)\)/) ??
      line.match(/at\s+(?:file:\/\/)?(\S+):(\d+):(\d+)/);

    if (!match) {
      continue;
    }

    const filePath = match[1].replace(/^file:\/\//, '');

    if (!filePath.includes(cwd) && !filePath.includes('/src/')) {
      continue;
    }

    const displayPath = filePath.startsWith(cwd)
      ? relative(cwd, filePath)
      : filePath;

    return `${displayPath}:${match[2]}`;
  }

  return undefined;
}

export function isDevelopmentRuntime() {
  return process.env.NODE_ENV !== 'production';
}

export function sendClientHookErrorResponse(
  response: {
    headersSent: boolean;
    status(code: number): { type(value: string): { send(body: string): unknown } };
  },
  error: ClientHookOnServerError,
) {
  if (response.headersSent) {
    return;
  }

  if (isDevelopmentRuntime()) {
    response.status(500).type('html').send(renderDevHookErrorPage(error));
    return;
  }

  response.status(500).type('text').send('Internal server error');
}

export function renderDevHookErrorPage(error: ClientHookOnServerError) {
  const hook = error.hookName;
  const source = error.source;
  const stack = getErrorStack(error.cause ?? error);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(hook)} was supposed to land on an island | Nest React</title>
  <style>
    :root {
      color-scheme: dark;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #07111f;
      color: #edf4ff;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.26), transparent 34rem),
        radial-gradient(circle at 75% 15%, rgba(168, 85, 247, 0.22), transparent 28rem),
        linear-gradient(135deg, #07111f 0%, #0b1020 50%, #10172a 100%);
    }
    main {
      width: min(720px, calc(100% - 32px));
      margin: 0 auto;
      padding: 72px 0 64px;
    }
    .eyebrow {
      color: #38bdf8;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }
    .kicker {
      margin: 18px 0 0;
      color: #c4b5fd;
      font-size: 0.95rem;
      font-weight: 600;
    }
    h1 {
      margin: 10px 0 0;
      font-size: clamp(1.8rem, 4vw, 2.6rem);
      letter-spacing: -0.04em;
      line-height: 1.15;
    }
    h1 code {
      background: linear-gradient(135deg, #38bdf8, #a855f7);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      font: inherit;
      font-weight: 800;
    }
    .panel {
      margin-top: 28px;
      padding: 24px;
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: 24px;
      background: rgba(8, 15, 30, 0.68);
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
      backdrop-filter: blur(24px);
    }
    p { color: #cbd5e1; line-height: 1.65; }
    .split {
      display: grid;
      gap: 12px;
      margin: 20px 0;
    }
    .split div {
      padding: 14px 16px;
      border-radius: 16px;
      background: rgba(15, 23, 42, 0.8);
    }
    .split strong { display: block; margin-bottom: 4px; color: #edf4ff; }
    .split span { color: #94a3b8; font-size: 0.92rem; }
    ol {
      margin: 16px 0 0;
      padding-left: 1.2rem;
      color: #cbd5e1;
      line-height: 1.7;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.92em;
      color: #7dd3fc;
    }
    .source {
      margin-top: 22px;
      color: #94a3b8;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.85rem;
    }
    details {
      margin-top: 18px;
      color: #94a3b8;
    }
    summary { cursor: pointer; }
    pre {
      overflow: auto;
      margin: 12px 0 0;
      padding: 14px;
      border-radius: 16px;
      background: #020617;
      color: #e2e8f0;
      font-size: 0.78rem;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">Development only</p>
    <p class="kicker">Wrong neighborhood</p>
    <h1><code>${escapeHtml(hook)}</code> was supposed to land on an island.</h1>
    <section class="panel">
      <p>
        This file is a <strong>server page</strong>. Nest runs it during the request.
        There is no browser, no component instance, and no re-render loop.
        <code>${escapeHtml(hook)}</code> asked React for client state anyway, so the
        dispatcher was empty and the render died.
      </p>
      <div class="split">
        <div>
          <strong>Pages</strong>
          <span>Load data, compose HTML, and pass props. Nest DI and <code>load()</code> live here.</span>
        </div>
        <div>
          <strong>Islands</strong>
          <span><code>*.island.tsx</code> owns CSR: <code>${escapeHtml(hook)}</code>, clicks, timers, forms.</span>
        </div>
      </div>
      <p>
        Move <code>${escapeHtml(hook)}</code> into an island, then render it with
        <code>&lt;Island name={YourIsland} /&gt;</code>. Leave this page for the server.
      </p>
      <ol>
        <li>Create or open a <code>*.island.tsx</code> file.</li>
        <li>Move <code>${escapeHtml(hook)}</code> into that island component.</li>
        <li>Render it from this page with <code>&lt;Island name={ThatComponent} /&gt;</code>.</li>
      </ol>
      ${
        source
          ? `<p class="source">${escapeHtml(source)}</p>`
          : ''
      }
      ${
        stack
          ? `<details><summary>Original React stack</summary><pre>${escapeHtml(stack)}</pre></details>`
          : ''
      }
    </section>
  </main>
</body>
</html>
`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function getErrorStack(error: unknown) {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }

  return String(error);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const escaped: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return escaped[char];
  });
}
