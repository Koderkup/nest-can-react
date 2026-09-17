import React from 'react';
import { ThemeProvider } from './theme';

export function ClientRuntime({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
