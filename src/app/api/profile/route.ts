import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const profile = await prisma.userProfile.findFirst()
  if (!profile) {
    const newProfile = await prisma.userProfile.create({ data: {} })
    return NextResponse.json(newProfile)
  }
  return NextResponse.json(profile)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const profile = await prisma.userProfile.findFirst()

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
  }

  if (profile) {
    const updated = await prisma.userProfile.update({ where: { id: profile.id }, data })
    return NextResponse.json(updated)
  }

  const created = await prisma.userProfile.create({ data })
  return NextResponse.json(created)
}
