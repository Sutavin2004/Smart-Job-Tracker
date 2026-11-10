/* global __jobtrack */
// Indeed Apply runs on smartapply.indeed.com. The job title and company are
// shown in the header while you fill in the form; remember them, then save
// when the "application has been submitted" screen appears.
(() => {
  const jt = window.__jobtrack
  const KEY = 'jobtrack-indeed-job'

  function remember() {
    const role = jt.text(['[data-testid="jobTitle"]', '.ia-JobHeader-title', 'h1[class*="JobTitle"]', '[class*="jobTitle"]'])
    const company = jt.text(['[data-testid="companyName"]', '.ia-JobHeader-information span', '[class*="companyName"]'])
    const loc = jt.text(['[data-testid="jobLocation"]', '[class*="companyLocation"]'])
    const jk = new URL(window.location.href).searchParams.get('jk')
    if (role || company) {
      const prev = JSON.parse(sessionStorage.getItem(KEY) || '{}')
      sessionStorage.setItem(KEY, JSON.stringify({
        role: role || prev.role, company: company || prev.company, location: loc || prev.location,
        jobUrl: jk ? `https://ca.indeed.com/viewjob?jk=${jk}` : prev.jobUrl,
      }))
    }
  }

  jt.watch(() => {
    remember()
    const body = document.body.innerText || ''
    if (!/your application has been submitted|application submitted|you(?:'|’)ve applied/i.test(body)) return
    const job = JSON.parse(sessionStorage.getItem(KEY) || '{}')
    if (job.company) jt.track({ source: 'Indeed', ...job })
  })
})()
