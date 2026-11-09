import { runDiscovery } from '@/lib/agent/discover'

// Board fetches + web search + parsing can take a while; don't let Vercel cut the stream off.
export const maxDuration = 300

/** Manual run from the Agent page: streams progress as server-sent events. */
export async function POST() {
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
