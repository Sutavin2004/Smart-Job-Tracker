/* global getSite, DEFAULT_SITE */
const input = document.getElementById('site')
const status = document.getElementById('status')

getSite().then(site => { input.value = site })

document.getElementById('form').addEventListener('submit', async e => {
  e.preventDefault()
  let url
  try { url = new URL(input.value.trim()) } catch { status.textContent = 'Enter a full address starting with https://'; return }
  const site = url.origin
  // The default site is allowed in the manifest; any other one needs your OK.
  if (site !== DEFAULT_SITE) {
    const granted = await chrome.permissions.request({ origins: [`${site}/*`] })
    if (!granted) { status.textContent = 'Permission was not granted, so the address was not changed.'; return }
  }
  await chrome.storage.sync.set({ site })
  status.textContent = `Saved. The extension now uses ${url.host}.`
})
