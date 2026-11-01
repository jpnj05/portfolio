import { useEffect, useRef, useState } from 'react';
import { site } from '../data/site.js';

const LINKS = [
  { id: 'work', label: 'Work', index: '01' },
  { id: 'about', label: 'About', index: '02' },
  { id: 'activity', label: 'Activity', index: '03' },
  { id: 'contact', label: 'Contact', index: '04' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');
  const openedAt = useRef(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sections = LINKS.map((link) => document.getElementById(link.id)).filter(Boolean);
    if (!sections.length || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    openedAt.current = open ? Date.now() : 0;
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <header className={`nav ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="nav-inner">
          <a className="nav-brand" href="#top" onClick={() => setOpen(false)}>
            <span className="nav-mark">J</span>
            <span>{site.name}</span>
          </a>

          <nav className="nav-links" aria-label="Sections">
            {LINKS.map((link) => (
              <a
                key={link.id}
                className={`nav-link ${active === link.id ? 'is-active' : ''}`}
                href={`#${link.id}`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <a className="nav-cta" href={`mailto:${site.email}`}>
            Hire me
          </a>

          <button
            type="button"
            className={`nav-burger ${open ? 'is-open' : ''}`}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <div id="mobile-menu" className={`mobile-menu ${open ? 'is-open' : ''}`}>
        <nav aria-label="Sections">
          {LINKS.map((link, index) => (
            <a
              key={link.id}
              className="mobile-link"
              href={`#${link.id}`}
              style={{ '--i': index }}
              onClick={() => setOpen(false)}
            >
              {link.label}
              <span>{link.index}</span>
            </a>
          ))}
        </nav>
        <p className="mobile-foot">{site.email}</p>
      </div>
    </>
  );
}
