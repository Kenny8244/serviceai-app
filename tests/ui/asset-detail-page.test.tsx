import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AssetDetailPage from '@/pages/AssetDetailPage'
import { apiService, type Asset, type ObjectType } from '@/services/api'

const sample: Asset = {
  id: 'obj-1',
  name: 'Walk-in cooler',
  description: 'Cold storage unit',
  category: 'inventory_item',
  objectTypeId: 'type-product',
  objectTypeName: 'Product',
  sku: 'SKU-9',
  quantity: 12,
  minQuantity: 2,
  unitCost: 4.5,
  supplier: null,
  location: 'Kitchen',
  tags: null,
  avatar: null,
  customFields: {
    sku: 'SKU-9',
    quantity: 12,
    min_quantity: 2,
    unit_cost: 4.5,
    location: 'Kitchen',
  },
  isActive: true,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-04T00:00:00.000Z',
}

const ingredient: Asset = {
  id: 'obj-ing',
  name: 'Flour 00',
  description: null,
  category: 'Ingredient',
  objectTypeId: 'type-ingredient',
  objectTypeName: 'Ingredient',
  sku: null,
  quantity: 5,
  minQuantity: 0,
  unitCost: null,
  supplier: null,
  location: null,
  tags: null,
  avatar: null,
  customFields: {
    quantity: 5,
    unit: 'kg',
    perishable: true,
  },
  isActive: true,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-04T00:00:00.000Z',
}

const noteAsset: Asset = {
  id: 'obj-note',
  name: 'Storage note',
  description: null,
  category: 'Note',
  objectTypeId: 'type-note',
  objectTypeName: 'Note',
  sku: null,
  quantity: 0,
  minQuantity: 0,
  unitCost: null,
  supplier: null,
  location: null,
  tags: null,
  avatar: null,
  customFields: {
    notes: 'Keep dry',
  },
  isActive: true,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-04T00:00:00.000Z',
}

const objectTypes: ObjectType[] = [
  {
    id: 'type-product',
    name: 'Product',
    description: 'Sellable or stocked products.',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    attributes: [
      { id: 'attr-sku', name: 'sku', label: 'SKU', dataType: 'string', required: false, order: 1 },
      { id: 'attr-qty', name: 'quantity', label: 'Quantity', dataType: 'number', required: true, order: 2 },
      { id: 'attr-min', name: 'min_quantity', label: 'Minimum quantity', dataType: 'number', required: false, order: 3 },
      { id: 'attr-loc', name: 'location', label: 'Location', dataType: 'string', required: false, order: 6 },
    ],
  },
  {
    id: 'type-freezer',
    name: 'Freezer',
    description: 'Cold storage equipment and freezer units.',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    attributes: [
      { id: 'attr-floc', name: 'location', label: 'Location', dataType: 'string', required: true, order: 1 },
      { id: 'attr-temp', name: 'temperature', label: 'Temperature', dataType: 'number', required: false, order: 2 },
      { id: 'attr-cap', name: 'capacity', label: 'Capacity', dataType: 'number', required: false, order: 3 },
    ],
  },
  {
    id: 'type-ingredient',
    name: 'Ingredient',
    description: 'Raw ingredients and consumable supplies.',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    attributes: [
      { id: 'attr-iqty', name: 'quantity', label: 'Quantity', dataType: 'number', required: true, order: 1 },
      { id: 'attr-unit', name: 'unit', label: 'Unit', dataType: 'string', required: true, order: 2 },
      { id: 'attr-perish', name: 'perishable', label: 'Perishable', dataType: 'boolean', required: false, order: 5 },
    ],
  },
  {
    id: 'type-note',
    name: 'Note',
    description: 'Freeform notes with a text schema field.',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    attributes: [
      { id: 'attr-notes', name: 'notes', label: 'Notes', dataType: 'text', required: false, order: 1 },
    ],
  },
]

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderDetail(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/assets/:id" element={<AssetDetailPage />} />
        <Route path="/assets" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  )
}

