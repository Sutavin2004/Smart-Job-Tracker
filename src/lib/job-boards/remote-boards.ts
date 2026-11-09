import type { RawJob } from './jsearch'
import { htmlToText } from '../html'

/* Keyless remote-job APIs. Both ask for light usage; the agent calls each once per role. */

type J = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

async function getJson(url: string): Promise<J | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'SmartJobTracker/1.0' }, signal: AbortSignal.timeout(12000) })
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}

const remoteLabel = (req: unknown) =>
  typeof req === 'string' && req.trim() && !/worldwide|anywhere/i.test(req) ? `Remote · ${req.trim()}` : 'Remote'

export function mapRemotive(j: J): RawJob {
  const salary = typeof j.salary === 'string' && j.salary.trim() ? j.salary.trim() : null
  const nums = salary?.replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*k?\D+(\d+(?:\.\d+)?)\s*k?/i)
  const toK = (n: string) => { const v = Number(n); return v > 1000 ? Math.round(v / 1000) : Math.round(v) }
  return {
    company: String(j.company_name ?? 'Unknown'),
    role: String(j.title ?? ''),
    location: remoteLabel(j.candidate_required_location),
    remote: true,
    hybrid: false,
    salaryRaw: salary,
    salaryMin: nums ? toK(nums[1]) : null,
    salaryMax: nums ? toK(nums[2]) : null,
    jobUrl: j.url ? String(j.url) : null,
    jobDescription: htmlToText(String(j.description ?? '')).slice(0, 1500),
    source: 'Remotive',
    industry: j.category ? String(j.category) : null,
    techStack: Array.isArray(j.tags) ? j.tags.slice(0, 12).join(', ') : null,
  }
}

export function mapJobicy(j: J): RawJob {
  const min = Number(j.annualSalaryMin) || null
  const max = Number(j.annualSalaryMax) || null
  return {
    company: String(j.companyName ?? 'Unknown'),
    role: htmlToText(String(j.jobTitle ?? '')),
    location: remoteLabel(j.jobGeo),
    remote: true,
    hybrid: false,
    salaryRaw: min || max ? `${j.salaryCurrency ?? ''} ${min ?? ''}–${max ?? ''}`.trim() : null,
    salaryMin: min ? Math.round(min / 1000) : null,
    salaryMax: max ? Math.round(max / 1000) : null,
    jobUrl: j.url ? String(j.url) : null,
    jobDescription: htmlToText(String(j.jobDescription ?? j.jobExcerpt ?? '')).slice(0, 1500),
    source: 'Jobicy',
    industry: Array.isArray(j.jobIndustry) ? htmlToText(String(j.jobIndustry[0] ?? '')) || null : null,
    techStack: null,
  }
}

export async function searchRemotive(role: string): Promise<RawJob[]> {
  const data = await getJson(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(role)}&limit=20`)
  return Array.isArray(data?.jobs) ? data.jobs.slice(0, 15).map(mapRemotive) : []
}

export async function searchJobicy(role: string): Promise<RawJob[]> {
  const tag = role.toLowerCase().split(/\s+/).slice(0, 2).join('-')
  const data = await getJson(`https://jobicy.com/api/v2/remote-jobs?count=20&tag=${encodeURIComponent(tag)}`)
  return Array.isArray(data?.jobs) ? data.jobs.slice(0, 15).map(mapJobicy) : []
}
