/**
 * Writes src/data/snapshot.json — the offline fallback used when the GitHub
 * API is rate-limited or unreachable. Run `npm run snapshot` after big pushes.
 *
 *   node scripts/fetch-snapshot.mjs [username]
 */
import { mkdir, writeFile } from 'node:fs/promises';

const user = process.argv[2] || process.env.GITHUB_USER || 'jpnj05';
const headers = { 'User-Agent': 'portfolio-snapshot', Accept: 'application/vnd.github+json' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const getJson = async (url, extraHeaders = headers) => {
  const response = await fetch(url, { headers: extraHeaders });
  if (!response.ok) throw new Error(`HTTP ${response.status} · ${url}`);
  return response.json();
};

const [profile, repos, contributions] = await Promise.all([
  getJson(`https://api.github.com/users/${user}`),
  getJson(`https://api.github.com/users/${user}/repos?per_page=100&sort=pushed`),
  getJson(`https://github-contributions-api.jogruber.de/v4/${user}?y=last`, {
    Accept: 'application/json',
  }),
]);

const snapshot = {
  fetchedAt: new Date().toISOString(),
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
  repos: repos
    .filter((repo) => !repo.fork && !repo.archived)
    .map((repo) => ({
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
    })),
  contributions: {
    year: 'last',
    total:
      typeof contributions.total === 'number'
        ? contributions.total
        : contributions.total?.lastYear ?? 0,
    days: contributions.contributions.map((day) => ({
      date: day.date,
      count: day.count,
      level: day.level,
    })),
  },
};

await mkdir('src/data', { recursive: true });
await writeFile('src/data/snapshot.json', `${JSON.stringify(snapshot, null, 2)}\n`);

console.log(
  `snapshot · ${snapshot.repos.length} repo(s) · ${snapshot.contributions.total} contributions · ${snapshot.contributions.days.length} days`,
);
