import type { RawJob } from './job-boards'
import { adzunaCountry } from './job-boards/adzuna'

interface UserProfile {
  targetRoles: string
  skills: string
  yearsExperience: number
  targetLocations: string
  preferRemote: boolean
  preferHybrid: boolean
  targetSalaryMin: number
  targetSalaryMax: number
  excludeKeywords: string
  industry?: string
}

interface ScoredJob extends RawJob {
  fitScore: number
  fitReason: string
  excitement: number
}

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
}

function keywordOverlap(source: string, target: string): number {
  const sourceTokens = new Set(tokenize(source))
  const targetTokens = tokenize(target)
  if (targetTokens.length === 0) return 0
  const matches = targetTokens.filter(t => sourceTokens.has(t)).length
  return Math.min(1, matches / Math.max(1, Math.min(targetTokens.length, 20)))
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** True if `phrase` appears in `text` as whole word(s): "java" does not match "javascript". */
export function containsPhrase(text: string, phrase: string): boolean {
  const p = phrase.trim().toLowerCase()
  if (!p) return false
  return new RegExp(`(^|[^a-z0-9+#])${escapeRe(p)}($|[^a-z0-9+#])`, 'i').test(text)
}

/** Share of the candidate's listed skills that the posting mentions (0–1). */
export function skillsMatch(skills: string, jobText: string): number {
  const list = [...new Set(skills.split(/[,;\n]/).map(s => s.trim().toLowerCase()).filter(Boolean))]
  if (list.length === 0) return 0.5
  const text = jobText.toLowerCase()
  const hits = list.filter(skill => containsPhrase(text, skill)).length
  // Postings rarely list everything; 6 matching skills counts as a full match.
  return Math.min(1, hits / Math.min(list.length, 6))
}

// Words that say nothing about what the job is.
const TITLE_STOPWORDS = new Set([
  'a', 'an', 'and', 'the', 'of', 'for', 'to', 'in', 'at', 'with', 'on', 'or', 'remote', 'hybrid', 'onsite',
  'us', 'usa', 'uk', 'canada', 'united', 'states', 'kingdom', 'global', 'worldwide', 'contract', 'contractor',
  'full', 'part', 'time', 'temporary', 'i', 'ii', 'iii', 'iv', '1', '2', '3', 'new', 'grad', 'job', 'role', 'position',
])

const titleWords = (s: string) => tokenize(s).filter(w => w.length > 1 && !TITLE_STOPWORDS.has(w))

/** Does the posting title share at least one meaningful word with a target role? */
export function titleRelevant(role: string, targetRoles: string): boolean {
  const targets = new Set(titleWords(targetRoles))
  if (targets.size === 0) return true
  return titleWords(role).some(w => targets.has(w) || (w.length > 4 && [...targets].some(t => t.length > 4 && (t.startsWith(w) || w.startsWith(t)))))
}

/** Country the candidate lives in, guessed from their non-remote target locations. */
export function homeCountry(targetLocations: string): string | null {
  const places = targetLocations.split(',').map(l => l.trim()).filter(l => l && !/remote/i.test(l))
  return places.length ? adzunaCountry(places.join(', ')) : null
}

/** For 'Remote · USA'-style labels: can someone in `home` apply? */
export function remoteEligible(location: string, home: string | null): boolean {
  const req = location.match(/remote\s*[·:\-–(]\s*(.+?)\)?$/i)?.[1]
  if (!req || !home || /worldwide|anywhere|global/i.test(req)) return true
  const ok: Record<string, RegExp> = {
    ca: /canada|north america|americas|\bca\b/i,
    us: /\busa?\b|united states|north america|americas/i,
    gb: /\buk\b|united kingdom|europe|emea|\bgb\b/i,
    au: /australia|apac|asia.?pacific|\bau\b/i,
  }
  return ok[home] ? ok[home].test(req) : true
}

function locationScore(jobLocation: string, targetLocations: string, preferRemote: boolean, isRemote: boolean, isHybrid: boolean): number {
  if (isRemote && !remoteEligible(jobLocation, homeCountry(targetLocations))) return 0.05
  if (isRemote && preferRemote) return 1
  if (isRemote) return 0.7

  const targets = targetLocations.toLowerCase().split(',').map(l => l.trim()).filter(Boolean)
  if (targets.length === 0) return 0.8

  const jobLoc = jobLocation.toLowerCase().trim()
  if (!jobLoc) return 0.5
  const jobCity = jobLoc.split(',')[0].trim()
  for (const target of targets) {
    if (jobLoc.includes(target) || (jobCity.length > 2 && target.includes(jobCity))) return 1
  }
  if (isHybrid && preferRemote) return 0.6
  return 0.3
}

function salaryScore(jobMin: number | null, jobMax: number | null, profileMin: number, profileMax: number): number {
  if (!jobMin && !jobMax) return 0.5
  if (!profileMin && !profileMax) return 0.7 // no target set: don't penalize postings that list pay
  if (!profileMax) profileMax = Infinity
  const mid = ((jobMin ?? jobMax ?? 0) + (jobMax ?? jobMin ?? 0)) / 2
  if (mid >= profileMin && mid <= profileMax) return 1
  if (mid >= profileMin * 0.85 && mid <= profileMax * 1.15) return 0.7
  if (mid >= profileMin * 0.7) return 0.4
  return 0.1
}

function experienceScore(jobDescription: string, yearsExperience: number): number {
  const desc = jobDescription.toLowerCase()
  // "3+ years", "2-4 years of experience", "3 to 5 yrs exp" → use the lower bound.
  const match = desc.match(/(\d{1,2})\s*\+?\s*(?:(?:-|–|to)\s*\d{1,2}\s*)?\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:\w+\s+){0,3}?(?:experience|exp)/i)
  if (!match) return 0.7
  const required = Number(match[1])
  if (yearsExperience >= required) return 1
  if (yearsExperience >= required - 1) return 0.7
  if (yearsExperience >= required - 2) return 0.4
  return 0.1
}

