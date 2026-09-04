import { expect, test, type Page } from '@playwright/test'
import { expiredJwt, validJwt } from '../helpers/jwt'

async function seedSession(page: Page, token: string) {
  await page.addInitScript(
    ({ authToken }) => {
      localStorage.setItem('authToken', authToken)
      localStorage.setItem('serviceai_verticalId', 'retail')
      sessionStorage.removeItem('authToken')
    },
    { authToken: token }
  )
}

test.describe('authenticated session UI', () => {
  test('protected routes show sign-in when there is no session', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expect(page).toHaveURL(/\/auth$/)
  })

  test('demo login without Remember me stays in localStorage after reload', async ({ page }) => {
    await page.goto('/auth')
    await page.getByRole('button', { name: 'Try Demo' }).click()
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 20_000 })
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toHaveCount(0)

    const stored = await page.evaluate(() => ({
      local: Boolean(localStorage.getItem('authToken')),
      session: Boolean(sessionStorage.getItem('authToken')),
    }))
    expect(stored.local).toBe(true)
    expect(stored.session).toBe(false)

    await page.reload()
    await expect(page).not.toHaveURL(/\/auth/)
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toHaveCount(0)
  })

  test('a valid session survives reload on the dashboard', async ({ page }) => {
    await seedSession(page, validJwt())
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Retail Dashboard' })).toBeVisible()

    await page.reload()
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: 'Retail Dashboard' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toHaveCount(0)
  })

  test('an expired token on a protected page returns to sign-in', async ({ page }) => {
    await seedSession(page, expiredJwt())
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expect(page).toHaveURL(/\/auth$/)
  })

  test('a rejected API session on Assets returns to sign-in', async ({ page }) => {
    await seedSession(page, validJwt('forged-user'))
    await page.goto('/assets')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page).toHaveURL(/\/auth$/)
  })
})
