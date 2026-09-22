import { useCallback, useRef, useState } from 'react';

export type CommitState = 'idle' | 'submitting' | 'revalidating';

type UseCommitOptions = {
  method?: string;
  revalidate?: boolean;
};

/**
 * POST JSON to a Nest route. Nest owns auth/guards/validation.
 * When revalidate is true (default), triggers an RSC refetch via navigation refresh.
 */
export function useCommit<T = unknown>(
  url: string,
  options: UseCommitOptions = {},
) {
  const method = options.method ?? 'POST';
  const revalidate = options.revalidate ?? true;
  const busy = useRef(false);
  const [state, setState] = useState<CommitState>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T>();

  const commit = useCallback(
    async (body?: unknown) => {
      if (busy.current) {
        return;
      }

      busy.current = true;
      setError(null);
      setState('submitting');

      try {
        const headers: Record<string, string> = {
          accept: 'application/json',
        };
        const request: RequestInit = {
          credentials: 'include',
          method,
          headers,
        };

        if (body !== undefined) {
          headers['content-type'] = 'application/json';
          request.body = JSON.stringify(body);
        }

        const response = await fetch(url, request);

        if (!response.ok) {
          throw new Error('Request failed.');
        }

        const result = (await parseJson(response)) as T;
        setData(result);

        if (revalidate) {
          setState('revalidating');
          await refresh();
        }

        return result;
      } catch (cause) {
        const nextError =
          cause instanceof Error ? cause : new Error('Request failed.');
        setError(nextError);
        throw nextError;
      } finally {
        busy.current = false;
        setState('idle');
      }
    },
    [method, revalidate, url],
  );

  return {
    commit,
    data,
    error,
    pending: state !== 'idle',
    state,
  };
}

export function refresh() {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(finish, 8_000);

    function finish() {
      window.clearTimeout(timeout);
      window.removeEventListener('ncr:rsc-refresh-done', finish);
      resolve();
    }

    window.addEventListener('ncr:rsc-refresh-done', finish, { once: true });
    window.dispatchEvent(new CustomEvent('ncr:rsc-update'));
  });
}

export function navigateTo(href: string) {
  window.history.pushState(null, '', href);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

async function parseJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  return JSON.parse(text) as unknown;
}
