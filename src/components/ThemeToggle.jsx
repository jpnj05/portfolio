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

// Three beats, run in order rather than as one timeline: the disc has to reach
// the corners before the palette moves, otherwise the swap lands on a half faded
// veil and the page flickers through the gap.
const WIPE_GROW_MS = 440;
const WIPE_HOLD_MS = 80;
const WIPE_FADE_MS = 220;
// Matches the --ink values in global.css; the wipe is painted before the swap,
// so it cannot read the token it is about to reveal.
const BACKDROP = { dark: '#131120', light: '#f6f4fc' };

export default function ThemeToggle() {
  const [theme, setTheme] = useState(readInitialTheme);
  const switchTimer = useRef(0);
  const wipeTimer = useRef(0);
  const wipeNode = useRef(null);
  const wipeAnim = useRef(null);

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

  useEffect(
    () => () => {
      window.clearTimeout(switchTimer.current);
      window.clearTimeout(wipeTimer.current);
      wipeNode.current?.remove();
    },
    [],
  );

  const commit = (next) => {
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

  const toggle = (event) => {
    const next = theme === 'dark' ? 'light' : 'dark';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      commit(next);
      return;
    }

    // A disc of the incoming background grows out of the button, the palette
    // swaps while it is still covering the screen, and the disc fades off to
    // leave the new theme behind. Only transform and opacity animate, so the
    // page itself never repaints during the wipe.
    const box = event.currentTarget.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const radius =
      Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 24;

    // A second click mid-wipe takes over cleanly instead of stacking discs.
    wipeAnim.current?.cancel();
    window.clearTimeout(wipeTimer.current);
    wipeNode.current?.remove();

    const wipe = document.createElement('div');
    wipe.className = 'theme-wipe';
    wipe.style.cssText = [
      `left:${x}px`,
      `top:${y}px`,
      `width:${radius * 2}px`,
      `height:${radius * 2}px`,
      `margin-left:${-radius}px`,
      `margin-top:${-radius}px`,
      `background:${BACKDROP[next]}`,
      'transform:scale(0)',
    ].join(';');
    document.body.appendChild(wipe);
    wipeNode.current = wipe;

    const grow = wipe.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], {
      duration: WIPE_GROW_MS,
      easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      fill: 'forwards',
    });
    wipeAnim.current = grow;

    grow.onfinish = () => {
      // The veil now covers every corner, so the swap cannot be seen.
      commit(next);
      wipeTimer.current = window.setTimeout(() => {
        const fade = wipe.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: WIPE_FADE_MS,
          easing: 'ease-out',
          fill: 'forwards',
        });
        wipeAnim.current = fade;
        fade.onfinish = () => {
          wipe.remove();
          if (wipeNode.current === wipe) wipeNode.current = null;
        };
      }, WIPE_HOLD_MS);
    };
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
