import { test } from '@playwright/test'

// Captures README screenshots from seeded data. Saved under e2e-screenshots/.
const SHOTS = [
  { path: '/', name: 'dashboard' },
  { path: '/jobs', name: 'jobs-board' },
  { path: '/agent', name: 'job-agent' },
  { path: '/analytics', name: 'analytics' },
]

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} screenshots`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })
    for (const { path, name } of SHOTS) {
      test(`${name} (${scheme})`, async ({ page }) => {
        await page.goto(path)
        await page.waitForLoadState('networkidle')
        // Hide the floating reminders popup so it doesn't cover the page.
        const dismiss = page.getByRole('button', { name: 'Dismiss all reminders' })
        if (await dismiss.isVisible()) await dismiss.click()
        await page.waitForTimeout(800) // let charts animate in
        await page.screenshot({ path: `e2e-screenshots/${name}-${scheme}.png` })
      })
    }
  })
}

test('mobile dashboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: 'e2e-screenshots/mobile-dashboard.png' })
})
