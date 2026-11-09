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
