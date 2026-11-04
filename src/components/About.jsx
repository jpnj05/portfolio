import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

function CloseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ResumeCard() {
  const { file, updated, note } = site.resume;
  const education = site.timeline.filter((item) => item.kind === 'Education');
  const work = Object.values(site.projectOverrides).filter((project) => project.title).slice(0, 2);

  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      // Keep Tab inside the dialog while it is open. Anything inside the PDF
      // <object> is its own browsing context, so it is left out of the cycle.
      const focusable = [
        ...panelRef.current.querySelectorAll('a[href], button:not([disabled])'),
      ].filter((element) => !element.closest('object') && element.getClientRects().length > 0);
      if (!focusable.length) return;

      const index = focusable.indexOf(document.activeElement);
      const last = focusable.length - 1;

      if (index === -1) {
        event.preventDefault();
        (event.shiftKey ? focusable[last] : focusable[0]).focus();
      } else if (event.shiftKey && index === 0) {
        event.preventDefault();
        focusable[last].focus();
      } else if (!event.shiftKey && index === last) {
        event.preventDefault();
        focusable[0].focus();
      }
    };
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    closeRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    const closing = wasOpen.current && !open;
    wasOpen.current = open;
    if (!closing) return undefined;

    // Wait for the browser's own focus cleanup after the dialog unmounts.
    const id = window.setTimeout(() => triggerRef.current?.focus({ preventScroll: true }), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  return (
    <Reveal className="resume-card" delay={120}>
      <a
        className="resume-preview"
        href={file}
        ref={triggerRef}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Open the résumé preview"
        onClick={(event) => {
          event.preventDefault();
          setOpen(true);
        }}
      >
        <div className="resume-page" aria-hidden="true">
          <p className="rp-name">{site.name}</p>
          <p className="rp-role">{site.role}</p>
          <p className="rp-contact">
            {site.email} · github.com/{site.githubUser} · {site.location}
          </p>

          <span className="rp-rule" />

          <p className="rp-label">Profile</p>
          <p className="rp-body">{site.tagline}</p>

          <p className="rp-label">Education</p>
          {education.map((item) => (
            <span className="rp-row" key={item.title}>
              <span className="rp-row-title">{item.title}</span>
              <span className="rp-row-meta">{item.when}</span>
              <span className="rp-row-sub">{item.org}</span>
            </span>
          ))}

          <p className="rp-label">Skills</p>
          <p className="rp-body">
            {site.skills.map((group) => group.items.join(', ')).join('   ·   ')}
          </p>

          <p className="rp-label">Selected work</p>
          {work.map((project) => (
            <p className="rp-body" key={project.title}>
              <b>{project.title}</b>
              {project.tags?.length ? ` — ${project.tags.join(', ')}` : ''}
            </p>
          ))}
        </div>

        <span className="resume-open">
          Open PDF <ArrowUpRight />
        </span>
      </a>

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

      {open &&
        createPortal(
          <div
            className="resume-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Résumé"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <div className="resume-modal-panel" ref={panelRef}>
              <div className="resume-modal-bar">
                <p className="resume-modal-title mono">
                  Résumé <span>{note}</span>
                </p>

                <div className="resume-modal-actions">
                  <a
                    className="resume-modal-link mono"
                    href={file}
                    target="_blank"
                    rel="noreferrer"
                  >
                    New tab <ArrowUpRight />
                  </a>
                  <a className="btn resume-download" href={file} download>
                    Download <DownloadIcon />
                  </a>
                  <button
                    type="button"
                    className="resume-modal-close"
                    ref={closeRef}
                    onClick={() => setOpen(false)}
                    aria-label="Close résumé"
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>

              <div className="resume-modal-body">
                <object
                  data={`${file}#view=FitH&toolbar=0&navpanes=0`}
                  type="application/pdf"
                  title="Résumé PDF"
                >
                  <div className="resume-modal-fallback">
                    <p>This browser cannot display PDFs inline.</p>
                    <a className="btn resume-download" href={file} download>
                      Download the PDF <DownloadIcon />
                    </a>
                  </div>
                </object>
              </div>
            </div>
          </div>,
          document.body,
        )}
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
