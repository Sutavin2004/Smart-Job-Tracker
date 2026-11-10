/* global __jobtrack */
// LinkedIn Easy Apply shows "Your application was sent to <Company>!" when it's submitted.
(() => {
  const jt = window.__jobtrack

  function currentJobUrl() {
    const id = new URL(window.location.href).searchParams.get('currentJobId') || window.location.pathname.match(/\/jobs\/view\/(\d+)/)?.[1]
    return id ? `https://www.linkedin.com/jobs/view/${id}/` : null
  }

  jt.watch(() => {
    const heading = [...document.querySelectorAll('[role="dialog"] h2, [role="dialog"] h3, .artdeco-modal h2, .artdeco-modal h3')]
      .map(h => h.textContent.replace(/\s+/g, ' ').trim())
      .find(t => /^Your application was sent to /i.test(t))
    if (!heading) return
    const company = heading.replace(/^Your application was sent to /i, '').replace(/[!.]+$/, '').trim()
    // The job card behind the dialog still shows the title.
    const role = jt.text(['.job-details-jobs-unified-top-card__job-title h1', '.job-details-jobs-unified-top-card__job-title', '.jobs-unified-top-card__job-title', 'h1.t-24'])
      || (document.title.split('|')[0] || '').trim() || null
    const loc = jt.text(['.job-details-jobs-unified-top-card__primary-description-container .tvm__text', '.job-details-jobs-unified-top-card__bullet', '.jobs-unified-top-card__bullet'])
    jt.track({ source: 'LinkedIn', company, role, location: loc, jobUrl: currentJobUrl() })
  })
})()
