import { test as setup, expect } from '@playwright/test'
import { DEMO_EMAIL, DEMO_PASSWORD } from '../src/lib/demo-credentials'

setup('sign in as the seeded demo user', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(DEMO_EMAIL)
  await page.getByLabel('Password').fill(DEMO_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // The demo user has seen the welcome tour, so it doesn't sit over the pages under test.
  expect((await page.request.put('/api/profile', { data: { tourSeen: true } })).ok()).toBe(true)
  await page.context().storageState({ path: 'e2e/.auth/demo.json' })
})
