import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'

/** The latest prepared application for a job, if any. */
export const GET = withAuth(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }, { db }: Auth) => {
  const { id } = await params
  const job = await db.job.findUnique({
    where: { id },
    select: {
      id: true, company: true, role: true, jobUrl: true, location: true, aiScore: true, aiSuggestion: true, status: true, applicationPreparedAt: true,
      documents: { where: { isActive: true, type: { in: ['resume', 'cover_letter', 'kit_notes'] } }, orderBy: { createdAt: 'desc' }, select: { type: true, content: true, createdAt: true } },
      applicationQAs: { orderBy: { createdAt: 'asc' }, select: { id: true, question: true, answer: true } },
    },
  })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { documents, applicationQAs, ...rest } = job
  let extra = { notes: [] as string[], matchedKeywords: [] as string[], missingKeywords: [] as string[] }
  try { extra = { ...extra, ...JSON.parse(documents.find(d => d.type === 'kit_notes')?.content ?? '{}') } } catch { /* older kits have no notes */ }
  return NextResponse.json({
    ...extra,
    ...rest,
    resume: documents.find(d => d.type === 'resume')?.content ?? null,
    coverLetter: documents.find(d => d.type === 'cover_letter')?.content ?? null,
    answers: applicationQAs,
  })
})
