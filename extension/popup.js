/* global getSite */
const $ = id => document.getElementById(id)
const show = id => {
  for (const s of ['loading', 'signed-out', 'unsupported', 'form', 'done']) $(s).hidden = s !== id
}

let site = ''
let tabUrl = ''
let imported = {}

// Runs inside the job page: hands back its HTML so login-only sites work too.
function grabPage() {
  return { html: document.documentElement.outerHTML.slice(0, 2_500_000), title: document.title }
}

async function api(path, body) {
  const res = await fetch(`${site}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, ok: res.ok, data }
}

function fill(job, title) {
  $('company').value = job.company || ''
  // Fall back to the tab title so the form is never blank.
  $('role').value = job.role || (job.company ? '' : (title || '').split(/[|\-–]/)[0].trim())
  $('location').value = job.location || ''
}

async function start() {
  site = await getSite()
  $('signin').href = `${site}/login`
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  tabUrl = tab?.url || ''
  if (!/^https?:\/\//.test(tabUrl) || tabUrl.startsWith(site)) return show('unsupported')

  let page = { html: '', title: tab.title || '' }
  try {
    const [res] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: grabPage })
    if (res?.result) page = res.result
  } catch { /* some pages (Chrome Web Store, PDFs) block scripts; the server can still fetch the link */ }

  let r
  try {
    r = await api('/api/jobs/import-url', { url: tabUrl, html: page.html })
  } catch {
    show('form')
    fill({}, page.title)
    $('found').textContent = `Could not reach ${new URL(site).host}. Check your connection.`
    return
  }
  if (r.status === 401) return show('signed-out')

  show('form')
  if (r.ok) {
    imported = r.data.job || {}
    fill(imported, page.title)
    $('found').textContent = r.data.usedAi ? 'Details read by AI. Check them before saving.' : 'Details found on the page.'
  } else {
    fill({}, page.title)
    $('found').textContent = r.data.error || 'Could not read the details. Fill them in below.'
  }
  ;($('company').value ? $('role') : $('company')).focus()
}

$('form').addEventListener('submit', async e => {
  e.preventDefault()
  $('error').hidden = true
  $('save').disabled = true
  $('save').textContent = 'Saving…'
  const job = {
    ...imported,
    company: $('company').value.trim(),
    role: $('role').value.trim(),
    location: $('location').value.trim() || null,
    status: $('status').value,
    jobUrl: imported.jobUrl || tabUrl,
    salaryRaw: imported.salaryRaw || null,
    source: 'Chrome extension',
  }
  try {
    const r = await api('/api/jobs', job)
    if (r.status === 401) return show('signed-out')
    if (!r.ok) throw new Error(r.data.error || 'Could not save the job.')
    $('done-text').textContent = `Saved ${job.role} at ${job.company} to your board.`
    $('open').href = `${site}/jobs?id=${r.data.id}`
    show('done')
  } catch (err) {
    $('error').textContent = err.message
    $('error').hidden = false
    $('save').disabled = false
    $('save').textContent = 'Save to board'
  }
})

$('settings-link').addEventListener('click', e => { e.preventDefault(); chrome.runtime.openOptionsPage() })

start()
