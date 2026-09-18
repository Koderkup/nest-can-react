import { useCallback, useEffect, useState } from 'react';
import type { PublicUser } from '../auth.types';

export const AUTH_TOKEN_KEY = 'nest-learning.auth.token';

type AuthState = {
  user: PublicUser | null;
  token: string | null;
  loading: boolean;
  error: Error | null;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    error: null,
  });

  const setSession = useCallback((accessToken: string, user: PublicUser) => {
    localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
    setState({
      user,
      token: accessToken,
      loading: false,
      error: null,
    });
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setState({
      user: null,
      token: null,
      loading: false,
      error: null,
    });
  }, []);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
      setState((current) => ({
        ...current,
        user: null,
        token: null,
        loading: false,
      }));
      return;
    }

    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const response = await fetch('/auth/me', {
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Session expired.');
      }

      const payload = (await response.json()) as { user: PublicUser };

      setState({
        user: payload.user,
        token,
        loading: false,
        error: null,
      });
    } catch (cause) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setState({
        user: null,
        token: null,
        loading: false,
        error:
          cause instanceof Error ? cause : new Error('Session check failed.'),
      });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    ...state,
    clearSession,
    refresh,
    setSession,
  };
}

export function authHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = { accept: 'application/json' };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  return headers;
}
