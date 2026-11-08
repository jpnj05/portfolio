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
const TURN = 10; // how fast the nose swings round to face where it is going
const DRAG_TURN = 13; // and how eagerly it follows the hand while being pulled
const DRAG_LEAD = 30; // px/second of hand movement before the nose starts turning
const HEADING_RATE = 20; // low-pass on the hand's heading, so the nose does not shiver
const FRAME_STALL = 120; // ms without a frame before events turn the ship instead
const TAP_MS = 420; // a press shorter and stiller than this counts as a click
const TAP_SLOP = 8;
const TRAIL_SPEED = 220; // px/second before the exhaust starts leaving a wake
const TRAIL_GAP = 42; // ms between puffs
const TRAIL_POOL = 14; // reused nodes: no churn while it is flying
// A couple of pixels of slack on the outline, no more: the ship sits under the
// page content, so a generous grab area would swallow clicks meant for whatever
// happens to be behind it.
const GRAB_SLOP = 2;
const HOVER_SCALE = 1.08; // must match .ship.is-hover .ship-hover
const DRAG_SCALE = 0.95; // and .ship.is-dragging .ship-hover

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
      dragHeading: null,
      headAt: 0,
      turnAt: 0,
      lastFrameAt: 0,
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

    // The drawn outline of the craft, as paths, so the grab area is the ship
    // itself rather than the empty corners of its box.
    const ctx = document.createElement('canvas').getContext('2d');
    let outlines = [];

    const measure = () => {
      // offsetWidth/Height: the rotated bounding box would otherwise be measured.
      state.w = node.offsetWidth || 36;
      state.h = node.offsetHeight || 56;
      outlines = [...node.querySelectorAll('.ship-hull, .ship-fin')]
        .map((part) => part.getAttribute('d'))
        .filter(Boolean)
        .map((d) => new Path2D(d));
    };

    // Rotate towards a heading the short way round, easing by elapsed time so the
    // turn looks the same whatever rate the pointer reports at.
    const turn = (target, dt, rate) => {
      const diff = ((target - state.angle + 540) % 360) - 180;
      state.angle += diff * Math.min(1, dt * rate);
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

    // Point against the ship's own rotated, scaled outline: undo the spin about
    // the centre, then test the pointer against the hull and fin paths.
    const hit = (x, y) => {
      if (!outlines.length) return false;

      const rad = (state.angle * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const dx = x - (state.x + state.w / 2);
      const dy = y - (state.y + state.h / 2);
      const scale = state.drag ? DRAG_SCALE : state.hover ? HOVER_SCALE : 1;
      const u = (dx * cos + dy * sin) / scale;
      const v = (-dx * sin + dy * cos) / scale;

      // Back into the 64 x 100 viewBox, where the paths live.
      const k = state.w / 64;
      const vx = u / k + 32;
      const vy = v / k + 50;
      const pad = GRAB_SLOP / k;

      return outlines.some((path) =>
        [[0, 0], [pad, 0], [-pad, 0], [0, pad], [0, -pad]].some(([ox, oy]) =>
          ctx.isPointInPath(path, vx + ox, vy + oy),
        ),
      );
    };

    const step = (now) => {
      const dt = state.last ? Math.min((now - state.last) / 1000, 0.05) : 0.016;
      state.last = now;
      state.lastFrameAt = now;

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

      // The nose follows the hand while it is held, and where the ship is actually
      // going once it is let go, swinging round gradually instead of snapping.
      const speed = Math.hypot(state.vx, state.vy);
      if (state.drag) {
        if (state.dragHeading !== null) turn(state.dragHeading, dt, DRAG_TURN);
      } else if (speed > 6) {
        turn(Math.atan2(state.vy, state.vx) * (180 / Math.PI) + 90, dt, TURN);
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
      state.dragHeading = null;
      state.headAt = 0;
      state.turnAt = 0;
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

        // Follow the hand, but averaged a little: raw pointer headings are noisy
        // at speed and would make the nose shiver. Time-based, so the smoothing
        // is the same whatever rate the pointer reports at.
        if (moveSpeed > DRAG_LEAD) {
          if (state.dragHeading === null) {
            state.dragHeading = moveHeading;
            state.headAt = now;
          } else {
            const gap = state.headAt ? Math.min((now - state.headAt) / 1000, 0.05) : 0.016;
            state.headAt = now;
            const diff = ((moveHeading - state.dragHeading + 540) % 360) - 180;
            state.dragHeading = (state.dragHeading + diff * (1 - Math.exp(-gap * HEADING_RATE)) + 360) % 360;
          }
        }

        // The turn itself is integrated in the animation loop, one place only, so
        // events and frames cannot add up into a double-speed spin. It falls back
        // to turning here only when frames have stalled, which keeps a drag
        // responsive in a background tab or on a busy main thread.
        if (state.dragHeading !== null && now - state.lastFrameAt > FRAME_STALL) {
          const gap = state.turnAt ? Math.min((now - state.turnAt) / 1000, 0.05) : 0.016;
          state.turnAt = now;
          turn(state.dragHeading, gap, DRAG_TURN);
        }

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

      // Preserve the heading the ship had when let go, so it coasts in that direction
      // instead of always reverting to the idle drift.  We only set this when the ship
      // has a meaningful velocity, so a light tap continues to settle to the idle state.
      const speed = Math.hypot(state.vx, state.vy);
      if (speed > 40) {
        state.dragHeading = Math.atan2(state.vy, state.vx) * (180 / Math.PI) + 90;
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
