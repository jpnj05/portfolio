import { useEffect, useRef } from 'react';

/**
 * A small ship that drifts through the fixed background with the dots.
 *
 * It is deliberately pointer-events: none. Hit-testing would fail wherever a
 * section covers it, so the ship compares the pointer with its own box instead
 * and grabs the pointer in the capture phase, which lets you drag it out from
 * under the text without the click ever reaching a link.
 *
 * Released with speed it keeps that speed and that line of travel, slowing down
 * to its cruising pace without curving back to the default up-right drift; leaving
 * one edge brings it back on the opposite one.
 */

const IDLE_SPEED = 13; // px/second when nothing is pushing it
const IDLE_HEADING = -38; // degrees: up and to the right, its resting drift
const IDLE_VX = Math.cos((IDLE_HEADING * Math.PI) / 180) * IDLE_SPEED;
const IDLE_VY = Math.sin((IDLE_HEADING * Math.PI) / 180) * IDLE_SPEED;
const SETTLE = 0.9; // how fast a fling blends back to the idle drift (per second)
const MAX_SPEED = 1400;
const BOOST = 520; // extra launch speed from a click
const TURN = 8; // how fast the nose swings round to face where it is going
const TAP_MS = 420; // a press shorter and stiller than this counts as a click
const TAP_SLOP = 8;
const TRAIL_SPEED = 220; // px/second before the exhaust starts leaving a wake
const TRAIL_GAP = 42; // ms between puffs
const TRAIL_POOL = 14; // reused nodes: no churn while it is flying
// Small: the ship sits under the page content, so a generous grab box would
// swallow clicks meant for whatever happens to be behind it.
const TOUCH_PAD = 6;

