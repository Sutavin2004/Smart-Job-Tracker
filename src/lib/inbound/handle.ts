import { randomBytes } from 'node:crypto'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { scopedDb } from '@/lib/scoped-db'
import { AI_MODELS } from '@/lib/ai-models'
import { consumeQuota } from '@/lib/quota'
import { parseInbound, looksLikeApplication, type InboundMessage, type Parsed } from './parse'

export const INBOUND_DOMAIN = (process.env.INBOUND_DOMAIN ?? '').trim().toLowerCase()
export const INBOUND_ENABLED = Boolean(INBOUND_DOMAIN && process.env.RESEND_WEBHOOK_SECRET && process.env.RESEND_API_KEY)

/** The user's private forwarding address, created on first use. */
export async function inboundAddress(userId: string) {
  if (!INBOUND_DOMAIN) return null
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { inboundToken: true } })
  let token = user?.inboundToken
  if (!token) {
    // Lowercase letters and digits only: some mail systems change the case of addresses.
    token = 'jt' + randomBytes(10).toString('hex')
    await prisma.user.update({ where: { id: userId }, data: { inboundToken: token } })
  }
  return `${token}@${INBOUND_DOMAIN}`
}

export async function userForAddresses(addresses: string[]) {
  for (const a of addresses) {
    const m = a.toLowerCase().match(/(jt[a-f0-9]{20})@([^\s>]+)/)
    if (m && m[2] === INBOUND_DOMAIN) {
      const user = await prisma.user.findUnique({ where: { inboundToken: m[1] }, select: { id: true } })
      if (user) return user.id
    }
  }
  return null
}

async function aiRead(userId: string, msg: InboundMessage): Promise<Parsed> {
  if (!process.env.ANTHROPIC_API_KEY) return { kind: 'unknown' }
  await consumeQuota(userId, 'ai')
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const res = await anthropic.messages.create({
    model: AI_MODELS.fast,
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Is this email a confirmation that the recipient applied to a job? Answer with JSON only:
{"isApplication": boolean, "company": string|null, "role": string|null, "location": string|null}
Use only what the email says.

From: ${msg.from}
Subject: ${msg.subject}

${(msg.text ?? '').slice(0, 6000)}`,
    }],
  })
  const out = res.content.filter(b => b.type === 'text').map(b => (b as { text: string }).text).join('')
  try {
    const o = JSON.parse(out.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
    if (o.isApplication && typeof o.company === 'string' && o.company.trim()) {
      return { kind: 'application', source: 'Email', company: o.company.trim(), role: o.role || null, location: o.location || null, jobUrl: null }
    }
  } catch { /* fall through */ }
  return { kind: 'unknown' }
}

const norm = (s: string | null | undefined) => (s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export interface AppliedJob { source: string; company: string; role: string | null; location: string | null; jobUrl: string | null }

/** Mark a matching saved job as applied, or add a new one. Shared by email tracking and the Chrome extension. */
export async function recordApplication(userId: string, parsed: AppliedJob): Promise<{ result: 'moved' | 'already-tracked' | 'created'; jobId: string; label: string; status?: string }> {
  const db = scopedDb(userId)
  const candidates = await db.job.findMany({
    where: { archived: false, company: { equals: parsed.company, mode: 'insensitive' } },
    orderBy: { updatedAt: 'desc' },
  })
  const match = candidates.find(j => !parsed.role || norm(j.role) === norm(parsed.role) || norm(j.role).includes(norm(parsed.role)) || norm(parsed.role).includes(norm(j.role)))
    ?? (candidates.length === 1 && !parsed.role ? candidates[0] : undefined)
  const label = `${parsed.company}${parsed.role ? `, ${parsed.role}` : ''}`
  const now = new Date()

  if (match) {
    if (match.status !== 'saved') return { result: 'already-tracked', jobId: match.id, label, status: match.status }
    await db.job.update({
      where: { id: match.id },
      data: { status: 'applied', dateApplied: now, jobUrl: match.jobUrl ?? parsed.jobUrl, source: match.source ?? parsed.source },
    })
    await db.activity.create({ data: { jobId: match.id, type: 'status_change', message: `Marked applied from ${parsed.source}` } })
    return { result: 'moved', jobId: match.id, label }
  }

  const job = await db.job.create({
    data: {
      userId,
      company: parsed.company.slice(0, 200),
      role: (parsed.role ?? 'Role not stated').slice(0, 200),
      location: parsed.location,
      remote: /remote/i.test(parsed.location ?? ''),
      jobUrl: parsed.jobUrl,
      status: 'applied',
      dateApplied: now,
      source: parsed.source,
    },
  })
  await db.activity.create({ data: { jobId: job.id, type: 'created', message: `Added from ${parsed.source}` } })
  return { result: 'created', jobId: job.id, label }
}

/** Process one forwarded email for a user and log what happened. */
export async function handleInbound(userId: string, msg: InboundMessage, providerId?: string) {
  if (providerId && await prisma.inboundEmail.findUnique({ where: { providerId } })) return 'duplicate'

  let parsed = parseInbound(msg)
  if (parsed.kind === 'unknown' && looksLikeApplication(msg)) parsed = await aiRead(userId, msg).catch(() => ({ kind: 'unknown' as const }))

  const log = (outcome: string, extra: { jobId?: string; link?: string | null } = {}) =>
    prisma.inboundEmail.create({ data: { userId, fromAddr: msg.from.slice(0, 200), subject: msg.subject.slice(0, 300), outcome, providerId, ...extra } })

  if (parsed.kind === 'gmail-confirmation') {
    await log(parsed.code ? `Gmail forwarding confirmation code: ${parsed.code}` : 'Gmail forwarding confirmation', { link: parsed.link })
    return 'gmail-confirmation'
  }
  if (parsed.kind !== 'application') {
    await log('Not an application confirmation, so nothing changed')
    return 'ignored'
  }

  const r = await recordApplication(userId, parsed)
  if (r.result === 'already-tracked') await log(`${r.label} was already on your board as ${r.status}`, { jobId: r.jobId })
  else if (r.result === 'moved') await log(`Moved ${r.label} to Applied`, { jobId: r.jobId })
  else await log(`Added ${r.label} as Applied`, { jobId: r.jobId })
  return r.result
}

