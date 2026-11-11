import { test, expect, type APIRequestContext } from '@playwright/test'

const unique = () => `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`

async function signUp(request: APIRequestContext, email: string, name = 'Test Person') {
  const res = await request.post('/api/auth/signup', { data: { name, email, password: 'correct-horse-9' } })
  expect(res.status(), await res.text()).toBe(201)
}

test('signed-out visitors are sent to sign in, then back where they were going', async ({ page }) => {
  await page.goto('/analytics')
  await expect(page).toHaveURL(/\/login\?next=%2Fanalytics/)
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()

  const email = unique()
  await signUp(page.request, email)
  await page.context().clearCookies()

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('correct-horse-9')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/analytics')
})

test('API calls without a session get 401', async ({ request }) => {
  expect((await request.get('/api/jobs')).status()).toBe(401)
  expect((await request.get('/api/profile')).status()).toBe(401)
})

test('sign up through the form lands on an empty dashboard', async ({ page }) => {
  await page.goto('/signup')
  await page.getByLabel('Name').fill('Jordan Lee')
  await page.getByLabel('Email').fill(unique())
  await page.getByLabel('Password').fill('a-long-password')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Jordan')
  await expect(page.getByRole('heading', { name: 'Your board is empty' })).toBeVisible()

  // Signing out ends the session.
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL('/login')
  expect((await page.request.get('/api/jobs')).status()).toBe(401)
})

test('wrong password and duplicate email are rejected with clear messages', async ({ page, request }) => {
  const email = unique()
  await signUp(request, email)
  const dup = await request.post('/api/auth/signup', { data: { name: 'x', email, password: 'another-password' } })
  expect(dup.status()).toBe(409)

  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('not-the-password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('alert').filter({ hasText: /\S/ })).toHaveText('Email or password is incorrect.')
})

test("one account cannot see or change another account's jobs", async ({ playwright, baseURL }) => {
  const alice = await playwright.request.newContext({ baseURL })
  const bob = await playwright.request.newContext({ baseURL })
  await signUp(alice, unique(), 'Alice')
  await signUp(bob, unique(), 'Bob')

  const job = await (await alice.post('/api/jobs', { data: { company: 'Alice Only Inc', role: 'Engineer' } })).json()
  expect(job.id).toBeTruthy()

  // Bob's lists never include it.
  const bobJobs = await (await bob.get('/api/jobs')).json()
  expect(bobJobs.map((j: { id: string }) => j.id)).not.toContain(job.id)
  const search = await (await bob.get('/api/jobs?search=Alice%20Only')).json()
  expect(search).toEqual([])

  // Direct access by id behaves as if it doesn't exist.
  expect((await bob.get(`/api/jobs/${job.id}`)).status()).toBe(404)
  expect((await bob.put(`/api/jobs/${job.id}`, { data: { status: 'rejected' } })).status()).toBe(404)
  expect((await bob.delete(`/api/jobs/${job.id}`)).status()).toBe(404)
  expect((await bob.post(`/api/jobs/${job.id}/tasks`, { data: { title: 'sneaky' } })).status()).toBe(404)

  // Alice's job is untouched.
  const still = await (await alice.get(`/api/jobs/${job.id}`)).json()
  expect(still.status).not.toBe('rejected')

  // Deleting an account removes its data.
  const del = await alice.delete('/api/auth/account', { data: { password: 'correct-horse-9' } })
  expect(del.status()).toBe(200)
  expect((await alice.get('/api/jobs')).status()).toBe(401)

  await alice.dispose()
  await bob.dispose()
})

for (const scheme of ['light', 'dark'] as const) {
  for (const path of ['/login', '/signup', '/forgot-password', '/reset-password?token=abc']) {
    test(`${path} has no serious accessibility violations (${scheme})`, async ({ page }) => {
      const { default: AxeBuilder } = await import('@axe-core/playwright')
      await page.emulateMedia({ colorScheme: scheme })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      const serious = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
      for (const v of serious) for (const n of v.nodes) console.log(`AXE|${scheme}|${path}|${v.id}|${n.html.slice(0, 200)}`)
      expect(serious.map(v => v.id)).toEqual([])
    })
  }
}

test('password reset links that are fake or reused are rejected', async ({ request }) => {
  const res = await request.post('/api/auth/reset', { data: { token: 'x'.repeat(43), password: 'a-new-password' } })
  expect(res.status()).toBe(400)
  expect((await res.json()).error).toMatch(/expired|used/i)
})

test('forgot-password page explains when email is not set up', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('link', { name: 'Forgot password?' }).click()
  await expect(page).toHaveURL('/forgot-password')
  // CI has no RESEND_API_KEY.
  await expect(page.getByText(/not set up on this site yet/)).toBeVisible()
})

