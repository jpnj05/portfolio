import { useEffect, useState } from 'react';
import { site } from '../data/site.js';
import { useCountUp } from '../hooks/useCountUp.js';
import Magnetic from './Magnetic.jsx';

const ArrowUpRight = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M3.5 10.5 10.5 3.5M10.5 3.5H4.7M10.5 3.5v5.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Split into words, then letters, so a long name wraps between words instead
// of breaking mid-word — the stagger index runs across the whole name.
const WORDS = (() => {
  let index = 0;
  return site.name
    .trim()
    .split(/\s+/)
    .map((word) => [...word].map((char) => ({ char, index: index++ })));
})();

export default function Hero({ data }) {
  const [roleIndex, setRoleIndex] = useState(0);
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || site.roles.length < 2) return undefined;
    const timer = setInterval(() => setRoleIndex((index) => (index + 1) % site.roles.length), 3200);
    return () => clearInterval(timer);
  }, []);

  const repos = data?.repos?.length ?? null;
  const contributions = data?.contributions?.total ?? null;
  const stars = data?.repos?.reduce((sum, repo) => sum + (repo.stars || 0), 0) ?? null;

  const [repoRef, repoCount] = useCountUp(repos, { duration: 1100 });
  const [contribRef, contribCount] = useCountUp(contributions, { duration: 1400 });
  const [starRef, starCount] = useCountUp(stars, { duration: 900 });

  const avatar = site.avatar && !photoFailed ? site.avatar : data?.profile?.avatar;

  return (
    <section className="hero" id="top">
      <div className="hero-inner">
        <div className="hero-main">
          <div>
            <p className="hero-hello">Hey, I&apos;m</p>
            <h1 className="hero-name" aria-label={site.name}>
              {WORDS.map((word, wordIndex) => (
                <span className="hero-word" key={wordIndex}>
                  {word.map(({ char, index }) => (
                    <span
                      key={`${char}-${index}`}
                      className={`hero-letter ${wordIndex === WORDS.length - 1 ? 'accent' : ''}`}
                      style={{ '--i': index }}
                      aria-hidden="true"
                    >
                      {char}
                    </span>
                  ))}
                </span>
              ))}
            </h1>
            <p className="hero-role">
              <span key={roleIndex} className="role-swap">
                {site.roles[roleIndex]}
              </span>
            </p>
            <p className="hero-tagline">{site.tagline}</p>

            <div className="hero-actions">
              <Magnetic className="btn btn-primary" href="#work">
                See the work
                <ArrowUpRight />
              </Magnetic>
              <Magnetic
                className="btn btn-ghost"
                href={`https://github.com/${site.githubUser}`}
                target="_blank"
                rel="noreferrer"
              >
                GitHub
                <ArrowUpRight />
              </Magnetic>
            </div>
          </div>

          <div className="hero-orb" aria-hidden="true">
            <svg className="orb-ring" viewBox="0 0 200 200">
              <defs>
                <path
                  id="orb-circle"
                  d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0"
                />
              </defs>
              <text>
                <textPath href="#orb-circle" startOffset="0%">
                  {site.role} · {site.location} · React · Node · Flutter ·
                </textPath>
              </text>
            </svg>
            <div className="orb-avatar">
              {avatar ? (
                <img
                  src={avatar}
                  alt={site.name}
                  width="512"
                  height="512"
                  onError={() => setPhotoFailed(true)}
                />
              ) : (
                <span>{site.name.slice(0, 1)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat" ref={repoRef}>
            <div className="stat-value">{repos === null ? '···' : repoCount}</div>
            <div className="stat-label">Public repos</div>
          </div>
          <div className="stat" ref={contribRef}>
            <div className="stat-value">{contributions === null ? '···' : contribCount}</div>
            <div className="stat-label">Contributions</div>
          </div>
          <div className="stat" ref={starRef}>
            <div className="stat-value">{stars === null ? '···' : starCount}</div>
            <div className="stat-label">Repo stars</div>
          </div>
        </div>

        <div className="hero-scroll">
          <span className="rail" />
          Scroll to explore
        </div>
      </div>
    </section>
  );
}
