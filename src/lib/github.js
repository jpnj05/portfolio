const GH_API = 'https://api.github.com';
const CONTRIB_API = 'https://github-contributions-api.jogruber.de/v4';

function timeout(ms) {
  return typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined;
}

function normalizeRepo(repo) {
  return {
    name: repo.name,
    fullName: repo.fullName || repo.full_name,
    description: repo.description || '',
    language: repo.language || null,
    stars: repo.stars ?? repo.stargazers_count ?? 0,
    forks: repo.forks ?? repo.forks_count ?? 0,
    homepage: repo.homepage || '',
    topics: repo.topics || [],
    url: repo.url || repo.html_url,
    pushedAt: repo.pushedAt || repo.pushed_at || null,
    updatedAt: repo.updatedAt || repo.updated_at || null,
  };
}

function normalizeProfile(profile) {
  return {
    login: profile.login,
    name: profile.name || null,
    avatar: profile.avatar || profile.avatar_url,
    bio: profile.bio || '',
    location: profile.location || '',
    blog: profile.blog || '',
    followers: profile.followers ?? 0,
    following: profile.following ?? 0,
    publicRepos: profile.publicRepos ?? profile.public_repos ?? 0,
    createdAt: profile.createdAt || profile.created_at || null,
    url: profile.url || profile.html_url,
  };
}

function normalizeContributions(payload, year) {
  if (!payload || !Array.isArray(payload.contributions)) return null;
  const total =
    typeof payload.total === 'number'
      ? payload.total
      : (payload.total && (payload.total[year] ?? payload.total.lastYear)) ?? null;

  return {
    year: year || 'last',
    total: typeof total === 'number' ? total : payload.contributions.reduce((sum, d) => sum + d.count, 0),
    days: payload.contributions.map((day) => ({
      date: day.date,
      count: day.count,
      level: day.level ?? (day.count === 0 ? 0 : Math.min(4, day.count)),
    })),
  };
}

async function getJson(url, headers) {
  const response = await fetch(url, { headers, signal: timeout(9000) });
  if (!response.ok) throw new Error(`HTTP ${response.status} · ${url}`);
  return response.json();
}

async function directContributions(user, year = 'last') {
  const query = year && year !== 'last' ? `?y=${encodeURIComponent(year)}` : '?y=last';
  const payload = await getJson(`${CONTRIB_API}/${encodeURIComponent(user)}${query}`);
  return normalizeContributions(payload, year);
}

/**
 * Loads everything the page needs.
 * 1. our own Node function (fast, cached, works with a token)
 * 2. GitHub's public API straight from the browser
 * 3. the committed snapshot so the page is never empty
 */
export async function loadPortfolio(user) {
  try {
    const response = await fetch(`/api/github?user=${encodeURIComponent(user)}`, {
      headers: { Accept: 'application/json' },
      signal: timeout(9000),
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.profile) {
        return {
          profile: normalizeProfile(data.profile),
          repos: (data.repos || []).map(normalizeRepo),
          contributions: data.contributions || null,
          source: 'live',
          fetchedAt: data.fetchedAt || new Date().toISOString(),
        };
      }
    }
  } catch {
    /* fall through to the public API */
  }

  try {
    const headers = { Accept: 'application/vnd.github+json' };
    const [profile, repos, contributions] = await Promise.all([
      getJson(`${GH_API}/users/${encodeURIComponent(user)}`, headers),
      getJson(`${GH_API}/users/${encodeURIComponent(user)}/repos?per_page=100&sort=pushed`, headers),
      directContributions(user, 'last').catch(() => null),
    ]);

    return {
      profile: normalizeProfile(profile),
      repos: repos.filter((repo) => !repo.fork && !repo.archived).map(normalizeRepo),
      contributions,
      source: 'live',
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    /* fall through to the snapshot */
  }

  const { default: snapshot } = await import('../data/snapshot.json');
  return {
    profile: normalizeProfile(snapshot.profile),
    repos: snapshot.repos.map(normalizeRepo),
    contributions: snapshot.contributions,
    source: 'snapshot',
    fetchedAt: snapshot.fetchedAt || null,
  };
}

/** Fetches one contribution window (last 12 months or a calendar year). */
export async function loadContributions(user, year = 'last') {
  try {
    const response = await fetch(
      `/api/github?user=${encodeURIComponent(user)}&scope=contributions&year=${encodeURIComponent(year)}`,
      { headers: { Accept: 'application/json' }, signal: timeout(9000) },
    );
    if (response.ok) {
      const data = await response.json();
      if (data && data.contributions) return data.contributions;
    }
  } catch {
    /* try the public endpoints */
  }

  try {
    return await directContributions(user, year);
  } catch {
    return null;
  }
}
