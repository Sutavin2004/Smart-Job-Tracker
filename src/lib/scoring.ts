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

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** True if `phrase` appears in `text` as whole word(s): "java" does not match "javascript". */
export function containsPhrase(text: string, phrase: string): boolean {
  const p = phrase.trim().toLowerCase()
  if (!p) return false
  return new RegExp(`(^|[^a-z0-9+#])${escapeRe(p)}($|[^a-z0-9+#])`, 'i').test(text)
}

const SKILL_ALIASES: Record<string, string[]> = {
  'ci/cd': ['ci/cd', 'continuous integration', 'continuous delivery', 'continuous deployment', 'cicd'],
  'next.js': ['next.js', 'nextjs'],
  'node.js': ['node.js', 'nodejs', 'node'],
  'postgresql': ['postgresql', 'postgres'],
  'javascript': ['javascript', 'js'],
  'typescript': ['typescript', 'ts'],
  'kubernetes': ['kubernetes', 'k8s'],
  'machine learning': ['machine learning', 'ml'],
}

/** Ways a skill can appear in a posting: "Linux system administration (RHEL)" → linux system administration, rhel, linux. */
export function skillTerms(skill: string): string[] {
  const s = skill.trim().toLowerCase()
  const inner = [...s.matchAll(/\(([^)]+)\)/g)].flatMap(m => m[1].split(/[\/,]/)).map(t => t.trim())
  const base = s.replace(/\([^)]*\)/g, '').trim()
  const terms = new Set([base, ...inner, ...(SKILL_ALIASES[base] ?? [])])
  // "RAG systems" → "rag"; "Linux system administration" → "linux".
  const head = base.replace(/\s+(systems?|administration|development|frameworks?|apis?)$/, '').trim()
  terms.add(head)
  const first = base.split(/\s+/)[0]
  if (base.split(/\s+/).length > 1 && /^(linux|python|java|react|aws|azure|gcp|docker|kubernetes|sql|ansible|terraform)$/.test(first)) terms.add(first)
  return [...terms].filter(t => t.length > 1)
}

/** Share of the candidate's listed skills that the posting mentions (0–1). */
export function skillsMatch(skills: string, jobText: string): number {
  const list = [...new Set(skills.split(/[,;\n]/).map(s => s.trim().toLowerCase()).filter(Boolean))]
  if (list.length === 0) return 0.5
  const text = jobText.toLowerCase()
  const hits = list.filter(skill => skillTerms(skill).some(t => containsPhrase(text, t))).length
  // Postings rarely list everything; 6 matching skills counts as a full match.
  return Math.min(1, hits / Math.min(list.length, 6))
}

// Words that say nothing about what the job is.
const TITLE_STOPWORDS = new Set([
  'a', 'an', 'and', 'the', 'of', 'for', 'to', 'in', 'at', 'with', 'on', 'or', 'remote', 'hybrid', 'onsite',
  'us', 'usa', 'uk', 'canada', 'united', 'states', 'kingdom', 'global', 'worldwide', 'contract', 'contractor',
  'full', 'part', 'time', 'temporary', 'i', 'ii', 'iii', 'iv', '1', '2', '3', 'new', 'grad', 'job', 'role', 'position',
])

/** How much of the closest target role the title covers (0–1): "Software Engineer" fully covers "Junior Software Engineer". */
export function roleMatch(role: string, targetRoles: string): number {
  const title = new Set(titleWords(role.replace(/-/g, ' ')))
  const targets = targetRoles.split(',').map(t => titleWords(t.replace(/-/g, ' '))).filter(t => t.length)
  if (!targets.length) return 0.5
  return Math.max(...targets.map(t => t.filter(w => title.has(w)).length / t.length))
}

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

const ENTRY_LEVEL = /\b(junior|jr\.?|entry[\s-]level|new grad(uate)?|graduate|early[\s-]career|associate|intern(ship)?|co-?op)\b/i

/** Lowest number of years the posting asks for, or null. */
export function requiredYears(text: string): number | null {
  const re = /(\d{1,2})\s*\+?\s*(?:(?:-|–|to)\s*\d{1,2}\s*)?\+?\s*(?:years?|yrs?)\b(?:\s+of)?\s+(?:[\w/-]+\s+){0,4}?(?:experience|exp|professional|industry|engineering|development|programming|hands-on|working)/gi
  const years = [...text.matchAll(re)].map(m => Number(m[1])).filter(n => n > 0 && n < 20)
  return years.length ? Math.min(...years) : null
}

export function experienceScore(jobDescription: string, yearsExperience: number, role = ''): number {
  const required = requiredYears(jobDescription)
  const entry = ENTRY_LEVEL.test(role) || (required === null && ENTRY_LEVEL.test(jobDescription.slice(0, 600)))
  if (required === null) return entry && yearsExperience <= 3 ? 1 : 0.6
  if (yearsExperience >= required) return 1
  if (yearsExperience >= required - 1) return entry ? 0.7 : 0.5
  if (yearsExperience >= required - 2) return 0.3
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
    location: 0.15,
    salary: 0.10,
    experience: 0.25,
    roleMatch: 0.20,
  }

  const skillsRaw = skillsMatch(profile.skills, `${job.role} ${job.jobDescription} ${job.techStack ?? ''}`)
  const locationRaw = locationScore(job.location, profile.targetLocations, profile.preferRemote, job.remote, job.hybrid)
  const salaryRaw = salaryScore(job.salaryMin, job.salaryMax, profile.targetSalaryMin, profile.targetSalaryMax)
  const experienceRaw = experienceScore(job.jobDescription, profile.yearsExperience, job.role)
  const roleMatchRaw = roleMatch(job.role, profile.targetRoles)

  const rawScore =
    skillsRaw * weights.skills +
    locationRaw * weights.location +
    salaryRaw * weights.salary +
    experienceRaw * weights.experience +
    roleMatchRaw * weights.roleMatch

  // A job you can't apply to from where you live is a poor fit however well the rest matches.
  const fitScore = Math.round(rawScore * 100 * (locationRaw < 0.1 ? 0.7 : 1))

  const reasons: string[] = []
  if (skillsRaw > 0.6) reasons.push('strong skills match')
  if (locationRaw === 1) reasons.push(job.remote ? 'remote (preferred)' : 'location match')
  const caveats: string[] = []
  if (locationRaw < 0.1) caveats.push('remote, but may be limited to another country')
  if (salaryRaw >= 0.7) reasons.push('salary in range')
  if (experienceRaw >= 0.7) reasons.push('experience level fits')
  else if (experienceRaw <= 0.5) caveats.push(`asks for ${requiredYears(job.jobDescription) ?? 'more'}+ years of experience`)
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
