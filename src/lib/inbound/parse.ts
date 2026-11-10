/**
 * Recognise application-confirmation emails (LinkedIn, Indeed, common
 * applicant-tracking systems) and Gmail's forwarding-confirmation email.
 * Pure functions: no database or network.
 */

export interface InboundMessage { from: string; subject: string; text: string; html?: string | null }

export type Parsed =
  | { kind: 'application'; source: string; company: string; role: string | null; location: string | null; jobUrl: string | null }
  | { kind: 'gmail-confirmation'; code: string | null; link: string | null }
  | { kind: 'unknown' }

const clean = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').replace(/^[\s"'“”]+|[\s"'“”.!,]+$/g, '').trim()

export function htmlToPlain(html: string) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h\d|table)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&middot;/g, '·')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

/** The real sender, also when the user forwarded the email by hand ("---------- Forwarded message ---------"). */
function originalSender(msg: InboundMessage, body: string) {
  const fwd = body.match(/(?:Forwarded message|Original Message)[\s\S]{0,200}?From:\s*(?:"?[^<\n]*"?\s*)?<?([^\s<>]+@[^\s<>]+)>?/i)
  return (fwd?.[1] ?? msg.from).toLowerCase()
}

const firstUrl = (body: string, host: RegExp) =>
  body.match(new RegExp(`https?://[^\\s"'<>)]*${host.source}[^\\s"'<>)]*`, 'i'))?.[0] ?? null

export function parseInbound(msg: InboundMessage): Parsed {
  const body = msg.text?.trim() ? msg.text : htmlToPlain(msg.html ?? '')
  const subject = msg.subject.replace(/^\s*((fwd?|fw|tr):\s*)+/i, '').trim()
  const from = originalSender(msg, body)

  // Gmail asks the forwarding address to confirm before a filter can forward to it.
  if (/forwarding-noreply@google\.com/.test(from) || /Gmail Forwarding Confirmation/i.test(subject)) {
    const code = subject.match(/\(#(\d{6,12})\)/)?.[1] ?? body.match(/Confirmation code:\s*(\d{6,12})/i)?.[1] ?? null
    const link = body.match(/https:\/\/mail(?:-settings)?\.google\.com\/mail\/[^\s<>"]+/)?.[0] ?? null
    return { kind: 'gmail-confirmation', code, link }
  }

  // LinkedIn: "Jordan, your application was sent to Shopify"
  const li = subject.match(/your application was sent to (.+)$/i) ?? body.match(/Your application was sent to ([^\n]+)/i)
  if (li && (/linkedin\.com/.test(from) || /linkedin/i.test(body))) {
    const company = clean(li[1])
    const lines = body.split('\n').map(l => l.trim()).filter(Boolean)
    // The posting card lists the role, then "Company · Location".
    const cardIdx = lines.findIndex(l => l.startsWith(company) && /[·•]/.test(l))
    const role = cardIdx > 0 ? clean(lines[cardIdx - 1]) : null
    const location = cardIdx >= 0 ? clean(lines[cardIdx].split(/[·•]/).slice(1).join(' ')) || null : null
    const jobUrl = firstUrl(body, /linkedin\.com\/(?:comm\/)?jobs\/view\/\d+/)?.replace(/\?.*$/, '') ?? null
    return { kind: 'application', source: 'LinkedIn', company, role: role && role !== company ? role : null, location, jobUrl }
  }

  // Indeed: "Indeed Application: Frontend Developer"
  const indeed = subject.match(/^Indeed Application:\s*(.+)$/i)
  if (indeed || (/indeed\.com/.test(from) && /application|applied/i.test(subject))) {
    const role = clean(indeed?.[1] ?? subject.replace(/.*?(?:applied|application)( to| for)?:?\s*/i, '')) || null
    const company = clean(
      body.match(/(?:items were sent to|application (?:has been |was )?(?:sent|submitted) to)\s+([^\n.]+)/i)?.[1]
      ?? body.split('\n').map(l => l.trim()).find(l => role && body.includes(role) && /\s[-–]\s/.test(l) && !/indeed/i.test(l))?.split(/\s[-–]\s/)[0]
    )
    if (company) {
      const loc = body.match(new RegExp(`${company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s[-–]\\s([^\\n]+)`))?.[1]
      return { kind: 'application', source: 'Indeed', company, role, location: clean(loc) || null, jobUrl: firstUrl(body, /indeed\.com\/viewjob\?jk=\w+/)?.replace(/&.*$/, '') ?? null }
    }
  }

  // Greenhouse, Lever, Workday, Ashby and most company career sites.
  const generic =
    (subject + '\n' + body).match(/thank you for (?:applying|your (?:interest|application))(?: to| for)?(?: the)? ([^\n]{2,80}?) (?:position|role|job)? ?(?:at|with) ([^\n.!,]{2,60})/i)
  if (generic) {
    return { kind: 'application', source: 'Company site', company: clean(generic[2]), role: clean(generic[1]) || null, location: null, jobUrl: null }
  }
  const atCompany = subject.match(/(?:application|applying)\s+(?:to|at|for)\s+([^\n:–-]{2,60})/i)
  if (atCompany && /received|thank|confirm|submitted/i.test(subject + body.slice(0, 500))) {
    return { kind: 'application', source: 'Company site', company: clean(atCompany[1]), role: null, location: null, jobUrl: null }
  }
  return { kind: 'unknown' }
}

/** Does this look like an application confirmation worth asking the AI about? */
export const looksLikeApplication = (msg: InboundMessage) =>
  /appl(y|ied|ication)|thank you for your interest|candidate/i.test(msg.subject + ' ' + (msg.text ?? '').slice(0, 2000))

/** Verify a Svix-signed webhook (Resend uses Svix). */
export async function verifySvix(secret: string, headers: { id: string | null; timestamp: string | null; signature: string | null }, body: string, now = Date.now()) {
  if (!headers.id || !headers.timestamp || !headers.signature) return false
  const ts = Number(headers.timestamp)
  if (!Number.isFinite(ts) || Math.abs(now / 1000 - ts) > 5 * 60) return false
  const { createHmac, timingSafeEqual } = await import('node:crypto')
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const expected = createHmac('sha256', key).update(`${headers.id}.${headers.timestamp}.${body}`).digest()
  return headers.signature.split(' ').some(part => {
    const [version, sig] = part.split(',')
    if (version !== 'v1' || !sig) return false
    const given = Buffer.from(sig, 'base64')
    return given.length === expected.length && timingSafeEqual(given, expected)
  })
}
