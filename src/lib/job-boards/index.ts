import type { RawJob } from './jsearch'
import { searchJSearch } from './jsearch'
import { searchAdzuna, BoardError } from './adzuna'
import { searchRemoteOK } from './remoteok'
import { searchRemotive, searchJobicy } from './remote-boards'

export type { RawJob }

export interface SearchParams {
  roles: string[]
  locations: string[]
  preferRemote: boolean
}

export async function fetchRealJobs(params: SearchParams): Promise<{ jobs: RawJob[]; sources: string[]; problems: string[] }> {
  const { roles, locations, preferRemote } = params
  const allJobs: RawJob[] = []
  const activeSources: string[] = []

  const searchPromises: Promise<RawJob[]>[] = []

  // Adzuna's free plan rejects bursts, so its searches run one after another.
  const adzunaQueries = roles.slice(0, 3).flatMap(role => locations.filter(l => !/^remote$/i.test(l.trim())).slice(0, 2).map(loc => [role, loc] as const))
  searchPromises.push((async () => {
    const out: RawJob[] = []
    let firstError: unknown = null
    for (const [i, [role, loc]] of adzunaQueries.entries()) {
      if (i) await new Promise(r => setTimeout(r, 1100))
      try { out.push(...await searchAdzuna(role, loc)) } catch (e) { firstError ??= e }
    }
    // Report a failure only if nothing came back at all.
    if (!out.length && firstError) throw firstError
    return out
  })())

  for (const role of roles.slice(0, 3)) {
    for (const loc of locations.slice(0, 2)) {
      searchPromises.push(searchJSearch(role, loc, preferRemote))
    }
    // Remote boards: always when remote is preferred or a target location is 'Remote'.
    if (preferRemote || locations.some(l => /remote/i.test(l))) {
      searchPromises.push(searchRemoteOK(role), searchRemotive(role), searchJobicy(role))
    }
  }

  const results = await Promise.allSettled(searchPromises)

  // One message per failing source, e.g. "Adzuna rejected the App ID or App Key…".
  // Users see a plain note; the exact reason (for whoever runs the site) goes to the server log.
  const problems = [...new Set(results.flatMap(r => {
    if (r.status !== 'rejected' || !(r.reason instanceof BoardError)) return []
    console.error('job board', r.reason.message)
    return [`${r.reason.source} couldn't be searched this time`]
  }))]

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      allJobs.push(...result.value)
      const sources = result.value.map(j => j.source).filter(Boolean)
      for (const s of sources) {
        if (!activeSources.includes(s)) activeSources.push(s)
      }
    }
  }

  // Deduplicate by company+role combination
  const seen = new Set<string>()
  const deduped = allJobs.filter(j => {
    if (!j.role.trim() || !j.jobUrl) return false // a posting we can't link to isn't useful
    const key = `${j.company.toLowerCase().trim()}|${j.role.toLowerCase().trim()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return { jobs: deduped, sources: activeSources, problems }
}
