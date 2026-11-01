import { useEffect, useRef } from 'react';

/**
 * Small wrapper that nudges a link/button toward the cursor while hovering.
 * Falls back to a plain element on touch and reduced-motion setups.
 */
export default function Magnetic({ children, className = '', strength = 8, ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let frame = 0;

    const onMove = (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = node.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * strength * 2;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * strength;
        node.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      });
    };

    const onLeave = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      node.style.transform = '';
    };

    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerleave', onLeave);
    return () => {
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [strength]);

  return (
    <a ref={ref} className={className} {...rest}>
      {children}
    </a>
  );
}
