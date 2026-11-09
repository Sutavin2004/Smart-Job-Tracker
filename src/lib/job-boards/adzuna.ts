import type { RawJob } from './jsearch'

const CA = /\b(canada|toronto|vancouver|montr[eé]al|calgary|edmonton|ottawa|waterloo|kitchener|mississauga|markham|brampton|hamilton|london,?\s*on|winnipeg|halifax|qu[eé]bec|victoria|ontario|british columbia|alberta|on|bc|ab|qc|mb|sk|ns|nb|nl|pei)\b/i
const GB = /\b(uk|united kingdom|england|scotland|wales|london|manchester|edinburgh|bristol|cambridge|oxford)\b/i
const US = /\b(usa|united states|new york|nyc|san francisco|seattle|austin|boston|chicago|los angeles|denver|atlanta|miami|washington,?\s*dc|[a-z ]+,\s*(ny|wa|tx|ma|il|co|ga|fl|nj|pa|va|nc|or|mi|mn|az))\b/i
const AU = /\b(australia|sydney|melbourne|brisbane|perth)\b/i

/** Pick the Adzuna country site for a free-text location (defaults to Canada). */
export function adzunaCountry(location: string): string {
  if (CA.test(location)) return 'ca' // check first: 'London, ON' is Canada
  if (GB.test(location)) return 'gb'
  if (AU.test(location)) return 'au'
  if (US.test(location)) return 'us'
  return 'ca'
}

export async function searchAdzuna(role: string, location: string): Promise<RawJob[]> {
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY
  if (!appId || !appKey) return []

  const cc = adzunaCountry(location)
  // Adzuna matches 'where' against place names; drop province/country suffixes.
  const where = /^remote$|^canada$|^usa$|^uk$/i.test(location.trim()) ? '' : location.split(',')[0].trim()

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: '15',
    what: role,
    where,
    content_type: 'application/json',
    sort_by: 'date',
    max_days_old: '30',
  })

  const res = await fetch(`https://api.adzuna.com/v1/api/jobs/${cc}/search/1?${params}`, { signal: AbortSignal.timeout(12000) }).catch(() => null)
  if (!res?.ok) return []

  const data = await res.json().catch(() => ({})) as { results?: Record<string, unknown>[] }
  const items = data.results ?? []

  return items.slice(0, 15).map(j => {
    const salaryMin = j.salary_min ? Math.round(Number(j.salary_min) / 1000) : null
    const salaryMax = j.salary_max ? Math.round(Number(j.salary_max) / 1000) : null
    const titleStr = String(j.title ?? role)
    const desc = String(j.description ?? '').slice(0, 800)
    const isRemote = desc.toLowerCase().includes('remote') || titleStr.toLowerCase().includes('remote')
    return {
      company: String((j.company as Record<string, unknown>)?.display_name ?? 'Unknown'),
      role: titleStr,
      location: isRemote ? 'Remote' : String((j.location as Record<string, unknown>)?.display_name ?? location),
      remote: isRemote,
      hybrid: desc.toLowerCase().includes('hybrid'),
      salaryRaw: salaryMin && salaryMax ? `${salaryMin}k–${salaryMax}k` : null,
      salaryMin,
      salaryMax,
      jobUrl: j.redirect_url ? String(j.redirect_url) : null,
      jobDescription: desc,
      source: 'Adzuna',
      industry: j.category ? String((j.category as Record<string, unknown>)?.label ?? null) : null,
      techStack: null,
    }
  })
}
