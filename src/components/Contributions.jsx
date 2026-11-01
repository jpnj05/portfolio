import { useEffect, useMemo, useState } from 'react';
import { site } from '../data/site.js';
import { loadContributions } from '../lib/github.js';
import { useInView } from './Reveal.jsx';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// GitHub's grid runs Sunday → Saturday; only these three get an axis label.
const DAY_ROWS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

/** Pads the first and last week so every column is a full Sun → Sat run. */
function toWeeks(days) {
  if (!days?.length) return [];
  const weeks = [];
  let week = [];
  const first = new Date(`${days[0].date}T00:00:00`);
  for (let i = 0; i < first.getDay(); i += 1) week.push(null);

  for (const day of days) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return weeks;
}

function monthLabels(weeks) {
  const labels = [];
  let last = null;
  for (const week of weeks) {
    const anchor = week.find(Boolean);
    if (!anchor) {
      labels.push('');
      continue;
    }
    const date = new Date(`${anchor.date}T00:00:00`);
    const label = MONTHS[date.getMonth()];
    if (label !== last) {
      labels.push(label);
      last = label;
    } else {
      labels.push('');
    }
  }
  return labels;
}

function summarize(contribution) {
  if (!contribution?.days?.length) return null;
  const { days } = contribution;
  const best = days.reduce((top, day) => (day.count > top.count ? day : top), days[0]);
  const active = days.filter((day) => day.count > 0).length;

  let longest = 0;
  let run = 0;
  for (const day of days) {
    if (day.count > 0) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }

  let current = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    if (days[i].count > 0) current += 1;
    else if (i === days.length - 1) continue;
    else break;
  }

  return { best, active, longest, current };
}

const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export default function Contributions({ contributions }) {
  const [data, setData] = useState(contributions);
  const [year, setYear] = useState('last');
  const [loading, setLoading] = useState(false);
  const [tip, setTip] = useState(null);
  const { ref: gridRef, inView } = useInView({ threshold: 0.05, rootMargin: '0px' });

  useEffect(() => {
    setData(contributions);
  }, [contributions]);

  const weeks = useMemo(() => toWeeks(data?.days), [data]);
  const labels = useMemo(() => monthLabels(weeks), [weeks]);
  const stats = useMemo(() => summarize(data), [data]);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return [
      { key: 'last', label: 'Last 12 mo' },
      { key: String(now), label: String(now) },
    ];
  }, []);

  const switchYear = async (key) => {
    if (key === year) return;
    setYear(key);
    setLoading(true);
    const next = await loadContributions(site.githubUser, key);
    if (next) setData(next);
    setLoading(false);
  };

  const showTip = (event, day) => {
    if (!day?.date) return;
    const count = day.count;
    setTip({
      x: event.clientX,
      y: event.clientY,
      text: `${count === 0 ? 'No' : count} contribution${count === 1 ? '' : 's'} · ${formatDate(day.date)}`,
    });
  };

  return (
    <section className="section" id="activity">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="kicker">03 — Activity</p>
            <h2 className="section-title">
              Commit <em>weather</em>.
            </h2>
          </div>
          <p className="section-lead">
            Straight from GitHub, not a screenshot. Hover a square for the day; streaks, best days
            and dry spells are all real.
          </p>
        </div>

        <div className="contrib-card">
          <div className="contrib-head">
            <div>
              <div className="contrib-total">
                {data ? data.total.toLocaleString() : '—'}
                <small>{year === 'last' ? 'contributions in the last year' : `contributions in ${year}`}</small>
              </div>
            </div>

            <div className="contrib-tabs" role="tablist" aria-label="Contribution window">
              {years.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  role="tab"
                  className="tab"
                  aria-selected={year === option.key}
                  disabled={loading && year !== option.key}
                  onClick={() => switchYear(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {!data ? (
            <div className="heat-skeleton" />
          ) : (
            <>
              <div className="heat-scroll">
                <div className="heat-frame">
                  <div className="heat-months-row" aria-hidden="true">
                    <span className="heat-corner" />
                    <div className="heat-months">
                      {labels.map((label, index) => (
                        <span key={index}>{label}</span>
                      ))}
                    </div>
                  </div>
                  <div className="heat-body">
                    <div className="heat-days" aria-hidden="true">
                      {DAY_ROWS.map((label, index) => (
                        <span key={index}>{label}</span>
                      ))}
                    </div>
                    <div ref={gridRef} className={`heat-grid ${inView ? 'is-in' : ''}`}>
                      {weeks.map((week, weekIndex) =>
                        week.map((day, dayIndex) => {
                          if (!day) {
                            return (
                              <span
                                className="heat-cell is-empty"
                                key={`empty-${weekIndex}-${dayIndex}`}
                                aria-hidden="true"
                              />
                            );
                          }

                          return (
                            <span
                              key={day.date}
                              className="heat-cell"
                              data-level={day.level}
                              style={{ '--i': `${Math.min(weekIndex * 16 + dayIndex * 5, 1000)}ms` }}
                              title={`${day.count} contribution${day.count === 1 ? '' : 's'} on ${formatDate(day.date)}`}
                              onPointerMove={(event) => showTip(event, day)}
                              onPointerLeave={() => setTip(null)}
                            />
                          );
                        }),
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="contrib-stats">
                <div className="mini-stat">
                  <b>{stats?.current ?? 0}</b>
                  <span>Current streak</span>
                </div>
                <div className="mini-stat">
                  <b>{stats?.longest ?? 0}</b>
                  <span>Longest streak</span>
                </div>
                <div className="mini-stat">
                  <b>{stats?.active ?? 0}</b>
                  <span>Active days</span>
                </div>
                <div className="mini-stat">
                  <b>{stats?.best?.count ?? 0}</b>
                  <span>
                    Best day
                    {stats?.best?.date
                      ? ` · ${new Date(`${stats.best.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                      : ''}
                  </span>
                </div>
              </div>

              <div className="heat-foot">
                <span className="heat-hint">Swipe the grid horizontally →</span>
                <div className="legend">
                  <span>Less</span>
                  {[0, 1, 2, 3, 4].map((level) => (
                    <i key={level} data-level={level} />
                  ))}
                  <span>More</span>
                </div>
                <span>{loading ? 'Updating…' : 'Live via GitHub API'}</span>
              </div>
            </>
          )}

          {data && !data.days?.length && (
            <div className="empty-note">No contribution data available right now.</div>
          )}
        </div>
      </div>

      {tip && (
        <div className="heat-tip" style={{ left: tip.x, top: tip.y }} role="status">
          {tip.text}
        </div>
      )}
    </section>
  );
}
