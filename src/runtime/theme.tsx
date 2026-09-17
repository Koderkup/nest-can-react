import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';

export type Theme = 'light' | 'dark';

type ThemeState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeState | null>(null);
const storageKey = 'nr-theme';

type ThemeStore = {
  theme: Theme;
  listeners: Set<() => void>;
};

const themeStore: ThemeStore = (() => {
  const globalState = globalThis as typeof globalThis & {
    __NR_THEME_STORE__?: ThemeStore;
  };

  if (!globalState.__NR_THEME_STORE__) {
    globalState.__NR_THEME_STORE__ = {
      theme: 'light',
      listeners: new Set(),
    };
  }

  return globalState.__NR_THEME_STORE__;
})();

function subscribe(listener: () => void) {
  themeStore.listeners.add(listener);
  return () => {
    themeStore.listeners.delete(listener);
  };
}

function getTheme() {
  return themeStore.theme;
}

function getServerTheme(): Theme {
  return 'light';
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.dataset.theme = theme;
}

function commitTheme(theme: Theme) {
  themeStore.theme = theme;
  applyTheme(theme);

  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    // Ignore private-mode storage failures.
  }

  themeStore.listeners.forEach((listener) => listener());
}

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored === 'dark' || stored === 'light' ? stored : null;
  } catch {
    return null;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);

  useEffect(() => {
    commitTheme(readStoredTheme() ?? 'light');
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme: commitTheme,
      toggle: () => commitTheme(theme === 'dark' ? 'light' : 'dark'),
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return (
    useContext(ThemeContext) ?? {
      theme: 'light' as Theme,
      setTheme: () => undefined,
      toggle: () => undefined,
    }
  );
}
