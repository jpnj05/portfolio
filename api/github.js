/**
 * Vercel Node function: GET /api/github?user=jpnj05[&scope=contributions&year=2026]
 *
 * Aggregates the GitHub profile, public repos and the contribution calendar so
 * the browser makes one request instead of three, with edge caching on top.
 */

const CONTRIB_API = 'https://github-contributions-api.jogruber.de/v4';
const CACHE_HEADER = 'public, s-maxage=1800, stale-while-revalidate=86400';
const NO_CACHE_HEADER = 'no-store';

function send(res, status, body, cache = CACHE_HEADER) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.end(JSON.stringify(body));
}

async function getJson(url, headers) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`HTTP ${response.status} · ${url}`);
  return response.json();
}

function mapRepo(repo) {
  return {
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description || '',
    language: repo.language || null,
    stars: repo.stargazers_count || 0,
    forks: repo.forks_count || 0,
    homepage: repo.homepage || '',
    topics: repo.topics || [],
    url: repo.html_url,
    pushedAt: repo.pushed_at,
    updatedAt: repo.updated_at,
  };
}

function mapContributions(payload, year) {
  if (!payload || !Array.isArray(payload.contributions)) return null;
  const totalValue =
    typeof payload.total === 'number'
      ? payload.total
      : (payload.total && (payload.total[year] ?? payload.total.lastYear)) ?? null;

  return {
    year,
    total:
      typeof totalValue === 'number'
        ? totalValue
        : payload.contributions.reduce((sum, day) => sum + day.count, 0),
    days: payload.contributions.map((day) => ({
      date: day.date,
      count: day.count,
      level: day.level ?? (day.count === 0 ? 0 : Math.min(4, day.count)),
    })),
  };
}

export default async function handler(req, res) {
  if (req.method && req.method !== 'GET') {
    return send(res, 405, { error: 'Method not allowed' }, NO_CACHE_HEADER);
  }

  const url = new URL(req.url, 'http://localhost');
  const rawUser = url.searchParams.get('user') || process.env.GITHUB_USER || 'jpnj05';
  const user = String(rawUser).replace(/[^a-zA-Z0-9-]/g, '').slice(0, 39);
  const yearParam = url.searchParams.get('year');
  const year = yearParam && /^\d{4}$/.test(yearParam) ? yearParam : 'last';

  if (!user) return send(res, 400, { error: 'Missing user' }, NO_CACHE_HEADER);

  const headers = {
    'User-Agent': 'jpnj-portfolio',
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const contributionsOnly = url.searchParams.get('scope') === 'contributions';

  try {
    const contributionsQuery = year === 'last' ? '?y=last' : `?y=${year}`;
    const contributions = await getJson(
      `${CONTRIB_API}/${encodeURIComponent(user)}${contributionsQuery}`,
      { Accept: 'application/json' },
    ).then((payload) => mapContributions(payload, year));

    if (contributionsOnly) {
      return send(res, 200, { contributions });
    }

    const [profile, repos] = await Promise.all([
      getJson(`https://api.github.com/users/${user}`, headers),
      getJson(`https://api.github.com/users/${user}/repos?per_page=100&sort=pushed`, headers),
    ]);

    const cleanRepos = repos
      .filter((repo) => !repo.fork && !repo.archived)
      .map(mapRepo)
      .sort((a, b) => new Date(b.pushedAt || 0) - new Date(a.pushedAt || 0));

    return send(res, 200, {
      profile: {
        login: profile.login,
        name: profile.name,
        avatar: profile.avatar_url,
        bio: profile.bio,
        location: profile.location,
        blog: profile.blog,
        followers: profile.followers,
        following: profile.following,
        publicRepos: profile.public_repos,
        createdAt: profile.created_at,
        url: profile.html_url,
      },
      repos: cleanRepos,
      contributions,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    return send(
      res,
      502,
      { error: 'Upstream fetch failed', detail: String(error.message || error) },
      NO_CACHE_HEADER,
    );
  }
}
