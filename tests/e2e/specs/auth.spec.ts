import { test, expect } from '@playwright/test'

const timestamp = Date.now()
const testEmail = `e2e-${timestamp}@test.com`
const testPassword = 'testpass123'
const testName = 'E2E User'

test('user can register', async ({ page }) => {
  await page.goto('/register')
  await page.getByLabel(/email/i).fill(testEmail)
  await page.getByLabel(/password/i).fill(testPassword)
  await page.getByLabel(/name/i).fill(testName)
  await page.getByRole('button', { name: /register|sign up|create/i }).click()
  // After register, user is redirected away from /register
  await expect(page).not.toHaveURL(/register/, { timeout: 8_000 })
})

test('user can log in', async ({ page }) => {
  // Register first
  const ctx = await page.context().request
  await ctx.post(`${process.env.E2E_API_URL ?? 'http://localhost:8000'}/api/auth/register`, {
    data: { email: `login-${timestamp}@test.com`, password: testPassword, full_name: testName },
  })

  await page.goto('/login')
  await page.getByLabel(/email/i).fill(`login-${timestamp}@test.com`)
  await page.getByLabel(/password/i).fill(testPassword)
  await page.getByRole('button', { name: /log in|sign in/i }).click()
  await expect(page).not.toHaveURL(/login/, { timeout: 8_000 })
})

test('login page shown when visiting protected route unauthenticated', async ({ page }) => {
  await page.goto('/orders')
  // Should either redirect to login or show a login prompt
  const hasLoginLink = await page.getByRole('link', { name: /login/i }).isVisible()
  const isOnLogin = page.url().includes('/login')
  expect(hasLoginLink || isOnLogin).toBe(true)
})
