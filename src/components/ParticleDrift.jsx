import { useEffect, useRef } from 'react';

/**
 * Slow-drifting dots for the fixed background layer.
 *
 * Colours come from the live CSS custom properties (--accent-rgb, --mint), so the
 * field re-tints with the palette instead of hard-coding a violet. Nothing here
 * touches layout or input: the canvas is pointer-events: none and sits under the
 * grid. The loop stays off entirely for prefers-reduced-motion and when the tab
 * is hidden, and the particle budget is capped so phones do not pay for a desktop
 * count. Every so often a shooting star crosses the field.
 */

// Dots travel this many pixels per pixel of page scroll: enough to read as depth
// under the content, far too little to look like a second scrollbar.
const PARALLAX = 0.06;

const AREA_PER_PARTICLE = 26000;
const MIN_PARTICLES = 22;
const MAX_PARTICLES = 96;
const MAX_DPR = 2;

// A shooting star is a rare event on purpose: seen once every ten seconds or so
// it reads as a wink, seen constantly it turns the background into a screensaver.
const STREAK_FIRST = [2.5, 5.5];
const STREAK_GAP = [7, 17];

const parseHex = (value) => {
  const hex = value.replace('#', '').trim();
  if (hex.length === 3) return [...hex].map((char) => parseInt(char + char, 16));
  if (hex.length === 6) return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return [159, 227, 201];
};

