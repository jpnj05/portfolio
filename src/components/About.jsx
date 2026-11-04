import { site } from '../data/site.js';
import Reveal from './Reveal.jsx';

function ArrowUpRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 12 12 4M12 4H5.5M12 4v6.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 2v8m0 0 3-3m-3 3L5 7M3 13h10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ResumeCard() {
  const { file, updated, note } = site.resume;

  return (
    <Reveal className="resume-card" delay={120}>
      <div className="resume-preview">
        <object
          data={`${file}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          type="application/pdf"
          title="Résumé preview"
        >
          <div className="resume-fallback">
            <span className="resume-fallback-tag mono">PDF</span>
            <p>This browser cannot preview PDFs inline, but the file is one tap away.</p>
            <a className="link-arrow" href={file} target="_blank" rel="noreferrer">
              Open the résumé <ArrowUpRight />
            </a>
          </div>
        </object>
      </div>

      <div className="resume-meta">
        <div className="resume-meta-text">
          <p className="resume-label mono">Résumé</p>
          <p className="resume-note">
            {note} <span className="resume-updated mono">Updated {updated}</span>
          </p>
        </div>
        <a className="btn resume-download" href={file} download>
          Download PDF <DownloadIcon />
        </a>
      </div>
    </Reveal>
  );
}

export default function About({ data }) {
  const joined = data?.profile?.createdAt
    ? new Date(data.profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  return (
    <section className="section" id="about">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="kicker">02 — About</p>
            <h2 className="section-title">
              A developer with a <em>detail problem</em>.
            </h2>
          </div>
          <p className="section-lead">
            Short version: I like building things that load fast, feel responsive, and do not need
            an instruction manual.
          </p>
        </div>

        <div className="about-top">
          <Reveal className="about-copy">
            <p className="kicker">Biography</p>
            {site.about.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            <div className="about-facts">
              <span className="fact">
                Based in <b>{site.location}</b>
              </span>
              {joined && (
                <span className="fact">
                  On GitHub since <b>{joined}</b>
                </span>
              )}
              <span className="fact">
                Focus <b>React + Node</b>
              </span>
            </div>
          </Reveal>

          <ResumeCard />
        </div>

        <div className="about-part">
          <div className="about-subhead">
            <p className="kicker">Background</p>
            <h3 className="about-h3">Experience &amp; education</h3>
            <p className="about-subnote">Newest first — where I am now, and how I got here.</p>
          </div>

          <ol className="timeline">
            {site.timeline.map((item) => (
              <li
                className={`timeline-item${item.current ? ' is-current' : ''}`}
                key={`${item.kind}-${item.title}`}
              >
                <span className="timeline-dot" aria-hidden="true" />
                <span className="timeline-when mono">{item.when}</span>
                <div className="timeline-body">
                  <p className="timeline-kind mono">{item.kind}</p>
                  <h4>{item.title}</h4>
                  <p className="timeline-org">{item.org}</p>
                  {item.note && <p className="timeline-note">{item.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="about-part">
          <div className="about-subhead">
            <p className="kicker">Toolbox</p>
            <h3 className="about-h3">Skills &amp; tools</h3>
            <p className="about-subnote">
              {site.skills.reduce((total, group) => total + group.items.length, 0)} tools across{' '}
              {site.skills.length} groups — the stack I actually build with.
            </p>
          </div>

          <div className="matrix">
            {site.skills.map((group, index) => (
              <Reveal className="matrix-cell" key={group.group} delay={index * 50}>
                <span className="matrix-index mono">{String(index + 1).padStart(2, '0')}</span>
                <h4>{group.group}</h4>
                <ul className="chips">
                  {group.items.map((item) => (
                    <li className="chip" key={item}>
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
