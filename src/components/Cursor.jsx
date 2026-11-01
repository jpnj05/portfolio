import { useEffect, useRef, useState } from 'react';

/**
 * Pointer-following accent light + dot. Only armed on devices with a real
 * cursor, and it lets go entirely when the pointer leaves the window.
 */
export default function Cursor() {
  const spotRef = useRef(null);
  const dotRef = useRef(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    setEnabled(true);
    const root = document.body;
    let frame = 0;
    let next = null;

    const paint = () => {
      frame = 0;
      if (!next) return;
      const { x, y } = next;
      if (spotRef.current) {
        spotRef.current.style.setProperty('--mx', `${x}px`);
        spotRef.current.style.setProperty('--my', `${y}px`);
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${x - 4}px, ${y - 4}px, 0)`;
      }
    };

    const onMove = (event) => {
      next = { x: event.clientX, y: event.clientY };
      if (dotRef.current) dotRef.current.style.opacity = '1';
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onLeave = () => {
      root.classList.remove('cursor-armed');
      if (dotRef.current) dotRef.current.style.opacity = '0';
    };

    const onEnter = () => root.classList.add('cursor-armed');

    root.classList.add('cursor-armed');
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('pointerenter', onEnter);

    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('pointerenter', onEnter);
      root.classList.remove('cursor-armed');
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div ref={spotRef} className="cursor-spot" aria-hidden="true" />
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
    </>
  );
}

/** Slim reading-progress line pinned to the top of the page. */
export function ScrollProgress() {
  useEffect(() => {
    const bar = document.getElementById('progress-bar');
    if (!bar) return undefined;

    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      bar.style.setProperty('--p', `${(ratio * 100).toFixed(2)}%`);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="progress" aria-hidden="true">
      <div className="progress-bar" id="progress-bar" />
    </div>
  );
}