test('Google sign-in is hidden when not configured, and its route says so', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('link', { name: 'Continue with Google' })).toHaveCount(0)
  await page.goto('/api/auth/google')
  await expect(page).toHaveURL(/\/login\?error=google_off/)
  await expect(page.getByRole('alert').filter({ hasText: /\S/ })).toHaveText(/not set up/)
})

test('a bad email confirmation link sends you to settings with a clear message', async ({ page }) => {
  await page.request.post('/api/auth/signup', { data: { name: 'Verify Test', email: unique(), password: 'correct-horse-9' } })
  await page.goto('/api/auth/verify?token=' + 'y'.repeat(43))
  await expect(page).toHaveURL(/\/settings\?verify=expired/)
  await expect(page.getByText(/confirmation link has expired/)).toBeVisible()
})

test('the extension can send page HTML for sites the server cannot fetch', async ({ request }) => {
  await signUp(request, unique())
  const html = `<html><head><script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'JobPosting', title: 'Platform Engineer',
    hiringOrganization: { '@type': 'Organization', name: 'Login Only Co' },
    jobLocation: { '@type': 'Place', address: { addressLocality: 'Toronto', addressRegion: 'ON' } },
    description: '<p>Build things.</p>',
  })}</script></head><body></body></html>`
  // This host does not exist, so a successful import proves the sent HTML was used.
  const res = await request.post('/api/jobs/import-url', { data: { url: 'https://intranet.example.test/jobs/1', html } })
  expect(res.status()).toBe(200)
  const { job, source } = await res.json()
  expect(source).toBe('json-ld')
  expect(job.company).toBe('Login Only Co')
  expect(job.role).toBe('Platform Engineer')
})

test('extension tracking adds a new job as Applied, then moves a saved one', async ({ request }) => {
  await signUp(request, unique())
  const created = await request.post('/api/jobs/track', { data: { source: 'LinkedIn', company: 'Track Co', role: 'Data Analyst', location: 'Toronto, ON', jobUrl: 'https://www.linkedin.com/jobs/view/1/' } })
  expect(created.status()).toBe(201)
  const { jobId } = await created.json()
  expect((await (await request.get(`/api/jobs/${jobId}`)).json()).status).toBe('applied')

  // A saved job with the same company and role is moved, not duplicated.
  const saved = await (await request.post('/api/jobs', { data: { company: 'Saved Inc', role: 'Frontend Engineer', status: 'saved' } })).json()
  const moved = await (await request.post('/api/jobs/track', { data: { source: 'Indeed', company: 'saved inc', role: 'Frontend Engineer' } })).json()
  expect(moved).toMatchObject({ result: 'moved', jobId: saved.id })
  const again = await (await request.post('/api/jobs/track', { data: { source: 'Indeed', company: 'Saved Inc', role: 'Frontend Engineer' } })).json()
  expect(again.result).toBe('already-tracked')
})

test('preparing an application explains what is missing instead of failing', async ({ request }) => {
  await signUp(request, unique())
  const job = await (await request.post('/api/jobs', { data: { company: 'Kit Co', role: 'Engineer' } })).json()
  const res = await request.post(`/api/jobs/${job.id}/prepare`)
  expect(res.status()).toBe(422) // no AI key in CI, and no résumé yet
  expect((await request.get(`/api/jobs/${job.id}/download?doc=resume`)).status()).toBe(404)
  const kit = await (await request.get(`/api/jobs/${job.id}/kit`)).json()
  expect(kit).toMatchObject({ resume: null, coverLetter: null, answers: [] })
})

test('the inbound email webhook refuses unsigned requests', async ({ request }) => {
  const res = await request.post('/api/inbound/resend', { data: { type: 'email.received', data: { email_id: 'x' } } })
  expect([401, 503]).toContain(res.status())
})

test('saving a résumé fills in empty profile fields without touching ones already set', async ({ request }) => {
  await signUp(request, unique(), 'Typed Name')
  const resume = `Jordan Lee\nToronto, ON | +1 (416) 555-0100 | linkedin.com/in/jordan-lee | github.com/jordanlee\n\nEXPERIENCE\nSoftware Developer Intern, Northwind (2025)\n- Built internal dashboards in React and TypeScript used by 40 people across three teams.`
  await request.put('/api/profile', { data: { masterResume: resume } })
  const res = await request.post('/api/profile/autofill', { data: {} })
  expect(res.status()).toBe(200)
  const { filled, profile } = await res.json()
  expect(filled).toEqual(expect.arrayContaining(['phone', 'linkedin', 'github']))
  expect(profile.github).toBe('https://github.com/jordanlee')
  expect(profile.name).toBe('Typed Name') // set at sign-up, so not replaced
})
