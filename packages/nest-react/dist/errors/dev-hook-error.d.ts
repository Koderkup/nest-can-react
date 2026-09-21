export declare class ClientHookOnServerError extends Error {
    readonly hookName: string;
    readonly source?: string;
    readonly cause: unknown;
    constructor(hookName: string, source: string | undefined, cause: unknown);
}
export declare function toClientHookOnServerError(error: unknown): ClientHookOnServerError;
export declare function rethrowIfClientHookError(error: unknown): never;
export declare function isClientHookError(error: unknown): boolean;
export declare function getClientHookName(error: unknown): "use" | "useSyncExternalStore" | "useInsertionEffect" | "useLayoutEffect" | "useImperativeHandle" | "useDeferredValue" | "useActionState" | "useOptimistic" | "useTransition" | "useCallback" | "useContext" | "useDebugValue" | "useEffect" | "useReducer" | "useMemo" | "useRef" | "useId" | "useState" | undefined;
export declare function getAppSource(stack: string): string | undefined;
export declare function isDevelopmentRuntime(): boolean;
export declare function sendClientHookErrorResponse(response: {
    headersSent: boolean;
    status(code: number): {
        type(value: string): {
            send(body: string): unknown;
        };
    };
}, error: ClientHookOnServerError): void;
export declare function getErrorStack(error: unknown): string;
