import { site } from '../data/site.js';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <span>
          © {new Date().getFullYear()} {site.name} — built with React, Vite &amp; a small Node
          function.
        </span>
        <div className="footer-meta">
          <a href={`https://github.com/${site.githubUser}`} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={`mailto:${site.email}`}>Email</a>
          <a className="back-top" href="#top">
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
