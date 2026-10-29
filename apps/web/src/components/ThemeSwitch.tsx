import { useEffect, useState } from 'react';
import { Icon } from './ui';

type Theme = 'system' | 'light' | 'dark';
export default function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('mathstudy-theme');
      return saved === 'light' || saved === 'dark' ? saved : 'system';
    } catch {
      return 'system';
    }
  });
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme =
        theme === 'system' ? (media?.matches ? 'dark' : 'light') : theme;
    };
    apply();
    try {
      localStorage.setItem('mathstudy-theme', theme);
    } catch {
      /* Theme still works in memory. */
    }
    media?.addEventListener('change', apply);
    return () => media?.removeEventListener('change', apply);
  }, [theme]);
  return (
    <label className="theme-switch">
      <Icon name={theme === 'dark' ? 'Moon' : theme === 'light' ? 'Sun' : 'Monitor'} size={18} />
      <select
        aria-label="界面主题"
        value={theme}
        onChange={(event) => setTheme(event.target.value as Theme)}
      >
        <option value="system">跟随系统</option>
        <option value="light">浅色</option>
        <option value="dark">深色</option>
      </select>
    </label>
  );
}
