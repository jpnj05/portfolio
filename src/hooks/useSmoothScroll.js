import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

let instance = null;

/** The live Lenis instance, or null when smoothing is off. */
export function getLenis() {
  return instance;
}

/**
 * Site-wide inertial scrolling. Native scroll stays the source of truth, so
 * `position: fixed`, IntersectionObserver and the reading-progress bar keep
 * working unchanged. Touch is smoothed too, so a drag on a phone glides the
 * same way the wheel does instead of being handed back to the browser, and
 * anyone who asks for reduced motion gets the browser's plain scrolling with
 * no rAF loop.
 */
export default function useSmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const lenis = new Lenis({
      autoRaf: true,
      /* How much of the remaining distance each frame covers. Lower glides
         longer; below about 0.06 the content starts to trail the cursor. */
      lerp: 0.08,
      smoothWheel: true,
      wheelMultiplier: 1,
      /* Touch scrolls through Lenis as well, so a flick carries and settles
         instead of stopping dead where the finger left off. */
      syncTouch: true,
      syncTouchLerp: 0.09,
      touchMultiplier: 1,
    });
    instance = lenis;

    // In-page anchors. Lenis' own handler lets the browser jump natively and
    // then animates from the old position, so prevent the jump and drive the
    // scroll ourselves. The timeout lets the mobile menu release its scroll
    // lock before we start.
    const onAnchorClick = (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
      if (!link) return;

      const id = decodeURIComponent(link.getAttribute('href').slice(1));
      const target = id ? document.getElementById(id) : document.documentElement;
      if (!target) return;

      event.preventDefault();
      window.setTimeout(() => lenis.scrollTo(target, { duration: 1.05 }), 0);
      window.history.pushState(null, '', `#${id}`);
    };

    document.addEventListener('click', onAnchorClick);

    return () => {
      document.removeEventListener('click', onAnchorClick);
      instance = null;
      lenis.destroy();
    };
  }, []);
}
