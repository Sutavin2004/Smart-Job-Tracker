/**
 * Public demo mode (DEMO_MODE=true on a separate deployment with its own
 * database). Visitors get sample data that resets daily; features that cost
 * money or could be abused (AI calls, fetching arbitrary links) are off.
 */
export const IS_DEMO = process.env.DEMO_MODE === 'true'

export const DEMO_BLOCKED_API = [
  /^\/api\/jobs\/import-url$/, // server-side fetch of arbitrary URLs
  /^\/api\/jobs\/[^/]+\/prepare$/, // AI writing
]

export const DEMO_REPO_URL = 'https://github.com/Sutavin2004/Smart-Job-Tracker'
