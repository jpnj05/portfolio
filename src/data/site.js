/**
 * Everything personal lives here. Edit this file and the whole site updates —
 * no component changes needed.
 */
const LINKEDIN_URL = 'https://www.linkedin.com/in/njpison';
const LINKEDIN_LABEL = 'linkedin.com/in/njpison';

export const site = {
  // GitHub account the projects + contribution graph are pulled from.
  githubUser: 'jpnj05',

  // Shown in the hero, nav and footer.
  name: 'Nizon Jeorgie Pison II',
  role: 'Full-Stack Developer',
  // Rotates under the name in the hero — one per line, keep them short.
  roles: ['Full-Stack Developer', 'React & Node.js', 'Flutter & Dart'],

  location: 'Philippines',
  email: 'nizonjeorgiepison66@gmail.com',
  linkedin: LINKEDIN_URL,
  linkedinLabel: LINKEDIN_LABEL,

  // Save your photo as public/profile.jpg (square, 512×512 is plenty).
  // If the file is missing the GitHub avatar is used instead.
  avatar: '/profile.jpg',

  tagline:
    'I build fast, tactile web apps: clean interfaces on the surface, steady Node.js behind them.',

  about: [
    'I am a developer who likes the part of the work where an idea turns into something you can actually click. Most of my time goes into React interfaces, small Node services, and the details that make a screen feel finished: motion, spacing, states, keyboard behaviour.',
    'Right now I am sharpening the full-stack basics (data modelling, auth, deployment) and shipping something small and real every month instead of reading about it.',
  ],

  skills: [
    {
      group: 'Frontend',
      items: ['React', 'JavaScript', 'HTML', 'CSS'],
    },
    {
      group: 'Mobile',
      items: ['Flutter', 'Dart'],
    },
    {
      group: 'Backend',
      items: ['Node.js', 'Python', 'REST APIs'],
    },
    {
      group: 'AI',
      items: ['OpenAI', 'Claude', 'Gemini', 'FreeBuff'],
    },
    {
      group: 'Practices',
      items: ['Responsive', 'Accessibility', 'Motion', 'Performance', 'States', 'Serverless'],
    },
    {
      group: 'Workflow',
      items: ['Git', 'Vite', 'Vercel', 'Firebase', 'Figma'],
    },
  ],

  /**
   * One line per skill, shown in the tooltip when a chip is hovered or focused.
   * Anything without an entry simply shows no tooltip.
   */
  skillNotes: {
    React: 'The UI library behind almost every screen I build.',
    JavaScript: 'The language under everything else on the page.',
    HTML: 'Structure and semantics, written to be read by people too.',
    CSS: 'Layout, colour and the small details that make a screen feel finished.',
    Flutter: 'Dart toolkit I use for the mobile apps.',
    Dart: 'Flutter\u2019s language: typed, fast, one codebase for both stores.',
    'Node.js': 'JavaScript on the server, for APIs and small services.',
    Python: 'Scripting and data work, including the budget tracker.',
    'REST APIs': 'Plain HTTP endpoints any client can call.',
    OpenAI: 'Models behind the assistant features I build.',
    Claude: 'Long context model I reach for when reading code.',
    Gemini: 'Google\u2019s model, kept in the mix for comparison.',
    FreeBuff: 'The agent that helps me build and ship this site.',
    Git: 'Version control, branches and a history I can read later.',
    Vite: 'Dev server and bundler this site is built with.',
    Vercel: 'Where the builds land and get served.',
    Firebase: 'Auth and small realtime data when a whole backend is overkill.',
    Figma: 'Where layouts get argued about before anyone writes code.',
    Responsive: 'Every layout holds from a phone up to a wide screen.',
    Accessibility: 'Keyboard paths, focus states and colour that stays readable.',
    Motion: 'Movement that explains what changed, never movement for its own sake.',
    Performance: 'Fewer bytes, fewer repaints, faster first paint.',
    States: 'Empty, loading and error screens designed, not discovered.',
    Serverless: 'Functions that wake per request instead of a server left running.',
  },

  /**
   * About → experience & education timeline, newest first.
   * `when` is the small label in the left column, `current` highlights the entry.
   */
  timeline: [
    {
      kind: 'Experience',
      when: 'Present',
      title: 'Independent developer',
      org: 'Personal projects',
      current: true,
      note: 'Designing and shipping my own web and mobile projects end to end: interface, motion, API and deployment. The finished builds live in Work.',
    },
    {
      kind: 'Education',
      when: 'Present',
      title: 'University of San Agustin',
      org: 'Iloilo City',
      current: true,
      note: 'Currently enrolled, shipping small projects alongside coursework.',
    },
    {
      kind: 'Education',
      when: 'Completed',
      title: 'Jaro National High School',
      org: 'Jaro, Iloilo City',
    },
    {
      kind: 'Education',
      when: 'Completed',
      title: 'Jaro 1 Elementary School',
      org: 'Jaro, Iloilo City',
    },
  ],

  /** The résumé previewed in About. Replace public/resume.pdf with your own file. */
  resume: {
    file: '/resume.pdf',
    updated: 'November 2026',
    note: 'One page: background, skills and selected work.',
  },

  socials: [
    { label: 'GitHub', handle: '@jpnj05', href: 'https://github.com/jpnj05' },
    { label: 'LinkedIn', handle: '/in/njpison', href: LINKEDIN_URL },
    { label: 'Email', handle: 'nizonjeorgiepison66@gmail.com', href: 'mailto:nizonjeorgiepison66@gmail.com' },
  ],

  // Repos to keep off the grid (this site's own repo, forks of other people's work…).
  hiddenRepos: ['portfolio', 'Portfolio', 'jpnj-portfolio'],

  /**
   * Per-repo copy and artwork. Anything omitted falls back to GitHub data,
   * so new repos appear automatically once you push them.
   */
  projectOverrides: {
    'Web-Budget-Tracker': {
      title: 'Budget Tracker',
      featured: true,
      blurb:
        'A clean budgeting dashboard: log income and expenses, watch the balance update instantly, and read the month at a glance. Built as a single-page app and deployed on Vercel.',
      // Drop a screenshot in public/projects/ and point this at it, e.g.
      // preview: '/projects/your-screenshot.png',
      // Without a screenshot the card uses the same dark cover as the other repos.
      tags: ['Python', 'HTML', 'Dashboard'],
      language: 'Python',
      role: 'Design & development',
      // The deployment is currently down, so the card links to the source only.
      // Set a URL here to bring the "Live demo" link back.
      live: '',
    },

    Budgetero: {
      title: 'Budgetero',
      // GitHub reports HTML because the Flutter web build outweighs the
      // sources; the app itself is written in Dart.
      language: 'Dart',
      tags: ['Flutter', 'Dart', 'AI'],
    },
  },

  /** Work that is not on GitHub. Same shape as a repo card. */
  extraProjects: [],

  /**
   * Work → "School works": coursework and school projects. Add an entry and
   * the section grows with it.
   */
  schoolWorks: [
    {
      kind: 'Infographic',
      when: '2026',
      title: 'CashFlow AI',
      subtitle: 'Powered cash flow forecaster for small businesses',
      blurb:
        'Small business owners run out of cash while still turning a profit, because the tracking lives in a notebook or in memory. This project answers that with an AI tool that records transactions from any device, forecasts cash day by day, and raises an alert before a shortfall lands.',
      highlights: ['Transaction logging', 'Day-by-day forecasting', 'AI integration', 'Shortfall alerts'],
      team: 'Fiesta · Mercado · Pison · Visitacion · Herrera',
    },
  ],
};