export default function Spaceship() {
  const nodeRef = useRef(null);
  const trailRef = useRef(null);

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
      travel: 0,
      touch: false,
      swallowClick: 0,
      pressT: 0,
      burstTimer: 0,
      puffIndex: 0,
      lastPuff: 0,
      last: 0,
      frame: 0,
    };

    // A small fixed pool of dots left behind the ship: recycled rather than
    // created and destroyed, so a fast flight does not allocate anything.
    const trail = trailRef.current;
    const puffs = [];
    if (trail) {
      for (let i = 0; i < TRAIL_POOL; i += 1) {
        const puff = document.createElement('span');
        puff.className = 'ship-puff';
        puff.style.opacity = '0';
        trail.appendChild(puff);
        puffs.push(puff);
      }
    }

    const puff = (speed, heading = state.angle) => {
      if (!puffs.length) return;
      const el = puffs[(state.puffIndex += 1) % puffs.length];
      const size = Math.min(9, 4 + speed / 260);
      const rad = ((heading - 90) * Math.PI) / 180;
      const back = state.h * 0.55;
      const x = state.x + state.w / 2 - Math.cos(rad) * back + (Math.random() - 0.5) * 3;
      const y = state.y + state.h / 2 - Math.sin(rad) * back + (Math.random() - 0.5) * 3;

      el.style.left = `${(x - size / 2).toFixed(1)}px`;
      el.style.top = `${(y - size / 2).toFixed(1)}px`;
      el.style.width = `${size.toFixed(1)}px`;
      el.style.height = `${size.toFixed(1)}px`;

      el.getAnimations().forEach((animation) => animation.cancel());
      el.animate(
        [
          { opacity: 0.6, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(0.3)' },
        ],
        { duration: 520, easing: 'ease-out' },
      );
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
        // Slow down towards the idle cruising speed while keeping the line it was
        // let go on. Pulling the velocity back towards the default vector as well
        // would bend every fling round to the up-right drift within a second.
        const moving = Math.hypot(state.vx, state.vy);
        const cruise = reduce ? 0 : IDLE_SPEED;
        const next = moving + (cruise - moving) * Math.min(1, dt * SETTLE);

        if (moving > 0.5) {
          const scale = next / moving;
          state.vx *= scale;
          state.vy *= scale;
        } else {
          state.vx = reduce ? 0 : IDLE_VX;
          state.vy = reduce ? 0 : IDLE_VY;
        }

        state.x += state.vx * dt;
        state.y += state.vy * dt;

        const w = window.innerWidth;
        const h = window.innerHeight;
        if (state.x > w) state.x = -state.w;
        else if (state.x < -state.w) state.x = w;
        if (state.y > h) state.y = -state.h;
        else if (state.y < -state.h) state.y = h;
      }

      // The nose always ends up pointing where the ship is actually going, which
      // is what makes the direction you flung or tapped it read at a glance.
      const speed = Math.hypot(state.vx, state.vy);
      if (speed > 6) {
        const target = Math.atan2(state.vy, state.vx) * (180 / Math.PI) + 90;
        const diff = ((target - state.angle + 540) % 360) - 180;
        state.angle += diff * Math.min(1, dt * TURN);
      }

      if (!reduce && speed > TRAIL_SPEED && now - state.lastPuff > TRAIL_GAP) {
        state.lastPuff = now;
        puff(speed);
      }

      node.classList.toggle('is-hot', state.hover || state.drag || speed > 60);
      paint();
      state.frame = requestAnimationFrame(step);
    };

    // A finger on the ship has to mean drag, not scroll. The ship is
    // pointer-events: none and sits under the content, so it can never be given
    // touch-action: none; swallowing the touchmove instead is what keeps the
    // page still while it is being pulled around.
    const blockScroll = (event) => {
      if (state.drag && event.cancelable) event.preventDefault();
    };

    const lockScroll = () => {
      if (state.touch) return;
      state.touch = true;
      window.addEventListener('touchmove', blockScroll, { passive: false });
    };

    const unlockScroll = () => {
      if (!state.touch) return;
      state.touch = false;
      window.removeEventListener('touchmove', blockScroll);
    };

    const onPointerDown = (event) => {
      if (event.button !== 0 || !hit(event.clientX, event.clientY)) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.pointerType !== 'mouse') lockScroll();
      state.drag = true;
      state.hover = true;
      state.grabX = event.clientX - state.x;
      state.grabY = event.clientY - state.y;
      state.vx = 0;
      state.vy = 0;
      state.samples = [{ x: event.clientX, y: event.clientY, t: performance.now() }];
      state.travel = 0;
      state.pressT = performance.now();
      node.classList.add('is-hover', 'is-dragging', 'is-hot');
      document.documentElement.style.cursor = 'grabbing';
      paint();
    };

    const onPointerMove = (event) => {
      if (state.drag) {
        const prev = state.samples[state.samples.length - 1];
        const now = performance.now();
        let moveSpeed = 0;
        let moveHeading = state.angle;
        if (prev) {
          const span = Math.max((now - prev.t) / 1000, 0.008);
          const dx = event.clientX - prev.x;
          const dy = event.clientY - prev.y;
          state.travel += Math.hypot(dx, dy);
          moveSpeed = Math.hypot(dx, dy) / span;
          moveHeading = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        }
        state.x = event.clientX - state.grabX;
        state.y = event.clientY - state.grabY;
        state.samples.push({ x: event.clientX, y: event.clientY, t: now });
        if (state.samples.length > 10) state.samples.shift();

        // Dragging it fast leaves the same wake a fling does. This runs straight
        // from the pointer event, so the trail keeps up even when animation
        // frames are being throttled.
        if (!reduce && moveSpeed > TRAIL_SPEED && now - state.lastPuff > TRAIL_GAP) {
          state.lastPuff = now;
          puff(moveSpeed, moveHeading);
        }
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

    // A click (press and let go without dragging) launches the ship along its
    // nose with a spin, which is the only way to tell it what to do on a device
    // where nothing happens on hover.
    const burst = () => {
      const rad = ((state.angle - 90) * Math.PI) / 180;
      const next = Math.min(MAX_SPEED, Math.max(Math.hypot(state.vx, state.vy), 120) + BOOST);
      state.vx = Math.cos(rad) * next;
      state.vy = Math.sin(rad) * next;
      // Point straight down the new line of travel rather than spinning, so the
      // direction of the launch is never in doubt.
      state.angle = (Math.atan2(state.vy, state.vx) * (180 / Math.PI) + 90 + 360) % 360;
      paint();

      node.classList.add('is-burst', 'is-hot');
      window.clearTimeout(state.burstTimer);
      state.burstTimer = window.setTimeout(() => node.classList.remove('is-burst'), 460);
    };

    const release = () => {
      if (!state.drag) return;
      state.drag = false;
      unlockScroll();
      node.classList.remove('is-dragging');
      const tap = performance.now() - state.pressT < TAP_MS && state.travel < TAP_SLOP;

      const now = performance.now();
      const recent = state.samples.filter((sample) => now - sample.t < 120);
      if (recent.length >= 2) {
        const first = recent[0];
        const last = recent[recent.length - 1];
        const span = Math.max((last.t - first.t) / 1000, 0.016);
        state.vx = (last.x - first.x) / span;
        state.vy = (last.y - first.y) / span;

        // Cap the speed, not each axis: clamping them one at a time warps a fast
        // diagonal fling towards 45 degrees and sends the ship off course.
        const speed = Math.hypot(state.vx, state.vy);
        if (speed > MAX_SPEED) {
          const ratio = MAX_SPEED / speed;
          state.vx *= ratio;
          state.vy *= ratio;
        }
      }

      // Face the way it was let go of straight away: a fling that kept its old
      // heading for a moment would look like it was ignoring the gesture.
      if (Math.hypot(state.vx, state.vy) > 40) {
        state.angle = (Math.atan2(state.vy, state.vx) * (180 / Math.PI) + 90 + 360) % 360;
        paint();
      }

      state.samples = [];
      if (tap) {
        // A tap on the ship must not also press whatever sits behind it.
        state.swallowClick = performance.now() + 400;
        burst();
      }
      node.classList.toggle('is-hot', state.hover);
      document.documentElement.style.cursor = state.hover ? 'grab' : '';
    };

    const onClick = (event) => {
      if (performance.now() > state.swallowClick) return;
      event.preventDefault();
      event.stopPropagation();
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
    window.addEventListener('click', onClick, { capture: true });
    document.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(state.frame);
      window.clearTimeout(state.burstTimer);
      unlockScroll();
      window.removeEventListener('pointerdown', onPointerDown, { capture: true });
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('click', onClick, { capture: true });
      document.removeEventListener('pointerleave', onLeave);
      document.documentElement.style.cursor = '';
      puffs.forEach((el) => el.remove());
    };
  }, []);

  return (
    <>
      <div ref={trailRef} className="ship-trail" aria-hidden="true" />
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
    </>
  );
}
