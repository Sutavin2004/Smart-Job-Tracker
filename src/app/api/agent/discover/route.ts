import { runDiscovery } from '@/lib/agent/discover'
import { prisma } from '@/lib/prisma'
import { IS_DEMO } from '@/lib/demo'

// Board fetches + web search + parsing can take a while; don't let Vercel cut the stream off.
export const maxDuration = 300

/** Manual run from the Agent page: streams progress as server-sent events. */
export async function POST() {
  // Public demo: one agent run every 10 minutes across all visitors, to be gentle on the free job boards.
  if (IS_DEMO) {
    const recent = await prisma.agentSession.findFirst({ where: { startedAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } } })
    if (recent) return Response.json({ error: 'The demo agent ran in the last few minutes. Check the results below, or try again shortly.' }, { status: 429 })
  }

  const encoder = new TextEncoder()
  let started = false
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)) } catch { /* client went away */ }
      }
      try {
        const res = await runDiscovery({ trigger: 'manual', emit: e => { started = true; send(e) } })
        if (res.error && !started) send({ type: 'error', message: res.error })
      } finally {
        controller.close()
      }
    },
  })
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  })
}
