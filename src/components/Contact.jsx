import { useEffect, useState } from 'react';
import { site } from '../data/site.js';
import Reveal from './Reveal.jsx';

const ArrowUpRight = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M3.5 10.5 10.5 3.5M10.5 3.5H4.7M10.5 3.5v5.8"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function Contact() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2200);
    return () => clearTimeout(timer);
  }, [copied]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
    } catch {
      window.location.href = `mailto:${site.email}`;
    }
  };

  return (
    <section className="section contact" id="contact">
      <div className="wrap">
        <Reveal className="contact-inner">
          <p className="contact-eyebrow">04 — Contact</p>
          <h2 className="contact-title">
            Got something worth <em>building</em>?
          </h2>
          <p className="section-lead" style={{ textAlign: 'center', maxWidth: '46ch' }}>
            I read everything. Send a project, a role, or just a question — I usually reply within a
            day.
          </p>

          <div className="contact-actions">
            <a className="btn btn-primary" href={`mailto:${site.email}`}>
              {site.email}
              <ArrowUpRight />
            </a>
            <button type="button" className="copy-btn" onClick={copyEmail}>
              {copied ? 'Copied ✓' : 'Copy address'}
            </button>
          </div>

          <div className="socials">
            {site.socials.map((social) => (
              <a
                key={social.label}
                className="social-link"
                href={social.href}
                target={social.href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
              >
                <span>{social.label}</span>
                {social.handle}
              </a>
            ))}
          </div>
        </Reveal>
      </div>

      <div className={`toast ${copied ? 'is-visible' : ''}`} role="status">
        Email copied
      </div>
    </section>
  );
}
