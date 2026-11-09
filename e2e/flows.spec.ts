import { test, expect } from '@playwright/test'

test('add a job, find it by search, drag it to Applied, then delete it', async ({ page }) => {
  await page.goto('/jobs')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'New application' })
  await dialog.getByLabel('Company').fill('E2E Test Co')
  await dialog.getByLabel('Role').fill('Playwright Engineer')
  await dialog.getByLabel('Location').fill('Toronto, ON')
  await dialog.getByRole('button', { name: 'Add application' }).click()
  await expect(dialog).toBeHidden()

  // Search is case-insensitive.
  await page.getByLabel('Search jobs').fill('e2e test')
  const column = (name: string) => page.getByRole('region', { name, exact: true })
  const card = column('Saved').getByRole('button', { name: /E2E Test Co/ })
  await expect(card).toBeVisible()

  // Keyboard drag-and-drop: lift, move one column right, drop.
  await card.focus()
  await page.keyboard.press('Space')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Space')
  await expect(column('Applied').getByRole('button', { name: /E2E Test Co/ })).toBeVisible()
  await expect(page.getByText('Moved E2E Test Co to Applied')).toBeVisible()

  // Persisted: reload and it's still in Applied.
  await page.reload()
  await page.getByLabel('Search jobs').fill('E2E Test')
  await expect(column('Applied').getByRole('button', { name: /E2E Test Co/ })).toBeVisible()

  // Enter on a card opens its details.
  await column('Applied').getByRole('button', { name: /E2E Test Co/ }).press('Enter')
  await expect(page).toHaveURL(/\/jobs\?id=/)

  // Clean up through the API.
  const jobs = await (await page.request.get('/api/jobs?search=E2E%20Test%20Co')).json()
  for (const j of jobs) await page.request.delete(`/api/jobs/${j.id}`)
})

test('import rejects private addresses', async ({ request }) => {
  const res = await request.post('/api/jobs/import-url', { data: { url: 'http://169.254.169.254/latest/meta-data' } })
  expect(res.status()).toBe(422)
  expect((await res.json()).error).toMatch(/private/i)
})

test('profile updates are partial', async ({ request }) => {
  const before = await (await request.get('/api/profile')).json()
  const after = await (await request.put('/api/profile', { data: { weeklyGoal: before.weeklyGoal + 1 } })).json()
  expect(after.weeklyGoal).toBe(before.weeklyGoal + 1)
  expect(after.targetRoles).toBe(before.targetRoles)
  expect(after.skills).toBe(before.skills)
  await request.put('/api/profile', { data: { weeklyGoal: before.weeklyGoal } })
})

test('cron endpoint rejects unauthenticated calls', async ({ request }) => {
  const res = await request.get('/api/cron/discover')
  expect(res.status()).toBe(401)
})
