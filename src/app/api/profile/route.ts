import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'

export const GET = withAuth(async (_req: NextRequest, _ctx: unknown, { db, user }: Auth) => {
  const profile = await db.userProfile.findFirst()
  if (!profile) {
    const newProfile = await db.userProfile.create({ data: { userId: user.id, name: user.name, email: user.email } })
    return NextResponse.json(newProfile)
  }
  return NextResponse.json(profile)
})

export const PUT = withAuth(async (req: NextRequest, _ctx: unknown, { db, user }: Auth) => {
  const body = await req.json()
  const profile = await db.userProfile.findFirst()

  const data = {
    name: body.name ?? '',
    email: body.email ?? '',
    phone: body.phone ?? '',
    linkedin: body.linkedin ?? '',
    github: body.github ?? '',
    portfolio: body.portfolio ?? '',
    currentTitle: body.currentTitle ?? '',
    yearsExperience: Number(body.yearsExperience ?? 0),
    targetRoles: body.targetRoles ?? '',
    targetSalaryMin: Number(body.targetSalaryMin ?? 0),
    targetSalaryMax: Number(body.targetSalaryMax ?? 0),
    currency: body.currency ?? 'CAD',
    skills: body.skills ?? '',
    education: body.education ?? '',
    bio: body.bio ?? '',
    masterResume: body.masterResume ?? '',
    jobSearchGoals: body.jobSearchGoals ?? '',
    preferRemote: Boolean(body.preferRemote),
    preferHybrid: Boolean(body.preferHybrid),
    targetLocations: body.targetLocations ?? '',
    excludeKeywords: body.excludeKeywords ?? '',
    weeklyGoal: Number(body.weeklyGoal ?? 5),
    defaultSource: body.defaultSource ?? 'LinkedIn',
    timezone: body.timezone ?? 'America/Toronto',
    autoDiscover: Boolean(body.autoDiscover),
  }

  if (profile) {
    // Partial update: only touch fields the client actually sent, so saving one
    // setting (e.g. the daily-agent toggle) can't blank out the rest of the profile.
    const patch = Object.fromEntries(Object.entries(data).filter(([k]) => k in body))
    const updated = await db.userProfile.update({ where: { id: profile.id }, data: patch })
    return NextResponse.json(updated)
  }

  const created = await db.userProfile.create({ data: { ...data, userId: user.id } })
  return NextResponse.json(created)
})
