import { decodeEntities, htmlToText } from './html'
import type { ImportedJob } from './job-import'

/**
 * Public job APIs for the most common applicant tracking systems. Their posting
 * pages are rendered with JavaScript, so the HTML often has no job data, but
 * each one exposes the same posting as JSON without authentication.
 */
export type AtsRef =
  | { kind: 'greenhouse'; board: string; id: string }
  | { kind: 'lever'; site: string; id: string; eu: boolean }
  | { kind: 'ashby'; org: string; id: string }

export function detectAts(rawUrl: string): AtsRef | null {
  let u: URL
  try { u = new URL(rawUrl) } catch { return null }
  const host = u.hostname.toLowerCase()
  const path = u.pathname
  if (host === 'greenhouse.io' || host.endsWith('.greenhouse.io')) {
    const m = path.match(/^\/([\w-]+)\/jobs\/(\d+)/)
    if (m) return { kind: 'greenhouse', board: m[1], id: m[2] }
    const board = u.searchParams.get('for'), id = u.searchParams.get('token')
    if (board && id && /^\d+$/.test(id)) return { kind: 'greenhouse', board, id }
  }
  if (host === 'jobs.lever.co' || host === 'jobs.eu.lever.co') {
    const m = path.match(/^\/([\w.-]+)\/([0-9a-f-]{36})/i)
    if (m) return { kind: 'lever', site: m[1], id: m[2], eu: host.includes('.eu.') }
  }
  if (host === 'jobs.ashbyhq.com') {
    const m = path.match(/^\/([^/]+)\/([0-9a-f-]{36})/i)
    if (m) return { kind: 'ashby', org: decodeURIComponent(m[1]), id: m[2] }
  }
  return null
}

export function apiUrl(ref: AtsRef): string {
  switch (ref.kind) {
    case 'greenhouse': return `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(ref.board)}/jobs/${ref.id}?pay_transparency=true`
    case 'lever': return `https://api.${ref.eu ? 'eu.' : ''}lever.co/v0/postings/${encodeURIComponent(ref.site)}/${ref.id}`
    case 'ashby': return `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(ref.org)}?includeCompensation=true`
  }
}

const titleCase = (slug: string) => slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
const k = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? Math.round(n / 1000) : null)
const fmt = (n: unknown) => (typeof n === 'number' ? n.toLocaleString('en-US') : '')
const isRemote = (...parts: unknown[]) => parts.some(p => typeof p === 'string' && /remote/i.test(p))

const base = (): ImportedJob => ({
  company: null, role: null, location: null, remote: false, salaryRaw: null, salaryMin: null, salaryMax: null,
  currency: null, jobDescription: null, deadline: null, employmentType: null,
})

type J = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

export function mapGreenhouse(d: J, ref: Extract<AtsRef, { kind: 'greenhouse' }>): ImportedJob & { jobUrl?: string } {
  const loc = d.location?.name ?? null
  const pay = Array.isArray(d.pay_input_ranges) ? d.pay_input_ranges[0] : null
  const min = pay?.min_cents != null ? pay.min_cents / 100 : null
  const max = pay?.max_cents != null ? pay.max_cents / 100 : null
  return {
    ...base(),
    company: d.company_name ?? titleCase(ref.board),
    role: d.title ?? null,
    location: loc,
    remote: isRemote(loc),
    salaryRaw: pay ? `${pay.currency_type ?? ''} ${fmt(min)}–${fmt(max)}`.trim() : null,
    salaryMin: k(min), salaryMax: k(max),
    currency: pay?.currency_type ?? null,
    // Greenhouse returns HTML that is itself entity-escaped.
    jobDescription: d.content ? htmlToText(decodeEntities(d.content)).slice(0, 12000) : null,
    jobUrl: d.absolute_url,
  }
}

const LEVER_INTERVAL: Record<string, number> = { 'per-year-salary': 1, 'per-month-salary': 12, 'per-week-salary': 52, 'per-day-wage': 260, 'per-hour-wage': 2080 }

export function mapLever(d: J, ref: Extract<AtsRef, { kind: 'lever' }>): ImportedJob & { jobUrl?: string } {
  const loc = d.categories?.location ?? null
  const sr = d.salaryRange
  const mult = sr ? LEVER_INTERVAL[sr.interval] ?? 1 : 1
  const lists = Array.isArray(d.lists)
    ? d.lists.map((l: J) => `${l.text}\n${htmlToText(l.content ?? '')}`).join('\n\n')
    : ''
  const desc = [d.descriptionPlain ?? (d.description ? htmlToText(d.description) : ''), lists, d.additionalPlain ?? ''].filter(Boolean).join('\n\n').trim()
  return {
    ...base(),
    company: titleCase(ref.site),
    role: d.text ?? null,
    location: loc,
    remote: d.workplaceType === 'remote' || isRemote(loc),
    salaryRaw: sr ? `${sr.currency ?? ''} ${fmt(sr.min)}–${fmt(sr.max)}${mult !== 1 ? ` (${String(sr.interval).replace(/-/g, ' ')})` : ''}`.trim() : null,
    salaryMin: sr ? k(sr.min * mult) : null,
    salaryMax: sr ? k(sr.max * mult) : null,
    currency: sr?.currency ?? null,
    jobDescription: desc ? desc.slice(0, 12000) : null,
    employmentType: d.categories?.commitment ?? null,
    jobUrl: d.hostedUrl,
  }
}

const ASHBY_INTERVAL: Record<string, number> = { '1 YEAR': 1, '1 MONTH': 12, '1 WEEK': 52, '1 DAY': 260, '1 HOUR': 2080 }

export function mapAshby(board: J, ref: Extract<AtsRef, { kind: 'ashby' }>): (ImportedJob & { jobUrl?: string }) | null {
  const d = (board.jobs as J[] | undefined)?.find(j => j.id === ref.id)
  if (!d) return null
  const salary = (d.compensation?.summaryComponents as J[] | undefined)?.find(c => c.compensationType === 'Salary')
  const mult = salary ? ASHBY_INTERVAL[salary.interval] ?? 1 : 1
  return {
    ...base(),
    company: titleCase(ref.org),
    role: d.title ?? null,
    location: d.location ?? null,
    remote: Boolean(d.isRemote) || d.workplaceType === 'Remote' || isRemote(d.location),
    salaryRaw: d.compensation?.compensationTierSummary ?? null,
    salaryMin: salary ? k(salary.minValue * mult) : null,
    salaryMax: salary ? k(salary.maxValue * mult) : null,
    currency: salary?.currencyCode ?? null,
    jobDescription: (d.descriptionPlain ?? (d.descriptionHtml ? htmlToText(d.descriptionHtml) : null))?.slice(0, 12000) ?? null,
    employmentType: d.employmentType ?? null,
    jobUrl: d.jobUrl,
  }
}

export function mapAts(ref: AtsRef, data: unknown) {
  const d = data as J
  switch (ref.kind) {
    case 'greenhouse': return mapGreenhouse(d, ref)
    case 'lever': return mapLever(d, ref)
    case 'ashby': return mapAshby(d, ref)
  }
}
