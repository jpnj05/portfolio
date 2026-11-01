import { useEffect, useRef } from 'react';
import { site } from '../data/site.js';
import Reveal from './Reveal.jsx';

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
        description: override.blurb || repo.description || 'No description yet — the code speaks for itself.',
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
          <div className="project-cover">
            <span className="project-cover-mark">Repository</span>
            <span className="project-cover-name">{project.title}</span>
            <span className="project-cover-meta">
              github.com/{site.githubUser} · {project.language || 'code'}
            </span>
          </div>
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

export default function Projects({ data }) {
  const projects = buildProjects(data);
  const ordered = [...projects.filter((p) => p.featured), ...projects.filter((p) => !p.featured)];
  const loading = !data;

  return (
    <section className="section" id="work">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="kicker">01 — Selected work</p>
            <h2 className="section-title">
              Things I shipped, <em>live</em> and readable.
            </h2>
          </div>
          <p className="section-lead">
            Pulled from GitHub, so it stays current. Each card links to the running build and the
            source.
          </p>
        </div>

        <div className="project-grid">
          {loading &&
            [0, 1].map((index) => <div className="skeleton-card" key={index} aria-hidden="true" />)}

          {!loading &&
            ordered.map((project, index) => {
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
