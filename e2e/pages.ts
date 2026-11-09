/** Every top-level page, with the heading we expect to see on it. */
export const PAGES = [
  { path: '/', heading: /(good (morning|afternoon|evening)|hello)/i },
  { path: '/jobs', heading: /jobs board/i },
  { path: '/agent', heading: /job agent/i },
  { path: '/analytics', heading: /analytics/i },
  { path: '/calendar', heading: /calendar/i },
  { path: '/tasks', heading: /tasks/i },
  { path: '/resume', heading: /résumé/i },
  { path: '/templates', heading: /templates/i },
  { path: '/settings', heading: /settings/i },
] as const
