import React from 'react';
import mark from '../../assets/mark.svg';
import { useTheme } from '../../runtime/theme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <section className="island-card">
      <p className="theme-row muted">
        <img alt="" src={mark} />
        Context theme: {theme}
      </p>
      <button className="secondary" onClick={toggle} type="button">
        {theme === 'dark' ? 'Use light' : 'Use dark'}
      </button>
    </section>
  );
}
