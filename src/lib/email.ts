/**
 * Sending email through Resend's HTTP API. Without RESEND_API_KEY every send
 * is skipped (and logged), so the app still works with email features off.
 */

export const EMAIL_ENABLED = Boolean(process.env.RESEND_API_KEY)
// Until you verify a domain in Resend, onboarding@resend.dev can only send to your own Resend account email.
const FROM = process.env.EMAIL_FROM || 'JobTrack <onboarding@resend.dev>'

export function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '')
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  return 'http://localhost:3000'
}

export interface Email { to: string; subject: string; text: string; html: string }

export async function sendEmail(email: Email): Promise<boolean> {
  if (!EMAIL_ENABLED) {
    console.info(`[email skipped: RESEND_API_KEY not set] ${email.subject} -> ${email.to}`)
    return false
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [email.to], subject: email.subject, text: email.text, html: email.html }),
  })
  if (!res.ok) {
    console.error('Resend error', res.status, await res.text().catch(() => ''))
    return false
  }
  return true
}

export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** A plain, readable email layout: one column, system fonts, one button. */
export function layout({ heading, paragraphs, extraHtml = '', button, footer }: {
  heading: string; paragraphs: string[]; extraHtml?: string; button?: { label: string; url: string }; footer?: string
}) {
  const p = (t: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#3A3B3F">${t}</p>`
  return `<!doctype html><html><body style="margin:0;background:#F7F7F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
<p style="margin:0 0 24px;font-weight:600;font-size:15px;color:#18181B">JobTrack</p>
<div style="background:#fff;border:1px solid #E4E4E7;border-radius:10px;padding:28px">
<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#18181B">${heading}</h1>
${paragraphs.map(p).join('')}
${extraHtml}
${button ? `<p style="margin:22px 0 6px"><a href="${button.url}" style="display:inline-block;background:#1D6B57;color:#fff;text-decoration:none;font-size:15px;font-weight:500;padding:10px 18px;border-radius:6px">${button.label}</a></p>` : ''}
</div>
${footer ? `<p style="margin:18px 4px 0;font-size:12px;line-height:1.5;color:#63636B">${footer}</p>` : ''}
</div></body></html>`
}
