import { useEffect, useRef, useState } from 'react';

/**
 * A small ship drifting through the fixed background layer.
 *
 * It sits behind the page, so a real :hover would only fire where no section
 * happens to cover it. Instead the pointer position is compared with the ship's
 * box each frame, which lets the text above it still wake the thing up. Nothing
 * here captures clicks: the layer is pointer-events: none.
 */
export default function Spaceship() {
  const ref = useRef(null);
  const [hot, setHot] = useState(false);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;

    // Time-throttled rather than rAF-driven: pointer feedback should still follow
    // the cursor in a throttled tab, where animation frames may not run at all.
    let last = 0;

    const onMove = (event) => {
      const now = performance.now();
      if (now - last < 60) return;
      last = now;

      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      // A little slack so the ship reacts as the cursor arrives, not after.
      const pad = 16;
      setHot(
        event.clientX >= rect.left - pad &&
          event.clientX <= rect.right + pad &&
          event.clientY >= rect.top - pad &&
          event.clientY <= rect.bottom + pad,
      );
    };

    const onLeave = () => setHot(false);

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
    };
  }, []);

  return (
    <div ref={ref} className={`ship ${hot ? 'is-hot' : ''}`} aria-hidden="true">
      <div className="ship-drift">
        <div className="ship-hover">
          <svg viewBox="0 0 64 100" className="ship-svg">
            <g className="ship-flames">
              <path
                className="flame flame-outer"
                d="M32 64c7 8 7 20 0 32-7-12-7-24 0-32Z"
              />
              <path
                className="flame flame-inner"
                d="M32 67c3.5 6 3.5 13 0 19-3.5-6-3.5-13 0-19Z"
              />
            </g>

            <path className="ship-fin ship-fin-left" d="M24 54 13 70l11-4V54Z" />
            <path className="ship-fin ship-fin-right" d="M40 54l11 16-11-4V54Z" />

            <path
              className="ship-hull"
              d="M32 6c9 7 13 19 13 32v20a6 6 0 0 1-6 6H25a6 6 0 0 1-6-6V38C19 25 23 13 32 6Z"
            />
            <circle className="ship-window" cx="32" cy="34" r="7" />
            <circle className="ship-glint" cx="29.6" cy="31.4" r="2.2" />
            <path className="ship-belt" d="M19 56h26" />
          </svg>
        </div>
      </div>
    </div>
  );
}
