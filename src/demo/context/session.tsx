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

let visits = 1;
const sessionListeners = new Set<() => void>();

function subscribeSession(listener: () => void) {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

function getVisits() {
  return visits;
}

function bumpVisits() {
  visits += 1;
  sessionListeners.forEach((listener) => listener());
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
