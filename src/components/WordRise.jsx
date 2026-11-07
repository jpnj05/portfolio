import { Children, cloneElement, isValidElement } from 'react';
import { useInView } from './Reveal.jsx';

/**
 * Splits a heading into words, each behind its own mask, and lifts them into
 * place one after another the first time the heading is scrolled into view.
 *
 * Splitting works on strings inside the children, so an <em> keeps its styling
 * and its words still join the same stagger. The words stay real text, so
 * selection, search and screen readers see the sentence rather than a pile of
 * spans.
 */
function splitWords(children, counter) {
  return Children.map(children, (child) => {
    if (typeof child === 'string') {
      return child
        .split(/(\s+)/)
        .filter(Boolean)
        .map((chunk) => {
          if (!chunk.trim()) return chunk;
          const index = counter.next;
          counter.next += 1;
          return (
            <span className="word-mask" key={`word-${index}`}>
              <span className="word" style={{ '--i': index }}>
                {chunk}
              </span>
            </span>
          );
        });
    }

    if (isValidElement(child)) {
      return cloneElement(child, {
        key: child.key ?? `node-${counter.next}`,
        children: splitWords(child.props.children, counter),
      });
    }

    return child;
  });
}

export default function WordRise({ as: Tag = 'h2', className = '', children, ...rest }) {
  const { ref } = useInView({ threshold: 0.2 });
  const counter = { next: 0 };

  return (
    <Tag ref={ref} className={`word-rise ${className}`.trim()} {...rest}>
      {splitWords(children, counter)}
    </Tag>
  );
}
