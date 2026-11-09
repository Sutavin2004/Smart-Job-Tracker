import { test, expect } from '@playwright/test'
import { PAGES } from './pages'

for (const { path, heading } of PAGES) {
  test(`${path} loads without errors`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    page.on('console', m => { if (m.type() === 'error' && !/_vercel|favicon/.test(m.text())) errors.push(m.text()) })
    const failedApi: string[] = []
    page.on('response', r => { if (r.url().includes('/api/') && r.status() >= 500) failedApi.push(`${r.status()} ${r.url()}`) })

    await page.goto(path)
    await page.waitForLoadState('networkidle')
    if (heading) await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()

    expect(failedApi, 'API calls returning 5xx').toEqual([])
    expect(errors, 'console / page errors').toEqual([])
  })
}

test('unknown pages show the 404 screen', async ({ page }) => {
  const res = await page.goto('/definitely-not-a-page')
  expect(res?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
})

test('security headers are set', async ({ request }) => {
  const res = await request.get('/')
  expect(res.headers()['x-content-type-options']).toBe('nosniff')
  expect(res.headers()['x-frame-options']).toBe('DENY')
  expect(res.headers()['x-powered-by']).toBeUndefined()
})
