import React, {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react';

type SessionState = {
  visits: number;
  bump: () => void;
};

const SessionContext = createContext<SessionState | null>(null);

type SessionStore = {
  visits: number;
  listeners: Set<() => void>;
};

const sessionStore: SessionStore = (() => {
  const globalState = globalThis as typeof globalThis & {
    __NR_SESSION_STORE__?: SessionStore;
  };

  if (!globalState.__NR_SESSION_STORE__) {
    globalState.__NR_SESSION_STORE__ = {
      visits: 1,
      listeners: new Set(),
    };
  }

  return globalState.__NR_SESSION_STORE__;
})();

function subscribeSession(listener: () => void) {
  sessionStore.listeners.add(listener);
  return () => {
    sessionStore.listeners.delete(listener);
  };
}

function getVisits() {
  return sessionStore.visits;
}

function bumpVisits() {
  sessionStore.visits += 1;
  sessionStore.listeners.forEach((listener) => listener());
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const currentVisits = useSyncExternalStore(
    subscribeSession,
    getVisits,
    getVisits,
  );
  const value = useMemo(
    () => ({
      visits: currentVisits,
      bump: bumpVisits,
    }),
    [currentVisits],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  return (
    useContext(SessionContext) ?? {
      visits: 0,
      bump: () => undefined,
    }
  );
}
