import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'
import { resumeDocx, letterDocx, fileSafe } from '@/lib/apply/docx'

export const runtime = 'nodejs'

/** Download the job's tailored résumé or cover letter as a Word file. */
export const GET = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }, { db }: Auth) => {
  const { id } = await params
  const kind = req.nextUrl.searchParams.get('doc') === 'cover_letter' ? 'cover_letter' : 'resume'
  const [job, profile] = await Promise.all([
    db.job.findUnique({ where: { id }, select: { company: true } }),
    db.userProfile.findFirst({ select: { name: true } }),
  ])
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const doc = await db.document.findFirst({ where: { jobId: id, type: kind, isActive: true }, orderBy: { createdAt: 'desc' } })
  if (!doc) return NextResponse.json({ error: 'Prepare the application first.' }, { status: 404 })
  const buf = kind === 'resume' ? await resumeDocx(doc.content) : await letterDocx(doc.content)
  const who = fileSafe(profile?.name || 'Resume')
  const name = `${who}-${kind === 'resume' ? 'Resume' : 'Cover-Letter'}-${fileSafe(job.company)}.docx`
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'private, no-store',
    },
  })
})
