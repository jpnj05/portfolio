# Project rules

## Commit messages — no attribution, ever

This applies to every commit in this repository, whether written by a person or an agent.

- Never add `Co-Authored-By:` lines naming a tool, model, assistant or agent.
- Never add "Generated with ...", robot emoji, or any similar footer.
- No trailer block of any kind. The message ends at its own last sentence — subject and body only.
- Keep the subject in the imperative and describe why the change was made.

## Project notes

- React + Vite SPA with an `api/github.js` serverless function.
- Personal copy, skills, timeline and résumé settings live in `src/data/site.js`.
- Theme colours are CSS custom properties at the top of `src/styles/global.css`; use the tokens
  (`--accent`, `--panel`, `--line`, …) instead of hard-coded colours.
- `npm run resume` regenerates `public/resume.pdf` from `site.js`.
- `npm run build` must pass before committing.
