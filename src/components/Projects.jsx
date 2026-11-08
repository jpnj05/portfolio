import { useEffect, useRef, useState } from 'react';
import { site } from '../data/site.js';
import Reveal from './Reveal.jsx';
import WordRise from './WordRise.jsx';

const TOP_COUNT = 5;

const ArrowUpRight = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M3.5 10.5 10.5 3.5M10.5 3.5H4.7M10.5 3.5v5.8"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CodeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Chevron = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path
      d="M2.5 4.5 6 8l3.5-3.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Preview slot for a school work. A real screenshot wins; without one the card
 * carries the project's own banner, drawn in vectors so it stays sharp at any
 * card width.
 */
function SchoolCover({ work }) {
  if (work.preview) {
    return (
      <div className="school-cover">
        <img src={work.preview} alt={work.coverAlt || ''} loading="lazy" decoding="async" />
      </div>
    );
  }

  return (
    <div className="school-cover">
      {/* Backdrop only. It is abstract on purpose, so it can stretch to fill
          whatever width the card happens to be without distorting a shape. */}
      <svg
        className="school-banner-bg"
        viewBox="0 0 792 370"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="cf-base" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="#cddfae" />
            <stop offset="100%" stopColor="#c1d5a1" />
          </linearGradient>
        </defs>
        <rect width="792" height="370" fill="url(#cf-base)" />
        <path
          className="cf-sage"
          d="M104 -20C46 58 20 132 40 202C58 264 112 322 196 392L812 392L812 -20Z"
        />
        <path className="cf-sheen" d="M-40 -20L160 -20L26 336L-40 342Z" />
      </svg>

      {/* Mark and wordmark, held at the banner's own proportions. */}
      <svg className="school-banner" viewBox="0 0 792 370" aria-hidden="true">
        <defs>
          <radialGradient id="cf-coin" cx="0.38" cy="0.3" r="0.75">
            <stop offset="0%" stopColor="#ffeda8" />
            <stop offset="60%" stopColor="#fcd070" />
            <stop offset="100%" stopColor="#f2b64c" />
          </radialGradient>
        </defs>

        <g transform="translate(120 148)">
          <circle r="76" className="cf-coin-rim" />
          <circle cx="-3" cy="-2" r="74" fill="url(#cf-coin)" />
          <circle r="59" className="cf-coin-ring" />
          <text className="cf-coin-glyph" x="1" y="2" textAnchor="middle" dominantBaseline="central">
            $
          </text>
        </g>

        <text className="cf-mark" x="228" y="196">
          CashFlow
        </text>
        <text className="cf-line" x="461" y="256" textAnchor="middle">
          AI Powered Cash Flow Forecaster
        </text>
        <text className="cf-line" x="461" y="296" textAnchor="middle">
          for Small Businesses
        </text>

        <path className="cf-spark" d="M638 76L664 26" />
        <path className="cf-spark" d="M694 72L697 22" />
        <path className="cf-spark" d="M750 82L730 38" />
      </svg>
    </div>
  );
}

function tiltHandlers(node) {
  if (!node) return () => {};
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {};
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  let frame = 0;

  const move = (event) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      node.style.setProperty('--rx', `${((0.5 - y) * 6).toFixed(2)}deg`);
      node.style.setProperty('--ry', `${((x - 0.5) * 8).toFixed(2)}deg`);
      node.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      node.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    });
  };

  const reset = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    node.style.setProperty('--rx', '0deg');
    node.style.setProperty('--ry', '0deg');
    node.style.setProperty('--mx', '50%');
    node.style.setProperty('--my', '50%');
  };

  node.addEventListener('pointermove', move);
  node.addEventListener('pointerleave', reset);

  return () => {
    node.removeEventListener('pointermove', move);
    node.removeEventListener('pointerleave', reset);
    if (frame) cancelAnimationFrame(frame);
  };
}

