import { site } from '../data/site.js';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <span>
          © {new Date().getFullYear()} {site.name}. Built by hand with React, Vite and one small
          Node function. No template was harmed.
        </span>
        <div className="footer-meta">
          <a href={`https://github.com/${site.githubUser}`} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={site.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
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