function excludeCheck(jobDescription: string, role: string, excludeKeywords: string): boolean {
  if (!excludeKeywords) return true
  const excludes = excludeKeywords.toLowerCase().split(',').map(k => k.trim()).filter(Boolean)
  const text = `${jobDescription} ${role}`.toLowerCase()
  return !excludes.some(kw => containsPhrase(text, kw))
}

export function scoreJob(job: RawJob, profile: UserProfile): ScoredJob {
  if (!excludeCheck(job.jobDescription, job.role, profile.excludeKeywords)) {
    return { ...job, fitScore: 0, fitReason: 'Contains excluded keywords', excitement: 1 }
  }
  if (!titleRelevant(job.role, profile.targetRoles)) {
    return { ...job, fitScore: 0, fitReason: "Title doesn't match your target roles", excitement: 1 }
  }

  const weights = {
    skills: 0.30,
    location: 0.20,
    salary: 0.15,
    experience: 0.15,
    roleMatch: 0.20,
  }

  const skillsRaw = skillsMatch(profile.skills, `${job.role} ${job.jobDescription} ${job.techStack ?? ''}`)
  const locationRaw = locationScore(job.location, profile.targetLocations, profile.preferRemote, job.remote, job.hybrid)
  const salaryRaw = salaryScore(job.salaryMin, job.salaryMax, profile.targetSalaryMin, profile.targetSalaryMax)
  const experienceRaw = experienceScore(job.jobDescription, profile.yearsExperience)
  const roleMatchRaw = keywordOverlap(profile.targetRoles, job.role)

  const rawScore =
    skillsRaw * weights.skills +
    locationRaw * weights.location +
    salaryRaw * weights.salary +
    experienceRaw * weights.experience +
    roleMatchRaw * weights.roleMatch

  const fitScore = Math.round(rawScore * 100)

  const reasons: string[] = []
  if (skillsRaw > 0.6) reasons.push('strong skills match')
  if (locationRaw === 1) reasons.push(job.remote ? 'remote (preferred)' : 'location match')
  const caveats: string[] = []
  if (locationRaw < 0.1) caveats.push('remote, but may be limited to another country')
  if (salaryRaw >= 0.7) reasons.push('salary in range')
  if (experienceRaw >= 0.7) reasons.push('experience level fits')
  if (roleMatchRaw > 0.5) reasons.push('role title aligns')

  const fitReason = (reasons.length > 0
    ? `Good fit: ${reasons.join(', ')}.`
    : `Partial match — check ${fitScore < 40 ? 'skills and location' : 'salary and experience'}.`)
    + (caveats.length ? ` Note: ${caveats.join('; ')}.` : '')

  const excitement = fitScore >= 80 ? 5 : fitScore >= 65 ? 4 : fitScore >= 50 ? 3 : fitScore >= 35 ? 2 : 1

  return { ...job, fitScore, fitReason, excitement }
}

export function scoreAndRankJobs(jobs: RawJob[], profile: UserProfile): ScoredJob[] {
  return jobs
    .map(j => scoreJob(j, profile))
    .filter(j => j.fitScore > 0)
    .sort((a, b) => b.fitScore - a.fitScore)
}
