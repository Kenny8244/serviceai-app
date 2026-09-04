import { expect, test } from '@playwright/test'

test('sidebar Import Data uploads CSV into the asset list', async ({ page, request }) => {
  const demo = await request.post('http://127.0.0.1:8787/api/auth/demo')
  expect(demo.ok()).toBeTruthy()
  const { token } = (await demo.json()) as { token: string }

  await page.addInitScript(
    ({ authToken }) => {
      localStorage.setItem('authToken', authToken)
      localStorage.setItem('serviceai_verticalId', 'retail')
      sessionStorage.removeItem('authToken')
    },
    { authToken: token }
  )

  await page.goto('/assets')
  await expect(page.getByRole('button', { name: 'Add Asset' }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Import Data' }).click()
  await expect(page).toHaveURL(/\/assets\/import/)
  await expect(page.getByRole('heading', { name: 'Import Data' })).toBeVisible()

  const importedName = `CSV crate ${Date.now()}`
  await page.getByLabel('CSV file').setInputFiles({
    name: 'items.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      `name,sku,quantity,min_quantity,unit_cost,supplier,location,description\n${importedName},CSV-1,7,2,3.5,Acme,Dock,Bulk crate\n`
    ),
  })

  await expect(page.getByText(importedName)).toBeVisible()
  await expect(page.getByText('Min qty')).toBeVisible()
  await expect(page.getByText('Acme')).toBeVisible()
  await page.getByRole('button', { name: /Import 1 item/ }).click()
  await expect(page).toHaveURL(/\/assets$/)
  await expect(page.getByRole('status').filter({ hasText: /Import/ })).toBeVisible()
  await expect(page.getByText(importedName).first()).toBeVisible()

  await page.reload()
  await expect(page.getByText(importedName).first()).toBeVisible()
})
