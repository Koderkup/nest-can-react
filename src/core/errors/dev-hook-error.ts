import { relative } from 'node:path';
import { renderDevHookErrorPage } from './dev-hook-error-page';

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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function getErrorStack(error: unknown) {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }

  return String(error);
}