function mockObjectTypes() {
  vi.spyOn(apiService, 'getObjectTypes').mockResolvedValue(objectTypes)
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('AssetDetailPage', () => {
  it('shows core and dynamic attributes for a loaded asset', async () => {
    vi.spyOn(apiService, 'getAssetById').mockResolvedValue(sample)
    mockObjectTypes()
    renderDetail('/assets/obj-1')

    expect(await screen.findByRole('heading', { name: 'Walk-in cooler' })).toBeInTheDocument()
    expect(screen.getByText('Product')).toBeInTheDocument()
    expect(screen.getByText('SKU-9')).toBeInTheDocument()
    expect(screen.getByText('Kitchen')).toBeInTheDocument()
    expect(screen.getByText('Cold storage unit')).toBeInTheDocument()
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
    expect(screen.getByText('Related service requests')).toBeInTheDocument()
    expect(screen.getByText('No service requests yet')).toBeInTheDocument()
  })

  it('shows boolean and text schema values on the detail page', async () => {
    vi.spyOn(apiService, 'getAssetById').mockResolvedValue(ingredient)
    mockObjectTypes()
    renderDetail('/assets/obj-ing')

    expect(await screen.findByRole('heading', { name: 'Flour 00' })).toBeInTheDocument()
    expect(screen.getByText('kg')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()
  })

  it('opens the edit form with the selected asset values', async () => {
    vi.spyOn(apiService, 'getAssetById').mockResolvedValue(sample)
    mockObjectTypes()
    renderDetail('/assets/obj-1')

    await screen.findByRole('heading', { name: 'Walk-in cooler' })
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))

    expect(await screen.findByRole('dialog', { name: 'Edit Asset' })).toBeInTheDocument()
    expect(screen.getByLabelText(/name/i)).toHaveValue('Walk-in cooler')
    expect(screen.getByLabelText(/object type/i)).toHaveValue('type-product')
    await waitFor(() => {
      expect(screen.getByLabelText(/^quantity/i)).toHaveValue(12)
    })
    expect(screen.getByLabelText(/minimum quantity/i)).toHaveValue(2)
    expect(screen.getByLabelText(/location/i)).toHaveValue('Kitchen')
  })

  it('reloads boolean and text schema values in the edit form', async () => {
    vi.spyOn(apiService, 'getAssetById').mockResolvedValue(ingredient)
    mockObjectTypes()
    renderDetail('/assets/obj-ing')

    await screen.findByRole('heading', { name: 'Flour 00' })
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(await screen.findByRole('dialog', { name: 'Edit Asset' })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByLabelText(/^unit/i)).toHaveValue('kg')
    })
    expect(screen.getByLabelText(/^perishable$/i)).toBeChecked()
  })

  it('loads text schema values for note assets in the edit form', async () => {
    vi.spyOn(apiService, 'getAssetById').mockResolvedValue(noteAsset)
    mockObjectTypes()
    renderDetail('/assets/obj-note')

    expect(await screen.findByText('Keep dry')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(await screen.findByRole('dialog', { name: 'Edit Asset' })).toBeInTheDocument()
    await waitFor(() => {
      const notesField = screen.getByLabelText(/^notes$/i)
      expect(notesField.tagName).toBe('TEXTAREA')
      expect(notesField).toHaveValue('Keep dry')
    })
  })

  it('does not copy previous type values when the object type changes', async () => {
    vi.spyOn(apiService, 'getAssetById').mockResolvedValue(sample)
    mockObjectTypes()
    renderDetail('/assets/obj-1')

    await screen.findByRole('heading', { name: 'Walk-in cooler' })
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    await screen.findByRole('dialog', { name: 'Edit Asset' })
    fireEvent.change(await screen.findByLabelText(/object type/i), { target: { value: 'type-freezer' } })

    expect(await screen.findByLabelText(/^location/i)).toHaveValue('')
    expect(screen.getByLabelText(/^temperature/i)).toHaveValue(null)
  })

  it('asks for confirmation before deleting and returns to the list', async () => {
    vi.spyOn(apiService, 'getAssetById').mockResolvedValue(sample)
    mockObjectTypes()
    const deleteAsset = vi.spyOn(apiService, 'deleteAsset').mockResolvedValue({ success: true })
    renderDetail('/assets/obj-1')

    await screen.findByRole('heading', { name: 'Walk-in cooler' })
    fireEvent.click(screen.getByRole('button', { name: /delete asset/i }))

    const dialog = await screen.findByRole('dialog', { name: 'Delete asset?' })
    expect(dialog).toHaveTextContent('Walk-in cooler')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog', { name: 'Delete asset?' })).not.toBeInTheDocument()
    expect(deleteAsset).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /delete asset/i }))
    const confirmDialog = await screen.findByRole('dialog', { name: 'Delete asset?' })
    fireEvent.click(within(confirmDialog).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByTestId('location')).toHaveTextContent('/assets')
    expect(deleteAsset).toHaveBeenCalledWith('obj-1')
  })

  it('handles a missing asset with a not-found state', async () => {
    vi.spyOn(apiService, 'getAssetById').mockRejectedValue(
      Object.assign(new Error('Asset not found'), { status: 404 })
    )
    mockObjectTypes()
    renderDetail('/assets/missing')

    expect(await screen.findByText('Asset not found')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Back to list' })).toBeInTheDocument()
  })

  it('shows an error state when the asset API fails', async () => {
    vi.spyOn(apiService, 'getAssetById').mockRejectedValue(
      Object.assign(new Error('Could not load asset.'), { status: 500 })
    )
    mockObjectTypes()
    renderDetail('/assets/obj-1')

    expect(await screen.findByText("Couldn't load asset")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })
})
