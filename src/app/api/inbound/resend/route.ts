import { NextRequest, NextResponse } from 'next/server'
import { verifySvix } from '@/lib/inbound/parse'
import { handleInbound, userForAddresses, INBOUND_ENABLED } from '@/lib/inbound/handle'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Resend calls this for every email sent to the receiving domain. The webhook
 * only carries metadata, so the body is fetched from Resend's API.
 * Public route: authenticated by the webhook signature instead of a session.
 */
export async function POST(req: NextRequest) {
  if (!INBOUND_ENABLED) return NextResponse.json({ error: 'Inbound email is not configured' }, { status: 503 })
  const raw = await req.text()
  const ok = await verifySvix(process.env.RESEND_WEBHOOK_SECRET!, {
    id: req.headers.get('svix-id'),
    timestamp: req.headers.get('svix-timestamp'),
    signature: req.headers.get('svix-signature'),
  }, raw)
  if (!ok) return NextResponse.json({ error: 'Bad signature' }, { status: 401 })

  const event = JSON.parse(raw) as { type?: string; data?: { email_id?: string; to?: string[] } }
  if (event.type !== 'email.received' || !event.data?.email_id) return NextResponse.json({ ignored: true })

  const res = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(event.data.email_id)}`, {
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  })
  if (!res.ok) {
    console.error('resend receiving fetch', res.status, await res.text().catch(() => ''))
    return NextResponse.json({ error: 'Could not load the email' }, { status: 502 }) // Resend retries
  }
  const email = await res.json() as { from: string; to: string[]; received_for?: string[]; subject: string; text: string | null; html: string | null }

  const userId = await userForAddresses([...(email.received_for ?? []), ...(email.to ?? []), ...(event.data.to ?? [])])
  if (!userId) return NextResponse.json({ ignored: 'unknown recipient' })

  const result = await handleInbound(userId, { from: email.from, subject: email.subject ?? '', text: email.text ?? '', html: email.html }, event.data.email_id)
  return NextResponse.json({ result })
}
