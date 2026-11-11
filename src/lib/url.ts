/** Compare URLs without protocol, www, trailing slash, hash or tracking params. */
export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw.trim())
    for (const k of [...u.searchParams.keys()]) {
      if (/^(utm_|ref$|refid$|trk|src$|from$)/i.test(k)) u.searchParams.delete(k)
    }
    u.hash = ''
    return (u.host.replace(/^www\./, '') + u.pathname.replace(/\/+$/, '') + (u.search || '')).toLowerCase()
  } catch {
    return raw.trim().toLowerCase()
  }
}

// Sites that repost listings from elsewhere. Applying through the employer is more reliable.
const AGGREGATORS = /(^|\.)(canadajobs\.works|speedyapply\.com|jooble\.org|talent\.com|simplyhired\.(com|ca)|ziprecruiter\.(com|ca)|jobillico\.com|careerjet\.(com|ca)|adzuna\.(com|ca)|jobrapido\.com|neuvoo\.(com|ca)|whatjobs\.com|learn4good\.com|jobleads\.com|builtin\.com|remoterocketship\.com|hiring\.cafe|jobgether\.com|wellfound\.com)$/i

/** True if the link goes to a job-listing site rather than the employer or an ATS. */
export function isAggregator(url: string | null | undefined): boolean {
  if (!url) return false
  try { return AGGREGATORS.test(new URL(url).hostname.replace(/^www\./, '')) } catch { return false }
}
