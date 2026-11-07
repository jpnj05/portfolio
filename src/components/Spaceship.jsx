import { useEffect, useRef } from 'react';

/**
 * A small ship that drifts through the fixed background with the dots.
 *
 * It is deliberately pointer-events: none. Hit-testing would fail wherever a
 * section covers it, so the ship compares the pointer with its own box instead
 * and grabs the pointer in the capture phase, which lets you drag it out from
 * under the text without the click ever reaching a link.
 *
 * Released with speed it keeps that speed and settles back into its slow drift;
 * leaving one edge brings it back on the opposite one.
 */

const IDLE_SPEED = 13; // px/second when nothing is pushing it
const IDLE_VX = IDLE_SPEED * 0.7;
const IDLE_VY = -IDLE_SPEED * 0.55;
const SETTLE = 0.9; // how fast a fling blends back to the idle drift (per second)
const MAX_SPEED = 1400;
// Small: the ship sits under the page content, so a generous grab box would
// swallow clicks meant for whatever happens to be behind it.
const TOUCH_PAD = 6;

export default function Spaceship() {
  const nodeRef = useRef(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return undefined;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const state = {
      x: 0,
      y: 0,
      vx: reduce ? 0 : IDLE_VX,
      vy: reduce ? 0 : IDLE_VY,
      angle: 0,
      w: 0,
      h: 0,
      drag: false,
      hover: false,
      grabX: 0,
      grabY: 0,
      samples: [],
      last: 0,
      frame: 0,
    };

    const measure = () => {
      const rect = node.getBoundingClientRect();
      state.w = rect.width || 64;
      state.h = rect.height || 100;
    };

    const paint = () => {
      node.style.transform = `translate3d(${state.x.toFixed(1)}px, ${state.y.toFixed(1)}px, 0) rotate(${state.angle.toFixed(2)}deg)`;
    };

    const start = () => {
      measure();
      state.x = Math.round(window.innerWidth * 0.62);
      state.y = Math.round(window.innerHeight * 0.6);
      state.angle = Math.atan2(state.vy, state.vx) * (180 / Math.PI) + 90;
      paint();
    };

    const hit = (x, y) =>
      x >= state.x - TOUCH_PAD &&
      x <= state.x + state.w + TOUCH_PAD &&
      y >= state.y - TOUCH_PAD &&
      y <= state.y + state.h + TOUCH_PAD;

    const step = (now) => {
      const dt = state.last ? Math.min((now - state.last) / 1000, 0.05) : 0.016;
      state.last = now;

      if (!state.drag) {
        // Blend toward the idle drift rather than braking to a stop: a hard fling
        // keeps most of its speed for a second or so, then settles.
        const pull = Math.min(1, dt * SETTLE);
        state.vx += ((reduce ? 0 : IDLE_VX) - state.vx) * pull;
        state.vy += ((reduce ? 0 : IDLE_VY) - state.vy) * pull;

        state.x += state.vx * dt;
        state.y += state.vy * dt;

        const w = window.innerWidth;
        const h = window.innerHeight;
        if (state.x > w) state.x = -state.w;
        else if (state.x < -state.w) state.x = w;
        if (state.y > h) state.y = -state.h;
        else if (state.y < -state.h) state.y = h;
      }

      const speed = Math.hypot(state.vx, state.vy);
      if (speed > 6) {
        const target = Math.atan2(state.vy, state.vx) * (180 / Math.PI) + 90;
        const diff = ((target - state.angle + 540) % 360) - 180;
        state.angle += diff * Math.min(1, dt * 6);
      }

      node.classList.toggle('is-hot', state.hover || state.drag || speed > 60);
      paint();
      state.frame = requestAnimationFrame(step);
    };

    const onPointerDown = (event) => {
      if (event.button !== 0 || !hit(event.clientX, event.clientY)) return;
      event.preventDefault();
      event.stopPropagation();
      state.drag = true;
      state.hover = true;
      state.grabX = event.clientX - state.x;
      state.grabY = event.clientY - state.y;
      state.vx = 0;
      state.vy = 0;
      state.samples = [{ x: event.clientX, y: event.clientY, t: performance.now() }];
      node.classList.add('is-hover', 'is-dragging', 'is-hot');
      document.documentElement.style.cursor = 'grabbing';
      paint();
    };

    const onPointerMove = (event) => {
      if (state.drag) {
        state.x = event.clientX - state.grabX;
        state.y = event.clientY - state.grabY;
        state.samples.push({ x: event.clientX, y: event.clientY, t: performance.now() });
        if (state.samples.length > 10) state.samples.shift();
        // Painted straight from the event as well as from the loop, so the ship
        // stays under the cursor even if animation frames are being throttled.
        paint();
        return;
      }

      state.hover = hit(event.clientX, event.clientY);
      node.classList.toggle('is-hover', state.hover);
      node.classList.toggle('is-hot', state.hover);
      document.documentElement.style.cursor = state.hover ? 'grab' : '';
    };

    const release = () => {
      if (!state.drag) return;
      state.drag = false;
      node.classList.remove('is-dragging');

      const now = performance.now();
      const recent = state.samples.filter((sample) => now - sample.t < 120);
      if (recent.length >= 2) {
        const first = recent[0];
        const last = recent[recent.length - 1];
        const span = Math.max((last.t - first.t) / 1000, 0.016);
        const clamp = (value) => Math.max(-MAX_SPEED, Math.min(MAX_SPEED, value));
        state.vx = clamp((last.x - first.x) / span);
        state.vy = clamp((last.y - first.y) / span);
      }

      state.samples = [];
      node.classList.toggle('is-hot', state.hover);
      document.documentElement.style.cursor = state.hover ? 'grab' : '';
    };

    const onLeave = () => {
      state.hover = false;
      node.classList.remove('is-hover');
      if (!state.drag) document.documentElement.style.cursor = '';
    };

    const onResize = () => {
      measure();
      state.x = Math.min(state.x, window.innerWidth);
      state.y = Math.min(state.y, window.innerHeight);
    };

    start();
    state.frame = requestAnimationFrame(step);

    window.addEventListener('pointerdown', onPointerDown, { capture: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('resize', onResize);
    document.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(state.frame);
      window.removeEventListener('pointerdown', onPointerDown, { capture: true });
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('pointerleave', onLeave);
      document.documentElement.style.cursor = '';
    };
  }, []);

  return (
    <div ref={nodeRef} className="ship" aria-hidden="true">
      <div className="ship-hover">
        <svg viewBox="0 0 64 100" className="ship-svg">
          <g className="ship-flames">
            <path className="flame flame-outer" d="M32 64c7 8 7 20 0 32-7-12-7-24 0-32Z" />
            <path className="flame flame-inner" d="M32 67c3.5 6 3.5 13 0 19-3.5-6-3.5-13 0-19Z" />
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
  );
}
