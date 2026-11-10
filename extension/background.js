/* global getSite */
importScripts('config.js')

// Content scripts can't send the JobTrack session cookie themselves, so they
// hand the job to this worker, which calls the API on their behalf.
chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg?.type !== 'track-application') return false
  ;(async () => {
    try {
      const site = await getSite()
      const res = await fetch(`${site}/api/jobs/track`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg.job),
      })
      const data = await res.json().catch(() => ({}))
      reply({ ok: res.ok, status: res.status, data, site })
    } catch (e) {
      reply({ ok: false, status: 0, error: String(e) })
    }
  })()
  return true // keep the channel open for the async reply
})
