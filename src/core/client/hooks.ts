import { FormEvent, useCallback, useState, useSyncExternalStore } from 'react';
import {
  CommitRef,
  commit,
  getLoad,
  getVersion,
  isLoadPending,
  subscribe,
} from './runtime';

export function useLoad<T>(key: string) {
  useSyncExternalStore(subscribe, getVersion, getVersion);
  return getLoad<T>(key);
}

export function usePendingLoad(key: string) {
  useSyncExternalStore(subscribe, getVersion, getVersion);
  return isLoadPending(key);
}

export function useCommit<TInput>(ref: CommitRef) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (input: TInput) => {
      setPending(true);
      setError(null);

      try {
        return await commit(ref, input);
      } catch (cause) {
        const nextError =
          cause instanceof Error ? cause : new Error('Commit failed.');
        setError(nextError);
        throw nextError;
      } finally {
        setPending(false);
      }
    },
    [ref],
  );

  const fromSubmitEvent = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const formData = new FormData(event.currentTarget);
      const input = Object.fromEntries(formData.entries()) as TInput;

      return execute(input);
    },
    [execute],
  );

  return {
    pending,
    error,
    execute,
    fromSubmitEvent,
  };
}
