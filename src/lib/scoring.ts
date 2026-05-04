import type { RawJob } from './job-boards'

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

function locationScore(jobLocation: string, targetLocations: string, preferRemote: boolean, isRemote: boolean, isHybrid: boolean): number {
  if (isRemote && preferRemote) return 1
  if (isRemote) return 0.7

  const targets = targetLocations.toLowerCase().split(',').map(l => l.trim()).filter(Boolean)
  if (targets.length === 0) return 0.8

  const jobLoc = jobLocation.toLowerCase()
  for (const target of targets) {
    if (jobLoc.includes(target) || target.includes(jobLoc.split(',')[0]?.trim() ?? '')) return 1
  }
  if (isHybrid && preferRemote) return 0.6
  return 0.3
}

function salaryScore(jobMin: number | null, jobMax: number | null, profileMin: number, profileMax: number): number {
  if (!jobMin && !jobMax) return 0.5
  const mid = ((jobMin ?? jobMax ?? 0) + (jobMax ?? jobMin ?? 0)) / 2
  if (mid >= profileMin && mid <= profileMax) return 1
  if (mid >= profileMin * 0.85 && mid <= profileMax * 1.15) return 0.7
  if (mid >= profileMin * 0.7) return 0.4
  return 0.1
}

function experienceScore(jobDescription: string, yearsExperience: number): number {
  const desc = jobDescription.toLowerCase()
  const match = desc.match(/(\d+)\+?\s*years?\s*(of\s+)?(experience|exp)/i)
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
  return !excludes.some(kw => text.includes(kw))
}

export function scoreJob(job: RawJob, profile: UserProfile): ScoredJob {
  if (!excludeCheck(job.jobDescription, job.role, profile.excludeKeywords)) {
    return { ...job, fitScore: 0, fitReason: 'Contains excluded keywords', excitement: 1 }
  }

  const weights = {
    skills: 0.30,
    location: 0.20,
    salary: 0.15,
    experience: 0.15,
    roleMatch: 0.20,
  }

  const skillsRaw = keywordOverlap(profile.skills, job.jobDescription)
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
  if (salaryRaw >= 0.7) reasons.push('salary in range')
  if (experienceRaw >= 0.7) reasons.push('experience level fits')
  if (roleMatchRaw > 0.5) reasons.push('role title aligns')

  const fitReason = reasons.length > 0
    ? `Good fit: ${reasons.join(', ')}.`
    : `Partial match — check ${fitScore < 40 ? 'skills and location' : 'salary and experience'}.`

  const excitement = fitScore >= 80 ? 5 : fitScore >= 65 ? 4 : fitScore >= 50 ? 3 : fitScore >= 35 ? 2 : 1

  return { ...job, fitScore, fitReason, excitement }
}

export function scoreAndRankJobs(jobs: RawJob[], profile: UserProfile): ScoredJob[] {
  return jobs
    .map(j => scoreJob(j, profile))
    .filter(j => j.fitScore > 0)
    .sort((a, b) => b.fitScore - a.fitScore)
}
