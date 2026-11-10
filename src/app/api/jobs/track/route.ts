import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'
import { recordApplication } from '@/lib/inbound/handle'

const str = (v: unknown, max = 200) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null)

/** Called by the Chrome extension when it sees an application being submitted. */
export const POST = withAuth(async (req: NextRequest, _ctx: unknown, { user }: Auth) => {
  const body = await req.json().catch(() => ({}))
  const company = str(body.company)
  if (!company) return NextResponse.json({ error: 'Company is required' }, { status: 400 })
  const jobUrl = str(body.jobUrl, 1000)
  const r = await recordApplication(user.id, {
    company,
    role: str(body.role),
    location: str(body.location),
    jobUrl: jobUrl && /^https:\/\//.test(jobUrl) ? jobUrl : null,
    source: ['LinkedIn', 'Indeed'].includes(body.source) ? body.source : 'Chrome extension',
  })
  return NextResponse.json(r, { status: r.result === 'created' ? 201 : 200 })
})
