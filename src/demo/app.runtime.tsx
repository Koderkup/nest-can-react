import React, { createContext, useContext, useMemo, useState } from 'react';

type SessionState = {
  visits: number;
  bump: () => void;
};

const SessionContext = createContext<SessionState | null>(null);

export function ClientRuntime({ children }: { children: React.ReactNode }) {
  const [visits, setVisits] = useState(1);
  const value = useMemo(
    () => ({
      visits,
      bump: () => setVisits((current) => current + 1),
    }),
    [visits],
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
