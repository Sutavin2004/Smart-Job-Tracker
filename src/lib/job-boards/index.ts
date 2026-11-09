import type { RawJob } from './jsearch'
import { searchJSearch } from './jsearch'
import { searchAdzuna } from './adzuna'
import { searchRemoteOK } from './remoteok'
import { searchRemotive, searchJobicy } from './remote-boards'

export type { RawJob }

export interface SearchParams {
  roles: string[]
  locations: string[]
  preferRemote: boolean
}

export async function fetchRealJobs(params: SearchParams): Promise<{ jobs: RawJob[]; sources: string[] }> {
  const { roles, locations, preferRemote } = params
  const allJobs: RawJob[] = []
  const activeSources: string[] = []

  const searchPromises: Promise<RawJob[]>[] = []

  for (const role of roles.slice(0, 3)) {
    for (const loc of locations.slice(0, 2)) {
      searchPromises.push(searchJSearch(role, loc, preferRemote))
      searchPromises.push(searchAdzuna(role, loc))
    }
    // Remote boards: always when remote is preferred or a target location is 'Remote'.
    if (preferRemote || locations.some(l => /remote/i.test(l))) {
      searchPromises.push(searchRemoteOK(role), searchRemotive(role), searchJobicy(role))
    }
  }

  const results = await Promise.allSettled(searchPromises)

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

  return { jobs: deduped, sources: activeSources }
}
