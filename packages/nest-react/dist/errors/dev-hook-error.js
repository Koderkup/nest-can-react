"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientHookOnServerError = void 0;
exports.toClientHookOnServerError = toClientHookOnServerError;
exports.rethrowIfClientHookError = rethrowIfClientHookError;
exports.isClientHookError = isClientHookError;
exports.getClientHookName = getClientHookName;
exports.getAppSource = getAppSource;
exports.isDevelopmentRuntime = isDevelopmentRuntime;
exports.sendClientHookErrorResponse = sendClientHookErrorResponse;
exports.getErrorStack = getErrorStack;
const node_path_1 = require("node:path");
const dev_hook_error_page_1 = require("./dev-hook-error-page");
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
];
const FALLBACK_HOOK_NAME = 'a client hook';
class ClientHookOnServerError extends Error {
    hookName;
    source;
    cause;
    constructor(hookName, source, cause) {
        super(`${hookName} cannot run in a server page.`);
        this.name = 'ClientHookOnServerError';
        this.hookName = hookName;
        this.source = source;
        this.cause = cause;
    }
}
exports.ClientHookOnServerError = ClientHookOnServerError;
function toClientHookOnServerError(error) {
    if (error instanceof ClientHookOnServerError) {
        return error;
    }
    const stack = getErrorStack(error);
    return new ClientHookOnServerError(getClientHookName(error) ?? FALLBACK_HOOK_NAME, getAppSource(stack), error);
}
function rethrowIfClientHookError(error) {
    if (error instanceof ClientHookOnServerError) {
        throw error;
    }
    if (isClientHookError(error)) {
        throw toClientHookOnServerError(error);
    }
    throw error;
}
function isClientHookError(error) {
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
        return (/Cannot read propert(?:y|ies) of null/i.test(message) ||
            /dispatcher is (null|undefined)/i.test(message) ||
            /Invalid hook call/i.test(stack));
    }
    return false;
}
function getClientHookName(error) {
    const message = getErrorMessage(error);
    const stack = getErrorStack(error);
    const fromMessage = message.match(/reading ['"](use(?:SyncExternalStore|InsertionEffect|LayoutEffect|ImperativeHandle|DeferredValue|ActionState|Optimistic|Transition|Callback|Context|DebugValue|Effect|Reducer|Memo|Ref|Id|State)?)['"]/);
    if (fromMessage?.[1] && isKnownHook(fromMessage[1])) {
        return fromMessage[1];
    }
    for (const hook of CLIENT_HOOKS) {
        const pattern = new RegExp(String.raw `(?:^|\n)\s*at (?:\S+\.)*${hook}\b`);
        if (pattern.test(stack)) {
            return hook;
        }
    }
    return undefined;
}
function isKnownHook(name) {
    return CLIENT_HOOKS.includes(name);
}
function getAppSource(stack) {
    const cwd = process.cwd();
    for (const line of stack.split('\n')) {
        if (line.includes('node_modules')) {
            continue;
        }
        const match = line.match(/\((.+):(\d+):(\d+)\)/) ??
            line.match(/at\s+(?:file:\/\/)?(\S+):(\d+):(\d+)/);
        if (!match) {
            continue;
        }
        const filePath = match[1].replace(/^file:\/\//, '');
        if (!filePath.includes(cwd) && !filePath.includes('/src/')) {
            continue;
        }
        const displayPath = filePath.startsWith(cwd)
            ? (0, node_path_1.relative)(cwd, filePath)
            : filePath;
        return `${displayPath}:${match[2]}`;
    }
    return undefined;
}
function isDevelopmentRuntime() {
    return process.env.NODE_ENV !== 'production';
}
function sendClientHookErrorResponse(response, error) {
    if (response.headersSent) {
        return;
    }
    if (isDevelopmentRuntime()) {
        response.status(500).type('html').send((0, dev_hook_error_page_1.renderDevHookErrorPage)(error));
        return;
    }
    response.status(500).type('text').send('Internal server error');
}
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
function getErrorStack(error) {
    if (error instanceof Error) {
        return error.stack ?? error.message;
    }
    return String(error);
}
//# sourceMappingURL=dev-hook-error.js.map