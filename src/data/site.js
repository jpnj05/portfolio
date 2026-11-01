/**
 * Everything personal lives here. Edit this file and the whole site updates —
 * no component changes needed.
 */
export const site = {
  // GitHub account the projects + contribution graph are pulled from.
  githubUser: 'jpnj05',

  // Shown in the hero, nav and footer.
  name: 'Nizon Jeorgie Pison II',
  role: 'Full-Stack Developer',
  roles: ['Full-Stack Developer', 'React + Node.js', 'Interface Tinkerer', 'Problem Solver'],

  location: 'Philippines',
  email: 'nizonjeorgiepison66@gmail.com',
  availability: 'Open to internships & freelance work',

  tagline:
    'I build fast, tactile web apps — clean interfaces on the surface, steady Node.js behind them.',

  about: [
    'I am a developer who likes the part of the work where an idea turns into something you can actually click. Most of my time goes into React interfaces, small Node services, and the details that make a screen feel finished: motion, spacing, states, keyboard behaviour.',
    'Right now I am sharpening the full-stack basics — data modelling, auth, deployment — and shipping something small and real every month instead of reading about it.',
  ],

  skills: [
    {
      group: 'Frontend',
      items: ['React', 'JavaScript', 'HTML', 'CSS', 'Responsive layout', 'Motion'],
    },
    {
      group: 'Mobile',
      items: ['Flutter', 'Dart'],
    },
    {
      group: 'Backend',
      items: ['Node.js', 'Python', 'REST APIs', 'Serverless functions'],
    },
    {
      group: 'AI',
      items: ['OpenAI', 'Claude', 'Gemini', 'FreeBuff'],
    },
    {
      group: 'Workflow',
      items: ['Git', 'Vite', 'Vercel', 'Firebase', 'Figma'],
    },
  ],

  socials: [
    { label: 'GitHub', handle: '@jpnj05', href: 'https://github.com/jpnj05' },
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
};
