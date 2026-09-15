import React from 'react';
import { SessionProvider } from './context/session';

export function ClientRuntime({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
