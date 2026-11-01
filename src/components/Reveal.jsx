import { useEffect, useRef, useState } from 'react';

/**
 * Adds `.is-in` to an element the first time it enters the viewport, which is
 * what the CSS reveal transitions key off. One observer per node, torn down
 * on unmount.
 */
export function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.classList.add('is-in');
            setInView(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px', ...options },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin]);

  return { ref, inView };
}

export default function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const { ref } = useInView();

  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`.trim()}
      style={{ '--d': `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
