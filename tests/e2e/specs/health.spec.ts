import { test, expect, request } from '@playwright/test'

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8000'

test('backend health check', async () => {
  const ctx = await request.newContext()
  const resp = await ctx.get(`${API_URL}/api/health`)
  expect(resp.status()).toBe(200)
  const body = await resp.json()
  expect(body.status).toBe('ok')
})
