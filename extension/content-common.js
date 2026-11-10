/* Shared by the LinkedIn and Indeed content scripts. */
window.__jobtrack = window.__jobtrack || {
  sent: new Set(),

  text(sel) {
    for (const s of [].concat(sel)) {
      const el = document.querySelector(s)
      const t = el && el.textContent && el.textContent.replace(/\s+/g, ' ').trim()
      if (t) return t
    }
    return null
  },

  toast(message, link) {
    const el = document.createElement('div')
    el.setAttribute('role', 'status')
    el.style.cssText = 'position:fixed;z-index:2147483647;right:20px;bottom:20px;max-width:320px;background:#18181B;color:#fff;font:14px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;padding:12px 14px;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.25)'
    el.textContent = message + ' '
    if (link) {
      const a = document.createElement('a')
      a.href = link; a.target = '_blank'; a.rel = 'noreferrer'; a.textContent = 'Open'
      a.style.cssText = 'color:#4FB394;font-weight:600'
      el.appendChild(a)
    }
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 7000)
  },

  track(job) {
    const key = `${job.company}|${job.role}`.toLowerCase()
    if (!job.company || this.sent.has(key)) return
    this.sent.add(key)
    chrome.runtime.sendMessage({ type: 'track-application', job }, res => {
      if (!res) return
      if (res.status === 401) return this.toast('JobTrack: sign in to track this application.', `${res.site}/login`)
      if (!res.ok) return this.toast('JobTrack could not save this application.')
      const what = res.data.result === 'already-tracked' ? 'is already on your board' : 'added to your board as Applied'
      this.toast(`JobTrack: ${job.company} ${what}.`, `${res.site}/jobs?id=${res.data.jobId}`)
    })
  },

  watch(check) {
    const run = () => { try { check() } catch { /* page layout changed; ignore */ } }
    new MutationObserver(run).observe(document.body, { childList: true, subtree: true, characterData: true })
    run()
  },
}
