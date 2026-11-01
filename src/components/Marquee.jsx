const WORDS = ['React', 'Node.js', 'Interfaces', 'Motion', 'APIs', 'Details'];

export default function Marquee({ items = WORDS, reverse = false, filled = 0 }) {
  const run = [...items, ...items];

  return (
    <div className={`marquee ${reverse ? 'marquee--reverse' : ''}`} aria-hidden="true">
      <div className="marquee-track">
        {run.map((word, index) => (
          <span className="marquee-word" key={`${word}-${index}`}>
            <span className={index % 2 === filled ? 'filled' : undefined}>{word}</span>
            <span className="dot" />
          </span>
        ))}
      </div>
    </div>
  );
}
