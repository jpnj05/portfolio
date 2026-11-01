import { useEffect, useMemo, useRef, useState } from 'react';
import { site } from '../data/site.js';
import { loadContributions } from '../lib/github.js';

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

  let index = 0;
  for (const day of days) {
    week.push({ ...day, index: index++ });
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
    const label = MONTHS[new Date(`${anchor.date}T00:00:00`).getMonth()];
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

  return { best, longest, current };
}

const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const formatShort = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const GitHubMark = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.71 1.22 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>
);

const ExternalMark = () => (
  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M3.5 10.5 10.5 3.5M10.5 3.5H4.7M10.5 3.5v5.8"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function Contributions({ contributions }) {
  const [data, setData] = useState(contributions);
  const [year, setYear] = useState('last');
  const [loading, setLoading] = useState(false);
  const [tip, setTip] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [pinnedDate, setPinnedDate] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    setData(contributions);
  }, [contributions]);

  useEffect(() => {
    setActiveIndex(null);
    setPinnedDate(null);
    setTip(null);
  }, [data]);

  const days = data?.days ?? [];
  const weeks = useMemo(() => toWeeks(days), [days]);
  const labels = useMemo(() => monthLabels(weeks), [weeks]);
  const stats = useMemo(() => summarize(data), [data]);

  const selected = useMemo(() => {
    if (!days.length) return null;
    if (pinnedDate) return days.find((day) => day.date === pinnedDate) ?? null;
    if (activeIndex !== null) return days[activeIndex] ?? null;
    return null;
  }, [days, pinnedDate, activeIndex]);

  const options = useMemo(() => {
    const now = new Date().getFullYear();
    return [
      { key: 'last', label: 'Last 12 months' },
      { key: String(now), label: String(now) },
      { key: String(now - 1), label: String(now - 1) },
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

  const keepInView = (index) => {
    const scroller = scrollRef.current;
    const cell = scroller?.querySelector(`[data-date="${days[index]?.date}"]`);
    if (!scroller || !cell) return;
    const left = cell.offsetLeft;
    const right = left + cell.offsetWidth;
    if (left < scroller.scrollLeft) scroller.scrollLeft = Math.max(0, left - 10);
    else if (right > scroller.scrollLeft + scroller.clientWidth) {
      scroller.scrollLeft = right - scroller.clientWidth + 10;
    }
  };

  const onKeyDown = (event) => {
    if (!days.length) return;
    const current = activeIndex ?? days.length - 1;
    let next = null;

    switch (event.key) {
      case 'ArrowLeft':
        next = current - 1;
        break;
      case 'ArrowRight':
        next = current + 1;
        break;
      case 'ArrowUp':
        next = current - 7;
        break;
      case 'ArrowDown':
        next = current + 7;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = days.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        setPinnedDate(pinnedDate === days[current].date ? null : days[current].date);
        return;
      case 'Escape':
        setPinnedDate(null);
        setActiveIndex(null);
        return;
      default:
        return;
    }

    event.preventDefault();
    const clamped = Math.max(0, Math.min(days.length - 1, next));
    setActiveIndex(clamped);
    keepInView(clamped);
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
            <a
              className="contrib-handle"
              href={`https://github.com/${site.githubUser}`}
              target="_blank"
              rel="noreferrer"
            >
              <GitHubMark />@{site.githubUser} <ExternalMark />
            </a>
          </div>
          <p className="section-lead">
            Straight from GitHub, not a screenshot. Hover, tap or use the arrow keys, and click a
            square to pin a day.
          </p>
        </div>

        <div className="contrib-card">
          <div className="contrib-head">
            <div className="contrib-total">
              {data ? data.total.toLocaleString() : '—'}
              <small>
                {year === 'last'
                  ? 'contributions in the last 12 months'
                  : `contributions in ${year}`}
              </small>
            </div>

            <div className="contrib-tabs" role="tablist" aria-label="Contribution window">
              {options.map((option) => (
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
              <div className="heat-scroll" ref={scrollRef}>
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
                    <div
                      className="heat-grid"
                      role="grid"
                      aria-label="Contribution activity, use arrow keys to move and Enter to pin a day"
                      tabIndex={0}
                      onKeyDown={onKeyDown}
                      onFocus={() => {
                        if (activeIndex === null && days.length) setActiveIndex(days.length - 1);
                      }}
                    >
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
                              data-date={day.date}
                              data-level={day.level}
                              data-active={activeIndex === day.index}
                              data-pinned={pinnedDate === day.date}
                              role="gridcell"
                              aria-label={`${day.count} contribution${day.count === 1 ? '' : 's'} on ${formatDate(day.date)}`}
                              title={`${day.count} contribution${day.count === 1 ? '' : 's'} on ${formatDate(day.date)}`}
                              onPointerMove={(event) => showTip(event, day)}
                              onPointerLeave={() => setTip(null)}
                              onClick={() =>
                                setPinnedDate(pinnedDate === day.date ? null : day.date)
                              }
                            />
                          );
                        }),
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {selected && (
                <p className="heat-readout">
                  <span>{pinnedDate ? 'Pinned' : 'Selected'}</span>
                  {formatDate(selected.date)}
                  <span className="heat-readout-count">
                    {selected.count} contribution{selected.count === 1 ? '' : 's'}
                  </span>
                  {pinnedDate && (
                    <button type="button" className="heat-readout-clear" onClick={() => setPinnedDate(null)}>
                      Clear
                    </button>
                  )}
                </p>
              )}

              <div className="heat-foot">
                <span className="heat-hint">
                  Hover, tap or use arrow keys · click a day to pin it
                </span>
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

        <div className="contrib-metrics">
          <div className="metric-card">
            <span className="metric-label">Total_commits</span>
            <b className="metric-value">
              {data ? data.total.toLocaleString() : '—'}
              <span className="metric-unit">{year === 'last' ? 'last 12 mo' : year}</span>
            </b>
          </div>
          <div className="metric-card">
            <span className="metric-label">Current_streak</span>
            <b className="metric-value">
              {stats?.current ?? 0}
              <span className="metric-unit">days</span>
            </b>
          </div>
          <div className="metric-card">
            <span className="metric-label">Longest_streak</span>
            <b className="metric-value">
              {stats?.longest ?? 0}
              <span className="metric-unit">days</span>
            </b>
          </div>
          <div className="metric-card">
            <span className="metric-label">Peak_day</span>
            <b className="metric-value">
              {stats?.best?.count ?? 0}
              <span className="metric-unit">
                {stats?.best?.date ? `commits · ${formatShort(stats.best.date)}` : 'commits'}
              </span>
            </b>
          </div>
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
