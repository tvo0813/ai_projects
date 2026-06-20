import { test, expect } from '@playwright/test'

test('home page loads and shows store name', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/\S+/)
  // Hero heading is visible
  await expect(page.locator('h1').first()).toBeVisible()
})

test('navigation links are present', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: /menu/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /deals/i })).toBeVisible()
})
