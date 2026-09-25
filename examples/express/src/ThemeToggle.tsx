'use client';

import { useTheme } from './ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="theme-toggle"
      onClick={toggleTheme}
      type="button"
    >
      <span aria-hidden="true" className="theme-toggle__icon">
        {theme === 'dark' ? '☀' : '☾'}
      </span>
      <span className="theme-toggle__label">
        {theme === 'dark' ? 'Light' : 'Dark'}
      </span>
    </button>
  );
}
