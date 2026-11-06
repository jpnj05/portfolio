import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'theme';

function readInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* storage can be blocked */
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(readInitialTheme);
  const switchTimer = useRef(0);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f6f4fc' : '#131120');
  }, [theme]);

  useEffect(() => () => window.clearTimeout(switchTimer.current), []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;

    // One instant palette swap. `.theme-switch` parks running animations and
    // suppresses per-element colour transitions, so nothing repaints for the
    // length of a tween and the swap costs a single frame.
    root.classList.add('theme-switch');
    root.dataset.theme = next;
    setTheme(next);

    window.clearTimeout(switchTimer.current);
    switchTimer.current = window.setTimeout(() => root.classList.remove('theme-switch'), 140);
  };

  const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`;

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={label}
      aria-pressed={theme === 'light'}
      title={label}
    >
      <svg className="theme-icon theme-icon--moon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5 8.6 8.6 0 1 0 20.5 14.6Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="16.4" cy="6.6" r="0.9" fill="currentColor" />
      </svg>
      <svg className="theme-icon theme-icon--sun" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