function buildProjects(data) {
  const repos = data?.repos ?? [];
  const overrides = site.projectOverrides || {};

  return repos
    .filter((repo) => !(site.hiddenRepos || []).includes(repo.name))
    .map((repo) => {
      const override = overrides[repo.name] || {};
      const year = repo.pushedAt ? new Date(repo.pushedAt).getFullYear() : null;
      // GitHub picks a language by byte count, which misreads bundled web
      // output (Flutter/React builds) — an override always wins.
      const language = override.language || repo.language;

      return {
        key: repo.fullName || repo.name,
        title: override.title || repo.name.replace(/[-_]/g, ' '),
        description: override.blurb || repo.description || 'No description yet. The code speaks for itself.',
        // Only real screenshots are used; repos without one get a generated cover.
        preview: override.preview || '',
        tags: (override.tags || [...(repo.topics || []), language].filter(Boolean)).slice(0, 4),
        live: Object.prototype.hasOwnProperty.call(override, 'live')
          ? override.live
          : repo.homepage || '',
        source: repo.url,
        stars: repo.stars,
        language,
        year,
        featured: Boolean(override.featured),
      };
    })
    .concat(site.extraProjects || []);
}

function ProjectCard({ project, featured = false }) {
  const ref = useRef(null);

  useEffect(() => tiltHandlers(ref.current), []);

  return (
    <article ref={ref} className={`project-card ${featured ? 'project-card--featured' : ''}`}>
      <a
        className="project-media"
        href={project.live || project.source}
        target="_blank"
        rel="noreferrer"
        tabIndex={-1}
        aria-hidden="true"
      >
        <span className="project-badge">
          <span className="lang-dot" />
          {project.language || project.tags[0] || 'Code'}
        </span>
        {project.preview ? (
          <img
            src={project.preview}
            alt=""
            loading="lazy"
            decoding="async"
            width="1280"
            height="800"
          />
        ) : (
          <div className="project-cover" />
        )}
      </a>

      <div className="project-body">
        {featured && <span className="featured-flag">★ Featured build</span>}

        <div className="project-topline">
          <h3 className="project-title">
            <a href={project.live || project.source} target="_blank" rel="noreferrer">
              {project.title}
            </a>
          </h3>
          {project.year && <span className="project-year">{project.year}</span>}
        </div>

        <p className="project-desc">{project.description}</p>

        <ul className="project-tags">
          {project.tags.map((tag) => (
            <li className="tag" key={tag}>
              {tag}
            </li>
          ))}
        </ul>

        <div className="project-links">
          {project.live && (
            <a className="link-arrow" href={project.live} target="_blank" rel="noreferrer">
              Live demo <ArrowUpRight />
            </a>
          )}
          <a className="link-arrow" href={project.source} target="_blank" rel="noreferrer">
            <CodeIcon /> Source
          </a>
          {typeof project.stars === 'number' && project.stars > 0 && (
            <span className="mono">★ {project.stars}</span>
          )}
        </div>
      </div>
    </article>
  );
}

