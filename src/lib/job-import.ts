import { decodeEntities, htmlToText } from './html'

/** Fields we can prefill in the Add Job form from a posting page. */
export interface ImportedJob {
  company: string | null
  role: string | null
  location: string | null
  remote: boolean
  salaryRaw: string | null
  salaryMin: number | null // thousands
  salaryMax: number | null // thousands
  currency: string | null
  jobDescription: string | null
  deadline: string | null // ISO date (YYYY-MM-DD)
  employmentType: string | null
}

type Json = Record<string, unknown>

const asString = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() ? decodeEntities(v.trim()) : null

function* walk(node: unknown): Generator<Json> {
  if (Array.isArray(node)) {
    for (const n of node) yield* walk(n)
  } else if (node && typeof node === 'object') {
    const obj = node as Json
    yield obj
    if (obj['@graph']) yield* walk(obj['@graph'])
  }
}

function isJobPosting(o: Json): boolean {
  const t = o['@type']
  return t === 'JobPosting' || (Array.isArray(t) && t.includes('JobPosting'))
}

/** Find the first schema.org JobPosting in any JSON-LD block on the page. */
export function findJobPosting(html: string): Json | null {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  for (const m of html.matchAll(re)) {
    let data: unknown
    try {
      data = JSON.parse(m[1].trim())
    } catch {
      // Some sites leave raw control characters inside strings; retry once without them.
      try { data = JSON.parse(m[1].replace(/[\u0000-\u001f]+/g, ' ')) } catch { continue }
    }
    for (const o of walk(data)) if (isJobPosting(o)) return o
  }
  return null
}

function formatLocation(jobLocation: unknown): string | null {
  const places = Array.isArray(jobLocation) ? jobLocation : jobLocation ? [jobLocation] : []
  const parts = places.map(p => {
    const addr = (p as Json)?.address as Json | string | undefined
    if (typeof addr === 'string') return addr
    if (!addr) return asString((p as Json)?.name)
    const country = typeof addr.addressCountry === 'object'
      ? asString((addr.addressCountry as Json).name)
      : asString(addr.addressCountry)
    return [asString(addr.addressLocality), asString(addr.addressRegion), country].filter(Boolean).join(', ') || null
  }).filter(Boolean) as string[]
  return parts.length ? [...new Set(parts)].slice(0, 3).join(' · ') : null
}

const YEAR_MULTIPLIER: Record<string, number> = { HOUR: 2080, DAY: 260, WEEK: 52, MONTH: 12, YEAR: 1 }

function parseSalary(baseSalary: unknown): Pick<ImportedJob, 'salaryRaw' | 'salaryMin' | 'salaryMax' | 'currency'> {
  const empty = { salaryRaw: null, salaryMin: null, salaryMax: null, currency: null }
  if (!baseSalary || typeof baseSalary !== 'object') return empty
  const bs = baseSalary as Json
  const value = (bs.value && typeof bs.value === 'object' ? bs.value : bs) as Json
  const num = (v: unknown) => (v == null || v === '' ? null : Number(String(v).replace(/[^\d.]/g, '')) || null)
  let min = num(value.minValue) ?? num(value.value)
  let max = num(value.maxValue) ?? num(value.value)
  if (min == null && max == null) return empty
  const unit = String(value.unitText ?? bs.unitText ?? 'YEAR').toUpperCase()
  const currency = asString(bs.currency) ?? asString(value.currency)
  const raw = `${currency ? currency + ' ' : ''}${min?.toLocaleString('en-US') ?? ''}${max && max !== min ? `–${max.toLocaleString('en-US')}` : ''}${unit !== 'YEAR' ? ` / ${unit.toLowerCase()}` : ''}`
  const mult = YEAR_MULTIPLIER[unit] ?? 1
  if (min != null) min = Math.round((min * mult) / 1000)
  if (max != null) max = Math.round((max * mult) / 1000)
  return { salaryRaw: raw.trim(), salaryMin: min, salaryMax: max, currency }
}

function toIsoDate(v: unknown): string | null {
  const s = asString(v)
  if (!s) return null
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

/** Build prefill data from a JobPosting object. */
export function fromJobPosting(o: Json): ImportedJob {
  const org = o.hiringOrganization
  const company = typeof org === 'string' ? decodeEntities(org) : asString((org as Json | undefined)?.name)
  const locType = String(o.jobLocationType ?? '').toUpperCase()
  const location = formatLocation(o.jobLocation)
  const remote = locType.includes('TELECOMMUTE') || /\bremote\b/i.test(location ?? '')
  const desc = asString(o.description)
  const employment = Array.isArray(o.employmentType) ? o.employmentType.join(', ') : asString(o.employmentType)
  return {
    company,
    role: asString(o.title),
    location: location ?? (remote ? 'Remote' : null),
    remote,
    ...parseSalary(o.baseSalary ?? o.estimatedSalary),
    jobDescription: desc ? htmlToText(desc).slice(0, 12000) : null,
    deadline: toIsoDate(o.validThrough),
    employmentType: employment ? String(employment) : null,
  }
}

function meta(html: string, key: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*>`, 'i')
  const tag = html.match(re)?.[0]
  const content = tag?.match(/content=["']([^"']*)["']/i)?.[1]
  return content ? decodeEntities(content.trim()) || null : null
}

/** Best-effort fallback from OpenGraph / <title> when there is no JobPosting data. */
export function fromMetaTags(html: string): ImportedJob {
  const title = meta(html, 'og:title') ?? decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? '') ?? null
  const site = meta(html, 'og:site_name')
  // Common shapes: "Role at Company", "Role - Company", "Company | Role"
  let role: string | null = title || null
  let company: string | null = null
  const at = title?.match(/^(.+?)\s+(?:at|@)\s+(.+?)(?:\s*[|\-–]\s*.*)?$/i)
  if (at) { role = at[1]; company = at[2] }
  else if (title && /\s[-–|]\s/.test(title)) {
    const [a, b] = title.split(/\s[-–|]\s/)
    role = a; company = site && b?.toLowerCase().includes(site.toLowerCase()) ? site : b ?? null
  }
  return {
    company: company ?? site,
    role,
    location: null,
    remote: false,
    salaryRaw: null, salaryMin: null, salaryMax: null, currency: null,
    jobDescription: meta(html, 'og:description') ?? meta(html, 'description'),
    deadline: null,
    employmentType: null,
  }
}

/** Main entry: structured data first, then meta tags. `source` tells the caller which won. */
export function extractJob(html: string): { job: ImportedJob; source: 'json-ld' | 'meta' } {
  const posting = findJobPosting(html)
  if (posting) return { job: fromJobPosting(posting), source: 'json-ld' }
  return { job: fromMetaTags(html), source: 'meta' }
}
