/**
 * Turn résumé text into profile and job-agent settings.
 * Pure parsing lives here (testable); the AI call is in autofillFromResume.
 */

export const AUTOFILL_FIELDS = [
  'name', 'email', 'phone', 'linkedin', 'github', 'portfolio', 'currentTitle', 'yearsExperience',
  'education', 'bio', 'skills', 'targetRoles', 'targetLocations', 'jobSearchGoals',
] as const
export type AutofillField = typeof AUTOFILL_FIELDS[number]
export type Autofill = Partial<Record<AutofillField, string | number>>

const URL_RE = /\b(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)(\/[^\s|,;)]*)?/gi

/** What can be read reliably without AI: contact details and links. */
export function basicFields(text: string): Autofill {
  const out: Autofill = {}
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]
  if (email) out.email = email.toLowerCase()
  const phone = text.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/)?.[0]
  if (phone) out.phone = phone.trim()
  for (const m of text.matchAll(URL_RE)) {
    const host = m[1].toLowerCase()
    const path = (m[2] ?? '').replace(/[.)]+$/, '')
    if (email && email.endsWith(host)) continue
    const url = `https://${host.startsWith('www.') ? host : (host === 'linkedin.com' ? 'www.' + host : host)}${path}`
    if (/linkedin\.com$/.test(host) && /^\/in\//.test(path) && !out.linkedin) out.linkedin = url
    else if (/^github\.com$/.test(host) && /^\/[\w-]+\/?$/.test(path) && !out.github) out.github = url
    else if (!out.portfolio && !/linkedin|github|gmail|outlook|hotmail|yahoo|edx|coursera|google/.test(host) && /\.(app|dev|io|me|com|ca|site|page)$/.test(host)) out.portfolio = url
  }
  // The name is usually the first short line with no digits or @.
  const first = text.split('\n').map(l => l.trim()).find(l => l.length > 0)
  if (first && first.length <= 50 && !/[@\d|]/.test(first) && first.split(/\s+/).length <= 5) out.name = first
  return out
}

/** Read the model's JSON reply, keeping only known fields with sensible values. */
export function parseAutofill(reply: string): Autofill {
  const json = reply.match(/\{[\s\S]*\}/)?.[0]
  if (!json) return {}
  let o: Record<string, unknown>
  try { o = JSON.parse(json) } catch { return {} }
  const out: Autofill = {}
  for (const k of AUTOFILL_FIELDS) {
    const v = o[k]
    if (k === 'yearsExperience') {
      const n = Number(v)
      if (Number.isFinite(n) && n >= 0 && n < 60) out.yearsExperience = Math.floor(n)
    } else if (Array.isArray(v)) {
      const s = v.filter(x => typeof x === 'string' && x.trim()).map(x => (x as string).trim()).join(', ')
      if (s) out[k] = s.slice(0, 1000)
    } else if (typeof v === 'string' && v.trim() && !/^(null|n\/a|unknown|none)$/i.test(v.trim())) {
      out[k] = v.trim().slice(0, k === 'bio' || k === 'jobSearchGoals' ? 1500 : 300)
    }
  }
  return out
}

/** Only fill what the user hasn't set, unless asked to overwrite. */
export function mergeAutofill(current: Record<string, unknown>, found: Autofill, overwrite = false) {
  const patch: Autofill = {}
  for (const [k, v] of Object.entries(found) as [AutofillField, string | number][]) {
    const cur = current[k]
    const empty = cur === undefined || cur === null || cur === '' || (k === 'yearsExperience' && !cur)
    if ((overwrite || empty) && v !== '' && v !== undefined) patch[k] = v
  }
  return patch
}

export const AUTOFILL_PROMPT = (resume: string) => `Read this résumé and fill in a job-search profile for its owner. Use only what the résumé says or clearly implies. Return ONLY a JSON object with these keys (use null when unknown):

{
  "name": "full name",
  "email": "email",
  "phone": "phone number as written",
  "linkedin": "full LinkedIn profile URL",
  "github": "full GitHub profile URL",
  "portfolio": "personal website URL",
  "currentTitle": "short current status, e.g. 'Computer Science student, Western University (graduating April 2027)' or their current job title",
  "yearsExperience": number of years of professional experience including internships and co-ops, rounded down,
  "education": "highest degree, school, and graduation date in one line",
  "bio": "2-3 sentence first-person summary of who they are and what they've done, using concrete facts from the résumé",
  "skills": ["15 most relevant hard skills, most important first"],
  "targetRoles": ["4-5 job titles this person is a strong fit for at their level, most suitable first; include 'new grad' or 'junior' level titles only as plain titles, e.g. 'DevOps Engineer'"],
  "targetLocations": ["their city, nearby cities, and 'Remote'"],
  "jobSearchGoals": "1-2 sentences, first person, describing the role they are likely looking for next, based on their experience and graduation date"
}

RÉSUMÉ:
${resume.slice(0, 15000)}`
