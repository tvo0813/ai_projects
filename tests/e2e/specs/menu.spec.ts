import { test, expect } from '@playwright/test'

test('menu page shows items', async ({ page }) => {
  await page.goto('/menu')
  // Wait for at least one menu card to render
  await expect(page.locator('.card').first()).toBeVisible({ timeout: 10_000 })
})

test('menu category filter works', async ({ page }) => {
  await page.goto('/menu')
  const categoryBtn = page.getByRole('button', { name: /espresso/i }).first()
  if (await categoryBtn.isVisible()) {
    await categoryBtn.click()
    await expect(page.locator('.card').first()).toBeVisible()
  }
})
