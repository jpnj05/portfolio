import { useEffect } from 'react';

/** Slim reading-progress line pinned to the top of the page. */
export default function ScrollProgress() {
  useEffect(() => {
    const bar = document.getElementById('progress-bar');
    if (!bar) return undefined;

    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      // A bare number: the bar scales itself, so no layout on every scroll frame.
      bar.style.setProperty('--p', ratio.toFixed(4));
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
