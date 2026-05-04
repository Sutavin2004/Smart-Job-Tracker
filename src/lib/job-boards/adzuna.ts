import type { RawJob } from './jsearch'

export async function searchAdzuna(role: string, location: string, country = 'ca'): Promise<RawJob[]> {
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY
  if (!appId || !appKey) return []

  const countryMap: Record<string, string> = {
    canada: 'ca', ca: 'ca', usa: 'us', us: 'us', uk: 'gb', gb: 'gb',
    australia: 'au', au: 'au', remote: 'ca',
  }
  const cc = countryMap[location.toLowerCase()] ?? country

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: '15',
    what: role,
    where: location.toLowerCase() === 'remote' ? '' : location,
    content_type: 'application/json',
    sort_by: 'date',
    max_days_old: '30',
  })

  const res = await fetch(`https://api.adzuna.com/v1/api/jobs/${cc}/search/1?${params}`)
  if (!res.ok) return []

  const data = await res.json() as { results?: Record<string, unknown>[] }
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
