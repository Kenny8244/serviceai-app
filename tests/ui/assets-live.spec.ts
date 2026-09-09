import { expect, test } from '@playwright/test'

test('assets list shows live workspace data and an Add Asset action', async ({ page, request }) => {
  test.setTimeout(60_000)
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
  await expect(page.getByLabel(/object type/i)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Choose image' })).toBeVisible()
  await expect(page.getByLabel(/^sku$/i)).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('spinbutton', { name: /^quantity/i })).toBeVisible()
  await expect(page.getByText('Retail example schema')).toBeVisible()
  await page.getByLabel(/object type/i).selectOption({ label: 'Freezer' })
  await expect(page.getByLabel(/^temperature/i)).toBeVisible()
  await expect(page.getByText('Restaurant example schema')).toBeVisible()
  await expect(page.getByLabel(/^sku$/i)).toHaveCount(0)
  await page.getByLabel(/^name/i).fill('Will not save')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('dialog', { name: 'Add Asset' })).toBeVisible()
  await page.getByLabel(/object type/i).selectOption({ label: 'Product' })
  await expect(page.getByLabel(/^sku$/i)).toBeVisible()
  const createdName = `Shelf unit ${Date.now()}`
  await page.getByLabel(/^name/i).fill(createdName)
  await page.getByRole('spinbutton', { name: /^quantity/i }).fill('4')
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

  await page.getByRole('button', { name: 'Edit' }).click()
  await expect(page.getByRole('dialog', { name: 'Edit Asset' })).toBeVisible()
  await expect(page.getByLabel(/location/i)).toHaveValue('Back room')
  await page.getByRole('button', { name: 'Cancel' }).click()

  await page.getByRole('button', { name: 'Add Asset' }).first().click()
  await expect(page.getByRole('dialog', { name: 'Add Asset' })).toBeVisible()
  await page.getByLabel(/object type/i).selectOption({ label: 'Ingredient' })
  const ingredientName = `Flour ${Date.now()}`
  await page.getByLabel(/^name/i).fill(ingredientName)
  await page.getByRole('spinbutton', { name: /^quantity/i }).fill('3')
  await page.getByLabel(/^unit/i).fill('kg')
  await page.getByLabel(/^perishable$/i).check()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('dialog', { name: 'Add Asset' })).toHaveCount(0)
  await expect(page.getByText(ingredientName).first()).toBeVisible()

  await page.getByRole('button', { name: 'Edit' }).click()
  await expect(page.getByRole('dialog', { name: 'Edit Asset' })).toBeVisible()
  await expect(page.getByLabel(/^unit/i)).toHaveValue('kg')
  await expect(page.getByLabel(/^perishable$/i)).toBeChecked()
  await page.getByRole('button', { name: 'Cancel' }).click()

  await page.getByRole('button', { name: /delete asset/i }).click()
  const ingredientDelete = page.getByRole('dialog', { name: 'Delete asset?' })
  await expect(ingredientDelete).toBeVisible()
  await ingredientDelete.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByRole('dialog', { name: 'Delete asset?' })).toHaveCount(0)

  await page.getByText(editedName).first().click()

  await page.getByRole('button', { name: /delete asset/i }).click()
  const deleteDialog = page.getByRole('dialog', { name: 'Delete asset?' })
  await expect(deleteDialog).toBeVisible()
  await expect(deleteDialog).toContainText(editedName)
  await deleteDialog.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByRole('dialog', { name: 'Delete asset?' })).toHaveCount(0)
  await expect(page.getByText(editedName)).toHaveCount(0)

  await page.reload()
  await expect(page.getByText(editedName)).toHaveCount(0)
})
