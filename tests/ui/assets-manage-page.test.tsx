import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AssetsManagePage from '@/pages/AssetsManagePage'
import { apiService, type Asset } from '@/services/api'

const archived: Asset = {
  id: 'arch-1',
  name: 'Old cooler',
  description: null,
  category: 'inventory_item',
  objectTypeId: 'type-product',
  objectTypeName: 'Product',
  sku: 'SKU-OLD',
  quantity: 0,
  minQuantity: 0,
  unitCost: null,
  supplier: null,
  location: 'Back',
  tags: null,
  avatar: null,
  customFields: {},
  isActive: false,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  deletedAt: '2026-09-10T00:00:00.000Z',
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('AssetsManagePage', () => {
  it('lists archived assets and permanently deletes after confirm', async () => {
    vi.spyOn(apiService, 'getArchivedAssets').mockResolvedValue([archived])
    const permanentlyDeleteAsset = vi
      .spyOn(apiService, 'permanentlyDeleteAsset')
      .mockResolvedValue({ success: true })

    render(
      <MemoryRouter initialEntries={['/assets/manage']}>
        <Routes>
          <Route path="/assets/manage" element={<AssetsManagePage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Old cooler')).toBeInTheDocument()
    expect(screen.getByText(/1 archived item/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /delete old cooler forever/i }))
    const dialog = await screen.findByRole('dialog', { name: 'Delete forever?' })
    expect(dialog).toHaveTextContent('Old cooler')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog', { name: 'Delete forever?' })).not.toBeInTheDocument()
    expect(permanentlyDeleteAsset).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /delete old cooler forever/i }))
    const confirm = await screen.findByRole('dialog', { name: 'Delete forever?' })
    fireEvent.click(within(confirm).getByRole('button', { name: 'Delete forever' }))

    await waitFor(() => {
      expect(permanentlyDeleteAsset).toHaveBeenCalledWith('arch-1')
    })
    expect(screen.queryByText('Old cooler')).not.toBeInTheDocument()
  })

  it('shows empty archive state', async () => {
    vi.spyOn(apiService, 'getArchivedAssets').mockResolvedValue([])
    render(
      <MemoryRouter initialEntries={['/assets/manage']}>
        <Routes>
          <Route path="/assets/manage" element={<AssetsManagePage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Archive is empty')).toBeInTheDocument()
  })
})
