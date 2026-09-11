import {
  __toESM,
  commit,
  getLoad,
  getVersion,
  isLoadPending,
  require_react,
  subscribe
} from "./chunk-6HGV5ZIV.js";

// src/core/client/hooks.ts
var import_react = __toESM(require_react());
function useLoad(key) {
  (0, import_react.useSyncExternalStore)(subscribe, getVersion, getVersion);
  return getLoad(key);
}
function usePendingLoad(key) {
  (0, import_react.useSyncExternalStore)(subscribe, getVersion, getVersion);
  return isLoadPending(key);
}
function useCommit(ref) {
  const [pending, setPending] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const execute = (0, import_react.useCallback)(
    async (input) => {
      setPending(true);
      setError(null);
      try {
        return await commit(ref, input);
      } catch (cause) {
        const nextError = cause instanceof Error ? cause : new Error("Commit failed.");
        setError(nextError);
        throw nextError;
      } finally {
        setPending(false);
      }
    },
    [ref]
  );
  const fromSubmitEvent = (0, import_react.useCallback)(
    async (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const input = Object.fromEntries(formData.entries());
      return execute(input);
    },
    [execute]
  );
  return {
    pending,
    error,
    execute,
    fromSubmitEvent
  };
}

export {
  useLoad,
  usePendingLoad,
  useCommit
};
//# sourceMappingURL=chunk-5SZ3HSQC.js.map
