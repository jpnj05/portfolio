// The strip that runs under the hero: what he actually builds with, in the same
// order the skills matrix lists it. Keep it to a handful of concrete tools, the
// vague ones ("Details", "Interfaces") read as filler at this size.
const WORDS = ['React', 'Node.js', 'Flutter', 'Python', 'REST APIs', 'Firebase'];

/** Roughly how long one word takes to cross, so longer lists do not race. */
const SECONDS_PER_WORD = 4.4;

export default function Marquee({ items = WORDS, reverse = false, filled = 0 }) {
  // One half of the track has to be wider than the widest screen, otherwise the
  // -50% loop would run out of words and flash an empty gap. Repeat the list
  // until it comfortably overflows, then render the identical set twice.
  const passes = Math.max(1, Math.ceil(24 / items.length));
  const half = Array.from({ length: passes }, () => items).flat();
  const run = [...half, ...half];

  return (
    <div className={`marquee ${reverse ? 'marquee--reverse' : ''}`} aria-hidden="true">
      <div
        className="marquee-track"
        style={{ animationDuration: `${Math.round(half.length * SECONDS_PER_WORD)}s` }}
      >
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
