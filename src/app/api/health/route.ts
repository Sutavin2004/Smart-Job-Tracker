import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Liveness check, plus which optional integrations are configured (yes/no only, never values). */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    features: {
      ai: Boolean(process.env.ANTHROPIC_API_KEY),
      email: Boolean(process.env.RESEND_API_KEY),
      inbound: Boolean(process.env.INBOUND_DOMAIN && process.env.RESEND_WEBHOOK_SECRET),
      google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      adzuna: Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY),
      cronSecret: Boolean(process.env.CRON_SECRET),
    },
  })
}
