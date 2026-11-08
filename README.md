# Portfolio — React · Vite · Node

A personal portfolio that reads its own content from GitHub: projects come from the
GitHub API, and the contribution calendar is live data rather than a screenshot.

Live URL: https://portfolio-three-tau-ps4bbnd8b2.vercel.app

## What is inside

- **Kinetic hero** — letter-by-letter entrance, rotating role line, orbiting ring around the
  GitHub avatar and magnetic buttons, over a fixed background layer of slowly drifting particles
  that take their colour from the theme's accent and mint tokens.
- **Work** — the five strongest builds as cards (preview, description, language, tags, links to
  the live build and source; the featured one gets a full-width layout), then a **See all work**
  button that expands every repository from GitHub into a compact list.
- **Skills tooltips** — every chip in the skills matrix explains itself on hover or keyboard
  focus, positioned in the viewport so it never runs off an edge.
- **Drifting ship** — a small ship floats through the background with the dots and shooting
  stars. Hover it for thrusters, drag it to steer, let go and it keeps the momentum and turns
  to face where it is heading, click it to launch it along its nose, and it wraps to the
  opposite edge once it leaves the screen. On a touch screen it can be dragged without the
  page scrolling underneath it.
- **Light/dark theme** — a nav toggle that swaps the palette in one frame (no page snapshot,
  no blurred layer re-raster), a stored preference, and a light palette that repaints the whole
  site (surfaces, glass, heatmap).
  Dark is a midnight iris (violet-tinted ink, periwinkle accent), light is lilac paper with
  deep violet accents.
- **Activity** — a hand-built contribution heatmap: 53 weeks × 7 days, staggered reveal on
  scroll, hover/tap tooltip, year switcher, plus current streak, longest streak, active days
  and best day computed from the real API payload.
- **About** — biography with quick facts, a résumé card (designed preview that opens the PDF in
  an in-page viewer, plus a download button), an experience & education timeline, and a six-group
  skills matrix.
- **Contact** — big mailto CTA with a copy-to-clipboard button and social links.
- Responsive from 320 px upward: single-column layouts, a full-screen mobile menu, horizontally
  scrollable heatmap, tilt/pointer effects disabled on touch, and `prefers-reduced-motion`
  respected everywhere.

## Stack

| Layer     | Choice                                                           |
| --------- | ---------------------------------------------------------------- |
| UI        | React 19, hand-written CSS (no UI framework)                     |
| Bundler   | Vite 7                                                           |
| Scroll    | Lenis (inertial wheel scrolling, native fallback)                |
| Backend   | Node serverless function at `api/github.js` (Vercel runtime)     |
| Data      | GitHub REST API + GitHub contributions API                       |
| Hosting   | Vercel (static build + one function)                             |

The browser asks `/api/github` for everything at once. The Node function adds an optional
token, aggregates the three upstream calls and sets a 30-minute cache header. If that route is
unavailable — for example a plain static host — the client falls back to the public APIs
directly, and finally to the committed snapshot in `src/data/snapshot.json`, so the page never
renders empty.

## Local development

```bash
npm install
npm run dev        # http://127.0.0.1:5173
```

`vite.config.js` mounts `api/github.js` as dev middleware, so the Node route works locally
without `vercel dev`.

Optional environment variables (copy `.env.example` to `.env`):

```bash
GITHUB_TOKEN=      # read-only token, only needed for rate limits
GITHUB_USER=jpnj05
```

Refresh the offline fallback after pushing new repos:

```bash
npm run snapshot
```

Rebuild the résumé PDF from `site.js` after editing the About content:

```bash
npm run resume
```

That writes `public/resume.pdf`, which the About section previews and links to. To use a résumé
you made elsewhere, just replace `public/resume.pdf` and set `resume.updated` in `site.js`.

## Editing content

Almost everything personal lives in **`src/data/site.js`**:

- `githubUser` — whose repos and calendar are shown
- `name`, `role`, `roles`, `tagline`, `about`, `skills`, `socials`
- `timeline` — experience & education entries (`kind`, `when`, `title`, `org`, `note`, `current`)
- `resume` — the PDF path and the "updated" label shown next to the download button
- `projectOverrides` — nicer titles, copy, tags and preview images per repo
- `hiddenRepos` — repos to leave off the grid (this site's own repo is already listed)
- `extraProjects` — work that is not on GitHub

New public repos show up automatically; add an override only when you want custom copy or a
screenshot. Drop a screenshot into `public/projects/` and set `preview: '/projects/name.png'`.

## Deploy to Vercel

1. Push this repo to GitHub.
2. On Vercel: **Add New → Project**, import the repo. The Vite preset is detected from
   `vercel.json`; build command `npm run build`, output `dist`.
3. Optional: **Settings → Environment Variables →** add `GITHUB_TOKEN` (a read-only token) to
   raise the API rate limit above 60 requests/hour.
4. Deploy. `api/github.js` is picked up automatically as a Node function.

Or from the CLI:

```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production
```

## Project structure

```
api/github.js            Node function: profile + repos + contributions
scripts/fetch-snapshot.mjs  Regenerates the offline fallback
src/data/site.js         All personal content and per-project copy
src/data/snapshot.json   Offline GitHub fallback
src/lib/github.js        Data loading + normalisation + fallbacks
src/hooks/useCountUp.js  Count-up-on-scroll helper
src/components/          Nav, Hero, Projects, Contributions, About, Contact…
src/styles/global.css    Design tokens, layout, motion, responsive rules
```