export default function ParticleDrift() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return undefined;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    let particles = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frameId = 0;
    let lastTime = 0;
    let elapsed = 0;
    let palette = { accent: '179, 164, 255', mint: '159, 227, 201', strength: 1, radius: 1 };
    let streak = null;
    let nextStreak = STREAK_FIRST[0] + Math.random() * (STREAK_FIRST[1] - STREAK_FIRST[0]);

    const readPalette = () => {
      const styles = getComputedStyle(document.documentElement);
      const accent = styles.getPropertyValue('--accent-rgb').trim();
      const mint = parseHex(styles.getPropertyValue('--mint'));
      const isLight = document.documentElement.dataset.theme === 'light';
      palette = {
        accent: accent || '179, 164, 255',
        mint: mint.join(', '),
        // Pale dots vanish against paper, so light mode gets a heavier mix and
        // slightly larger dots. Kept close to 1: at 1.35 the contrast against
        // #f6f4fc made the field read busier than the dark one.
        strength: isLight ? 1.1 : 1,
        radius: isLight ? 1.15 : 1,
      };
    };

    const spawn = (count) => {
      particles = Array.from({ length: count }, (_, index) => {
        const radius = 0.7 + Math.random() * 1.5;
        const speed = 0.06 + Math.random() * 0.16;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: radius,
          vx: (Math.random() - 0.5) * speed * 2,
          vy: -speed * (0.35 + Math.random() * 0.8),
          phase: Math.random() * Math.PI * 2,
          wobble: 0.1 + Math.random() * 0.35,
          alpha: 0.16 + Math.random() * 0.34,
          mint: index % 5 === 0,
        };
      });
    };

    const spawnStreak = () => {
      // Enters high and left of the subject, falling at a shallow angle so it
      // reads as a meteor rather than a diagonal scratch across the copy.
      const angle = (20 + Math.random() * 16) * (Math.PI / 180);
      const speed = 15 + Math.random() * 8;
      streak = {
        x: -width * 0.15 + Math.random() * width * 0.95,
        y: -80 + Math.random() * height * 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        tail: 130 + Math.random() * 110,
        width: 1 + Math.random() * 0.8,
        life: 1 + Math.random() * 0.5,
        age: 0,
      };
      nextStreak = elapsed + STREAK_GAP[0] + Math.random() * (STREAK_GAP[1] - STREAK_GAP[0]);
    };

    const drawStreak = () => {
      const progress = streak.age / streak.life;
      // Fade in fast, out slow, so the head never pops into existence.
      const envelope = Math.max(0, Math.min(1, Math.min(progress / 0.16, (1 - progress) / 0.4)));
      if (envelope <= 0) return;

      const speed = Math.hypot(streak.vx, streak.vy) || 1;
      const tailX = streak.x - (streak.vx / speed) * streak.tail;
      const tailY = streak.y - (streak.vy / speed) * streak.tail;
      const alpha = Math.min(0.9, 0.8 * envelope) * palette.strength;

      const gradient = ctx.createLinearGradient(streak.x, streak.y, tailX, tailY);
      gradient.addColorStop(0, `rgba(${palette.accent}, ${alpha.toFixed(3)})`);
      gradient.addColorStop(0.55, `rgba(${palette.accent}, ${(alpha * 0.28).toFixed(3)})`);
      gradient.addColorStop(1, `rgba(${palette.accent}, 0)`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = streak.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(streak.x, streak.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      // A slightly brighter head keeps the streak from ending in a soft blur.
      ctx.fillStyle = `rgba(${palette.accent}, ${Math.min(1, alpha * 1.15).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(streak.x, streak.y, streak.width * 0.85, 0, Math.PI * 2);
      ctx.fill();
    };

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      width = Math.max(box.width, 1);
      height = Math.max(box.height, 1);
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const budget = Math.round((width * height) / AREA_PER_PARTICLE);
      const count = Math.max(MIN_PARTICLES, Math.min(MAX_PARTICLES, budget));
      spawn(count);
      draw(0, true);
    };

    function draw(delta, still) {
      ctx.clearRect(0, 0, width, height);

      // The canvas is fixed, so the field slides against the page by wrapping the
      // scroll offset through its own height. No transform, no gaps at the edges.
      let offset = (window.scrollY * PARALLAX) % height;
      if (offset < 0) offset += height;

      for (const particle of particles) {
        if (!still) {
          particle.x += particle.vx * delta;
          particle.y += particle.vy * delta;

          if (particle.y < -8) {
            particle.y = height + 8;
            particle.x = Math.random() * width;
          }
          if (particle.x < -8) particle.x = width + 8;
          else if (particle.x > width + 8) particle.x = -8;
        }

        const drift = still ? 0 : Math.sin(elapsed * 0.4 + particle.phase) * particle.wobble;
        const x = particle.x + drift;
        let y = particle.y - offset;
        if (y < 0) y += height;
        const fade = still ? particle.alpha : particle.alpha * (0.75 + 0.25 * Math.sin(elapsed * 0.6 + particle.phase));

        ctx.fillStyle = `rgba(${particle.mint ? palette.mint : palette.accent}, ${(fade * palette.strength).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, particle.r * palette.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (still) return;

      if (streak) {
        streak.age += delta / 60;
        streak.x += streak.vx * delta;
        streak.y += streak.vy * delta;
        if (streak.age > streak.life || streak.x - streak.tail > width || streak.y - streak.tail > height) {
          streak = null;
        } else {
          drawStreak();
        }
      }

      if (!streak && elapsed > nextStreak) spawnStreak();
    }

    const tick = (time) => {
      const delta = lastTime ? Math.min((time - lastTime) / 16.667, 3) : 1;
      lastTime = time;
      elapsed += delta / 60;
      draw(delta, false);
      frameId = requestAnimationFrame(tick);
    };

    const start = () => {
      if (frameId || motionQuery.matches || document.hidden) return;
      lastTime = 0;
      frameId = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (!frameId) return;
      cancelAnimationFrame(frameId);
      frameId = 0;
    };

    const sync = () => {
      if (motionQuery.matches || document.hidden) {
        stop();
        draw(0, true);
      } else {
        start();
      }
    };

    readPalette();
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const themeObserver = new MutationObserver(() => {
      readPalette();
      if (!frameId) draw(0, true);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    document.addEventListener('visibilitychange', sync);
    motionQuery.addEventListener('change', sync);
    sync();

    return () => {
      stop();
      observer.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', sync);
      motionQuery.removeEventListener('change', sync);
    };
  }, []);

  return <canvas ref={canvasRef} className="particles" aria-hidden="true" />;
}
