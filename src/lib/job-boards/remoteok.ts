import type { RawJob } from './jsearch'

export async function searchRemoteOK(role: string): Promise<RawJob[]> {
  const tag = role.toLowerCase().replace(/\s+/g, '-')

  const res = await fetch(`https://remoteok.com/api?tag=${encodeURIComponent(tag)}`, {
    headers: { 'User-Agent': 'JobTracker/1.0' },
  }).catch(() => null)

  if (!res?.ok) return []

  const data = await res.json() as Record<string, unknown>[]
  const items = data.filter(j => j && typeof j === 'object' && 'position' in j)

  return items.slice(0, 10).map(j => {
    const salaryRaw = j.salary ? String(j.salary) : null
    const match = salaryRaw?.match(/(\d+)\D+(\d+)/)
    const salaryMin = match ? Number(match[1]) : null
    const salaryMax = match ? Number(match[2]) : null
    const tags = Array.isArray(j.tags) ? (j.tags as string[]).join(', ') : null
    return {
      company: String(j.company ?? 'Unknown'),
      role: String(j.position ?? role),
      location: 'Remote',
      remote: true,
      hybrid: false,
      salaryRaw,
      salaryMin,
      salaryMax,
      jobUrl: j.url ? String(j.url) : null,
      jobDescription: String(j.description ?? '').replace(/<[^>]*>/g, '').slice(0, 800),
      source: 'RemoteOK',
      industry: null,
      techStack: tags,
    }
  })
}
