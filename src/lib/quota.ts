import { prisma } from './prisma'

/** Daily per-user limits, so a public sign-up can't run up the owner's AI bill. */
export const LIMITS = {
  ai: Number(process.env.DAILY_AI_LIMIT ?? 40),       // Claude-powered actions
  agent: Number(process.env.DAILY_AGENT_LIMIT ?? 6),  // Job Agent runs (manual + scheduled)
} as const

export type QuotaKind = keyof typeof LIMITS

export class QuotaError extends Error {
  constructor(public kind: QuotaKind) {
    super(kind === 'agent'
      ? `You've reached today's limit of ${LIMITS.agent} agent runs. It resets at midnight UTC.`
      : `You've reached today's limit of ${LIMITS.ai} AI actions. It resets at midnight UTC.`)
  }
}

/** Count one use; throws QuotaError if that goes over today's limit. */
export async function consumeQuota(userId: string, kind: QuotaKind) {
  const day = new Date().toISOString().slice(0, 10)
  const row = await prisma.usageCounter.upsert({
    where: { userId_day_kind: { userId, day, kind } },
    create: { userId, day, kind, count: 1 },
    update: { count: { increment: 1 } },
  })
  if (row.count > LIMITS[kind]) throw new QuotaError(kind)
}

export async function usageToday(userId: string) {
  const day = new Date().toISOString().slice(0, 10)
  const rows = await prisma.usageCounter.findMany({ where: { userId, day } })
  const used = (k: QuotaKind) => rows.find(r => r.kind === k)?.count ?? 0
  return { ai: { used: used('ai'), limit: LIMITS.ai }, agent: { used: used('agent'), limit: LIMITS.agent } }
}
