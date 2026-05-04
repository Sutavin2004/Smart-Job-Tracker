export interface RawJob {
  company: string
  role: string
  location: string
  remote: boolean
  hybrid: boolean
  salaryRaw: string | null
  salaryMin: number | null
  salaryMax: number | null
  jobUrl: string | null
  jobDescription: string
  source: string
  industry: string | null
  techStack: string | null
}

export async function searchJSearch(query: string, location: string, remote: boolean): Promise<RawJob[]> {
  const key = process.env.RAPIDAPI_KEY
  if (!key) return []

  // Build query — keep it simple, location goes into query string for JSearch
  const searchQuery = remote ? `${query} remote` : `${query} ${location}`

  const params = new URLSearchParams({
    query: searchQuery,
    page: '1',
    num_pages: '2',      // fetch 2 pages to get more results
    date_posted: 'all',  // don't restrict by date — more results
    employment_types: 'FULLTIME,CONTRACTOR,INTERN',
  })

  const res = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
    headers: {
      'X-RapidAPI-Key': key,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
    },
    signal: AbortSignal.timeout(15000),
  }).catch(() => null)

  if (!res || !res.ok) return []

  let data: { data?: Record<string, unknown>[] }
  try {
    data = await res.json()
  } catch {
    return []
  }

  const items = data.data ?? []

  return items.slice(0, 20).map(j => {
    const minSalary = j.job_min_salary ? Number(j.job_min_salary) : null
    const maxSalary = j.job_max_salary ? Number(j.job_max_salary) : null
    const isRemote = Boolean(j.job_is_remote)
    const jobLoc = isRemote
      ? 'Remote'
      : [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', ') || location

    return {
      company: String(j.employer_name ?? 'Unknown'),
      role: String(j.job_title ?? query),
      location: jobLoc,
      remote: isRemote,
      hybrid: String(j.job_employment_type ?? '').toLowerCase().includes('hybrid'),
      salaryRaw: minSalary && maxSalary ? `$${minSalary}–$${maxSalary}` : null,
      salaryMin: minSalary ? Math.round(minSalary / 1000) : null,
      salaryMax: maxSalary ? Math.round(maxSalary / 1000) : null,
      jobUrl: j.job_apply_link ? String(j.job_apply_link) : null,
      jobDescription: String(j.job_description ?? '').slice(0, 800),
      source: String(j.job_publisher ?? 'LinkedIn/Indeed'),
      industry: j.employer_company_type ? String(j.employer_company_type) : null,
      techStack: null,
    }
  })
}