/** Dense directory view of every repository, opened from the toggle below the grid. */
function RepoList({ projects, id }) {
  return (
    <ul className="repo-list" id={id}>
      {projects.map((project, index) => (
        <li className="repo-row" key={project.key} style={{ '--i': index }}>
          <span className="repo-index">{String(index + 1).padStart(2, '0')}</span>

          <div className="repo-main">
            <a
              className="repo-name"
              href={project.source}
              target="_blank"
              rel="noreferrer"
            >
              {project.title}
            </a>
            <p className="repo-blurb">{project.description}</p>
          </div>

          <span className="repo-meta">
            {(project.language || project.tags[0]) && (
              <span>
                <span className="lang-dot" />
                {project.language || project.tags[0]}
              </span>
            )}
            {project.year && <span>{project.year}</span>}
          </span>

          <a
            className="repo-open"
            href={project.live || project.source}
            target="_blank"
            rel="noreferrer"
            aria-label={`${project.live ? 'Open' : 'Open source of'} ${project.title}`}
            title={project.live ? 'Live demo' : 'View source'}
          >
            <ArrowUpRight />
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function Projects({ data }) {
  const [showAll, setShowAll] = useState(false);
  const projects = buildProjects(data);
  const ordered = [...projects.filter((p) => p.featured), ...projects.filter((p) => !p.featured)];
  const top = ordered.slice(0, TOP_COUNT);
  const loading = !data;
  const listId = 'all-repositories';

  return (
    <section className="section" id="work">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="kicker">02 · Work</p>
            <WordRise className="section-title">
              Things I shipped, <em>live</em> and readable.
            </WordRise>
          </div>
          <p className="section-lead">
            The five builds I would hand you first, pulled from GitHub so they stay current. The
            rest of the repos are one click away.
          </p>
        </div>

        <div className="project-grid">
          {loading &&
            [0, 1].map((index) => <div className="skeleton-card" key={index} aria-hidden="true" />)}

          {!loading &&
            top.map((project, index) => {
              const featured = project.featured || (ordered.length === 1 && index === 0);
              return (
                <Reveal
                  key={project.key}
                  delay={index * 90}
                  className={featured ? 'project-slot project-slot--featured' : 'project-slot'}
                >
                  <ProjectCard project={project} featured={featured} />
                </Reveal>
              );
            })}
        </div>

        {!loading && !ordered.length && (
          <div className="empty-note">
            Repos are still loading from GitHub. If this sticks, check the network tab or run{' '}
            <code>npm run snapshot</code> to refresh the offline copy.
          </div>
        )}

        {!loading && ordered.length > 0 && (
          <div className="repos-more">
            <button
              type="button"
              className="repos-toggle"
              aria-expanded={showAll}
              aria-controls={listId}
              onClick={() => setShowAll((value) => !value)}
            >
              {showAll ? 'Hide the full list' : 'See all work'}
              <span className="repos-count">{ordered.length} repos</span>
              <Chevron />
            </button>

            {showAll && <RepoList projects={ordered} id={listId} />}
          </div>
        )}

        {site.schoolWorks?.length > 0 && (
          <div className="school">
            <div className="school-head">
              <h3 className="school-title">School works</h3>
              <p className="school-note">
                Coursework and capstone work, with the phases that actually went into them.
              </p>
            </div>

            <div className="school-list">
              {site.schoolWorks.map((work) => (
                <article className="school-card" key={work.title}>
                  <SchoolCover work={work} />

                  <div className="school-split">
                    <div className="school-body">
                      <div className="school-topline">
                        <span className="school-kind">{work.kind}</span>
                        {work.when && <span className="school-when">{work.when}</span>}
                      </div>

                      <h4 className="school-name">{work.title}</h4>
                      {work.subtitle && <p className="school-sub">{work.subtitle}</p>}
                      <p className="school-blurb">{work.blurb}</p>

                      {work.highlights?.length > 0 && (
                        <ul className="project-tags school-tags">
                          {work.highlights.map((tag) => (
                            <li className="tag" key={tag}>
                              {tag}
                            </li>
                          ))}
                        </ul>
                      )}

                      {work.team && (
                        <p className="school-team">
                          <span>Team</span> {work.team}
                        </p>
                      )}
                    </div>

                    <ol className="school-steps">
                      {work.activities.map((activity) => (
                        <li className="school-step" key={activity.what}>
                          <span className="school-week">{activity.when}</span>
                          <span className="school-what">{activity.what}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        <div className="projects-foot">
          <span>
            {data?.repos?.length
              ? `${data.repos.length} public repo${data.repos.length === 1 ? '' : 's'} · updated ${data.fetchedAt ? new Date(data.fetchedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'live'}`
              : 'Loading repository list…'}
          </span>
          <a
            className="link-arrow"
            href={`https://github.com/${site.githubUser}?tab=repositories`}
            target="_blank"
            rel="noreferrer"
          >
            All repositories <ArrowUpRight />
          </a>
        </div>
      </div>
    </section>
  );
}
