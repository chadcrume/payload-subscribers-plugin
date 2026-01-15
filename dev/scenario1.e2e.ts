// import config from '@payload-config'
import { expect, test } from '@playwright/test'

const logLabel = (text: string) => `\n\x1B[96;1m${text}\x1B[m`

// this is an example Playwright e2e test
test('should render admin panel logo', async ({ page }) => {
  const host = process.env.PW_BASE_URL || 'http://localhost:3007'
  console.log(logLabel('test host'), host) // Red background, yellow text, underlined, then reset

  await page.goto(host + '/admin')

  // await expect(page.getByRole('textbox', { name: 'email' })).toBeVisible()
  // await expect(page.getByRole('textbox', { name: 'email' })).toBeEnabled()
  // await expect(page.getByRole('textbox', { name: 'password' })).toBeVisible()
  // await expect(page.getByRole('textbox', { name: 'password' })).toBeEnabled()

  // login
  await page.fill('#field-email', 'dev@payloadcms.com')
  await page.fill('#field-password', 'test')
  await page.click('.form-submit button')

  // should show dashboard
  await expect(page).toHaveTitle(/Dashboard/)
  await expect(page.locator('.graphic-icon')).toBeVisible()
})
