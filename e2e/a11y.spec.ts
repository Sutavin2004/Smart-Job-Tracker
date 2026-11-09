import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { PAGES } from './pages'

// WCAG 2.1 A/AA automated checks on every page, in light and dark mode.
for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} mode`, () => {
    test.use({ colorScheme: scheme })
    for (const { path } of PAGES) {
      test(`${path} has no serious accessibility violations`, async ({ page }, info) => {
        await page.goto(path)
        await page.waitForLoadState('networkidle')
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
        const serious = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
        await info.attach('axe-violations.json', { body: JSON.stringify(results.violations, null, 2), contentType: 'application/json' })
        expect(serious.map(v => `${v.id} (${v.nodes.length}): ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`)).toEqual([])
      })
    }
  })
}
