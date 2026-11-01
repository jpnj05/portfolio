import { site } from '../data/site.js';
import Reveal from './Reveal.jsx';

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

        <div className="about-grid">
          <Reveal className="about-copy">
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

          <Reveal className="about-card" delay={120}>
            <header className="about-card-title">
              <span>Toolbox</span>
              <span className="mono">v2026</span>
            </header>

            {site.skills.map((group) => (
              <div className="skill-group" key={group.group}>
                <h4>{group.group}</h4>
                <ul className="chips">
                  {group.items.map((item) => (
                    <li className="chip" key={item}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
