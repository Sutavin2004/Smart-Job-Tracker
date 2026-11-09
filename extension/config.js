// Shared by the popup and the settings page.
const DEFAULT_SITE = 'https://smart-job-tracker-peach.vercel.app'

async function getSite() {
  const { site } = await chrome.storage.sync.get('site')
  return (site || DEFAULT_SITE).replace(/\/$/, '')
}
