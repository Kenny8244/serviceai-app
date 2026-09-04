import { expect, test } from '@playwright/test'

test('assets list shows live workspace data and an Add Asset action', async ({ page, request }) => {
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
  await expect(page.getByText('Walk-in cooler').first()).toBeVisible()

  await page.getByRole('button', { name: 'Add Asset' }).first().click()
  await expect(page.getByRole('dialog', { name: 'Add Asset' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Choose image' })).toBeVisible()
  const createdName = `Shelf unit ${Date.now()}`
  await page.getByLabel(/^name/i).fill(createdName)
  await page.getByRole('spinbutton', { name: 'Quantity', exact: true }).fill('4')
  await page.getByLabel(/avatar/i).setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    ),
  })
  await expect(page.getByRole('img', { name: 'Avatar preview' })).toBeVisible()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('dialog', { name: 'Add Asset' })).toHaveCount(0)
  await expect(page.getByText(createdName).first()).toBeVisible()
  await expect(page.getByRole('img', { name: createdName }).first()).toBeVisible()

  await page.getByRole('button', { name: 'Edit' }).click()
  await expect(page.getByRole('dialog', { name: 'Edit Asset' })).toBeVisible()
  const editedName = `${createdName} updated`
  await page.getByLabel(/^name/i).fill(editedName)
  await page.getByLabel(/location/i).fill('Back room')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('dialog', { name: 'Edit Asset' })).toHaveCount(0)
  await expect(page.getByText(editedName).first()).toBeVisible()
  await expect(page.getByText('Back room').first()).toBeVisible()

  await page.getByRole('button', { name: /delete product/i }).click()
  const deleteDialog = page.getByRole('dialog', { name: 'Delete product?' })
  await expect(deleteDialog).toBeVisible()
  await expect(deleteDialog).toContainText(editedName)
  await deleteDialog.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByRole('dialog', { name: 'Delete product?' })).toHaveCount(0)
  await expect(page.getByText(editedName)).toHaveCount(0)

  await page.reload()
  await expect(page.getByText(editedName)).toHaveCount(0)
})
