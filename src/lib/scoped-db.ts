import { prisma } from './prisma'

/**
 * A Prisma client that can only see and change one user's rows.
 *
 * Every query on an owned model gets `userId` added to its filter, and every
 * query on a job's child records is limited to jobs that user owns. API routes
 * use this (via withAuth) instead of the raw client, so a route can't leak or
 * modify another user's data even if it forgets a check.
 */
const OWNED = new Set(['Job', 'UserProfile', 'AgentSession', 'EmailTemplate', 'InboundEmail'])
const CHILD_OF_JOB = new Set(['Interview', 'Activity', 'Document', 'Contact', 'Task', 'SalaryNegotiation', 'ApplicationQA'])

export class NotFoundError extends Error {
  constructor(message = 'Not found') { super(message) }
}

type Args = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

function addScope(where: Args | undefined, scope: Args): Args {
  if (!where) return { ...scope }
  // Avoid clobbering an existing filter on the same key.
  const clash = Object.keys(scope).some(k => k in where)
  return clash ? { AND: [where, scope] } : { ...where, ...scope }
}

export function scopedDb(userId: string) {
  async function assertOwnsJob(data: Args | undefined) {
    const jobId = data?.jobId ?? data?.job?.connect?.id
    if (!jobId) throw new NotFoundError('Job not found')
    const owned = await prisma.job.findFirst({ where: { id: jobId, userId }, select: { id: true } })
    if (!owned) throw new NotFoundError('Job not found')
  }

  return prisma.$extends({
    name: 'user-scope',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const owned = OWNED.has(model)
          const child = CHILD_OF_JOB.has(model)
          if (!owned && !child) {
            throw new Error(`${model} is not accessible through the user-scoped client`)
          }
          const a = { ...(args as Args) }
          const scope = owned ? { userId } : { job: { userId } }

          switch (operation) {
            case 'create':
              if (owned) a.data = { ...a.data, userId }
              else await assertOwnsJob(a.data)
              break
            case 'createMany':
            case 'createManyAndReturn': {
              const rows = Array.isArray(a.data) ? a.data : [a.data]
              if (owned) a.data = rows.map((r: Args) => ({ ...r, userId }))
              else for (const r of rows) await assertOwnsJob(r)
              break
            }
            case 'upsert':
              a.where = { ...a.where, ...scope }
              if (owned) a.create = { ...a.create, userId }
              else await assertOwnsJob(a.create)
              break
            case 'findUnique':
            case 'findUniqueOrThrow':
            case 'update':
            case 'delete':
              // Unique lookups accept extra filters (Prisma 5): the row must also belong to the user.
              a.where = { ...a.where, ...scope }
              break
            default:
              a.where = addScope(a.where, scope)
          }
          try {
            return await query(a)
          } catch (err) {
            if ((err as { code?: string })?.code === 'P2025') throw new NotFoundError()
            throw err
          }
        },
      },
    },
  })
}

export type ScopedDb = ReturnType<typeof scopedDb>
