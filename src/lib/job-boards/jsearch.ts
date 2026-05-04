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

  const params = new URLSearchParams({
    query: `${query} ${remote ? 'remote' : location}`,
    page: '1',
    num_pages: '1',
    date_posted: 'month',
  })
  if (remote) params.set('remote_jobs_only', 'true')

  const res = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
    headers: {
      'X-RapidAPI-Key': key,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
    },
  })

  if (!res.ok) return []

  const data = await res.json() as { data?: Record<string, unknown>[] }
  const items = data.data ?? []

  return items.slice(0, 15).map(j => {
    const minSalary = j.job_min_salary ? Number(j.job_min_salary) : null
    const maxSalary = j.job_max_salary ? Number(j.job_max_salary) : null
    return {
      company: String(j.employer_name ?? 'Unknown'),
      role: String(j.job_title ?? query),
      location: j.job_is_remote ? 'Remote' : [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', ') || location,
      remote: Boolean(j.job_is_remote),
      hybrid: String(j.job_employment_type ?? '').toLowerCase().includes('hybrid'),
      salaryRaw: minSalary && maxSalary ? `$${minSalary}–$${maxSalary}` : null,
      salaryMin: minSalary ? Math.round(minSalary / 1000) : null,
      salaryMax: maxSalary ? Math.round(maxSalary / 1000) : null,
      jobUrl: j.job_apply_link ? String(j.job_apply_link) : null,
      jobDescription: String(j.job_description ?? '').slice(0, 800),
      source: String(j.job_publisher ?? 'JSearch'),
      industry: j.employer_company_type ? String(j.employer_company_type) : null,
      techStack: null,
    }
  })
}
