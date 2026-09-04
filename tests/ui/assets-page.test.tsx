import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AssetsPage from '@/pages/AssetsPage'
import { apiService, type Asset } from '@/services/api'

const sample: Asset = {
  id: 'obj-1',
  name: 'Walk-in cooler',
  description: null,
  category: 'inventory_item',
  sku: 'SKU-9',
  quantity: 12,
  minQuantity: 2,
  unitCost: 4.5,
  supplier: null,
  location: 'Kitchen',
  tags: null,
  avatar: null,
  isActive: true,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-04T00:00:00.000Z',
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('AssetsPage', () => {
  it('shows Add Asset on an empty live list', async () => {
    vi.spyOn(apiService, 'getAssets').mockResolvedValue([])
    render(<AssetsPage />)

    expect(await screen.findByText('No assets yet')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Add Asset' }).length).toBeGreaterThanOrEqual(2)
  })

  it('opens the add asset form from the header button', async () => {
    vi.spyOn(apiService, 'getAssets').mockResolvedValue([sample])
    render(<AssetsPage />)

    await screen.findAllByText('Walk-in cooler')
    fireEvent.click(screen.getAllByRole('button', { name: 'Add Asset' })[0])

    expect(await screen.findByRole('dialog', { name: 'Add Asset' })).toBeInTheDocument()
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/minimum quantity/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/unit cost/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/supplier/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/avatar/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choose image' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()

    const overlay = screen.getByRole('dialog', { name: 'Add Asset' }).parentElement
    fireEvent.mouseDown(screen.getByLabelText(/minimum quantity/i))
    fireEvent.click(overlay!)
    expect(screen.getByRole('dialog', { name: 'Add Asset' })).toBeInTheDocument()
  })

  it('opens the edit form with the selected asset values', async () => {
    vi.spyOn(apiService, 'getAssets').mockResolvedValue([sample])
    render(<AssetsPage />)

    await screen.findAllByText('Walk-in cooler')
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))

    expect(await screen.findByRole('dialog', { name: 'Edit Asset' })).toBeInTheDocument()
    expect(screen.getByLabelText(/name/i)).toHaveValue('Walk-in cooler')
    expect(screen.getByLabelText(/^quantity$/i)).toHaveValue(12)
    expect(screen.getByLabelText(/minimum quantity/i)).toHaveValue(2)
    expect(screen.getByLabelText(/location/i)).toHaveValue('Kitchen')
  })

  it('renders type, quantity, and updated date on a live row', async () => {
    vi.spyOn(apiService, 'getAssets').mockResolvedValue([sample])
    render(<AssetsPage />)

    expect((await screen.findAllByText('Walk-in cooler')).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/inventory_item/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Qty 12/)).toBeInTheDocument()
    expect(screen.getAllByText(/Updated/).length).toBeGreaterThan(0)
  })

  it('asks for confirmation before deleting the selected asset', async () => {
    vi.spyOn(apiService, 'getAssets').mockResolvedValue([sample])
    const deleteAsset = vi.spyOn(apiService, 'deleteAsset').mockResolvedValue({ success: true })
    render(<AssetsPage />)

    await screen.findAllByText('Walk-in cooler')
    fireEvent.click(screen.getByRole('button', { name: /delete product/i }))

    const dialog = await screen.findByRole('dialog', { name: 'Delete product?' })
    expect(dialog).toHaveTextContent('Walk-in cooler')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog', { name: 'Delete product?' })).not.toBeInTheDocument()
    expect(deleteAsset).not.toHaveBeenCalled()
    expect(screen.getAllByText('Walk-in cooler').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: /delete product/i }))
    const confirmDialog = await screen.findByRole('dialog', { name: 'Delete product?' })
    fireEvent.click(within(confirmDialog).getByRole('button', { name: 'Delete' }))

    await screen.findByText('No assets yet')
    expect(deleteAsset).toHaveBeenCalledWith('obj-1')
  })

  it('shows an error state when the list API fails', async () => {
    vi.spyOn(apiService, 'getAssets').mockRejectedValue(
      Object.assign(new Error('Could not load assets.'), { status: 500 })
    )
    render(<AssetsPage />)

    expect(await screen.findByText("Couldn't load assets")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })
})
