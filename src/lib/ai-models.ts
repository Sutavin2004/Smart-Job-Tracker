/**
 * Claude models used across the app, in one place so upgrades are a one-line change.
 * - fast:   high-volume structured tasks (analysis, drafting, parsing)
 * - search: the Job Agent's web-search discovery step
 * - write:  long-form writing where quality matters most (tailored résumés)
 */
export const AI_MODELS = {
  fast: 'claude-haiku-5-5',
  search: 'claude-sonnet-5-5',
  write: 'claude-sonnet-5-5',
} as const
