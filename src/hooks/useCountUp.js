import { useEffect, useRef, useState } from 'react';

/**
 * Counts from 0 to `target` once the returned ref enters the viewport.
 * Returns [ref, value] and never animates when the target is unknown (null).
 */
export function useCountUp(target, { duration = 1200 } = {}) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (target === null || target === undefined) {
      setValue(0);
      return undefined;
    }

    started.current = false;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      setValue(target);
      return undefined;
    }

    const node = ref.current;
    let frame = 0;

    const run = () => {
      if (started.current) return;
      started.current = true;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(target * eased));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };

      frame = requestAnimationFrame(tick);
    };

    if (!node || typeof IntersectionObserver === 'undefined') {
      setValue(target);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [target, duration]);

  return [ref, value];
}
