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
    'I build fast, tactile web apps: clean on the surface, steady Node.js underneath, and small details that make you want to click around.',

  about: [
    'I am a developer who likes the part of the work where an idea turns into something you can actually click. Most of my time goes into React interfaces, small Node services, and the details that make a screen feel finished: motion, spacing, states, keyboard behaviour.',
    'Right now I am sharpening the full-stack basics (data modelling, auth, deployment) and shipping something small and real every month instead of reading about it. If it is not deployed, it is a rumour.',
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
      items: ['Responsive layout', 'Motion', 'Serverless functions'],
    },
    {
      group: 'Workflow',
      items: ['Git', 'Vite', 'Vercel', 'Firebase', 'Figma'],
    },
  ],

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
    note: 'One page, no filler: background, skills and selected work.',
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
};
