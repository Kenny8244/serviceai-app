import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AssetsPage from '@/pages/AssetsPage'
import { apiService, type Asset, type ObjectType } from '@/services/api'

const sample: Asset = {
  id: 'obj-1',
  name: 'Walk-in cooler',
  description: null,
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
      { id: 'attr-min', name: 'min_quantity', label: 'Reorder threshold', dataType: 'number', required: false, order: 3 },
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
      { id: 'attr-min', name: 'min_quantity', label: 'Reorder threshold', dataType: 'number', required: false, order: 3 },
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

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderAssetsPage(initialPath = '/assets') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/assets/:id" element={<LocationProbe />} />
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

describe('AssetsPage', () => {
  it('shows Add Asset on an empty live list', async () => {
    vi.spyOn(apiService, 'getAssets').mockResolvedValue([])
    renderAssetsPage()

    expect(await screen.findByText('No assets yet')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Add Asset' }).length).toBeGreaterThanOrEqual(2)
  })

  it('opens the add asset form from the header button', async () => {
    vi.spyOn(apiService, 'getAssets').mockResolvedValue([sample])
    mockObjectTypes()
    renderAssetsPage()

    await screen.findByText('Walk-in cooler')
    fireEvent.click(screen.getAllByRole('button', { name: 'Add Asset' })[0])

    expect(await screen.findByRole('dialog', { name: 'Add Asset' })).toBeInTheDocument()
    expect(await screen.findByLabelText(/object type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^sku$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^quantity/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/reorder threshold/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/avatar/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choose image' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.getByText('Retail example schema')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/object type/i), { target: { value: 'type-freezer' } })
    expect(await screen.findByLabelText(/^temperature$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^temperature$/i)).toHaveValue(null)
    expect(screen.getByLabelText(/^capacity$/i)).toBeInTheDocument()
    expect(screen.getByText('Restaurant example schema')).toBeInTheDocument()
    expect(screen.queryByLabelText(/^sku$/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/^quantity$/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/reorder threshold/i)).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/object type/i), { target: { value: 'type-ingredient' } })
    expect(await screen.findByLabelText(/^unit/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/reorder threshold/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^perishable$/i)).toHaveAttribute('type', 'checkbox')

    fireEvent.change(screen.getByLabelText(/object type/i), { target: { value: 'type-note' } })
    const notesField = await screen.findByLabelText(/^notes$/i)
    expect(notesField.tagName).toBe('TEXTAREA')

    const overlay = screen.getByRole('dialog', { name: 'Add Asset' }).parentElement
    fireEvent.mouseDown(screen.getByLabelText(/^notes$/i))
    fireEvent.click(overlay!)
    expect(screen.getByRole('dialog', { name: 'Add Asset' })).toBeInTheDocument()
  })

  it('navigates to the asset detail route when a row is opened', async () => {
    vi.spyOn(apiService, 'getAssets').mockResolvedValue([sample])
    mockObjectTypes()
    renderAssetsPage()

    fireEvent.click(await screen.findByText('Walk-in cooler'))
    expect(await screen.findByTestId('location')).toHaveTextContent('/assets/obj-1')
  })

  it('saves a new asset through the API and opens its detail page', async () => {
    let assets: Asset[] = [sample]
    vi.spyOn(apiService, 'getAssets').mockImplementation(async () => assets)
    mockObjectTypes()
    const created: Asset = {
      ...sample,
      id: 'obj-new',
      name: 'New cooler',
      sku: 'SKU-22',
      quantity: 8,
      minQuantity: 3,
      customFields: {
        ...sample.customFields,
        sku: 'SKU-22',
        quantity: 8,
        min_quantity: 3,
      },
    }
    const createAsset = vi.spyOn(apiService, 'createAsset').mockImplementation(async () => {
      assets = [created, ...assets.filter((asset) => asset.id !== created.id)]
      return created
    })
    renderAssetsPage()

    await screen.findByText('Walk-in cooler')
    fireEvent.click(screen.getAllByRole('button', { name: 'Add Asset' })[0])
    const dialog = await screen.findByRole('dialog', { name: 'Add Asset' })
    fireEvent.change(await screen.findByLabelText(/^name/i), { target: { value: 'New cooler' } })
    fireEvent.change(await screen.findByLabelText(/^sku$/i), { target: { value: 'SKU-22' } })
    fireEvent.change(screen.getByLabelText(/^quantity/i), { target: { value: '8' } })
    fireEvent.change(screen.getByLabelText(/reorder threshold/i), { target: { value: '3' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Add Asset' })).not.toBeInTheDocument()
    })
    expect(createAsset).toHaveBeenCalledTimes(1)
    expect(createAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New cooler',
        objectTypeId: 'type-product',
        sku: 'SKU-22',
        quantity: 8,
        minQuantity: 3,
        customFields: expect.objectContaining({
          sku: 'SKU-22',
          quantity: 8,
          min_quantity: 3,
        }),
      })
    )
    expect(await screen.findByTestId('location')).toHaveTextContent('/assets/obj-new')
  })

  it('does not save when a required schema field is empty', async () => {
    vi.spyOn(apiService, 'getAssets').mockResolvedValue([sample])
    mockObjectTypes()
    const createAsset = vi.spyOn(apiService, 'createAsset').mockResolvedValue(sample)
    renderAssetsPage()

    await screen.findByText('Walk-in cooler')
    fireEvent.click(screen.getAllByRole('button', { name: 'Add Asset' })[0])
    const dialog = await screen.findByRole('dialog', { name: 'Add Asset' })
    fireEvent.change(await screen.findByLabelText(/object type/i), { target: { value: 'type-freezer' } })
    await screen.findByLabelText(/^location/i)
    fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: 'New freezer' } })
    fireEvent.submit(dialog.querySelector('form')!)

    expect(await screen.findByText('Location is required.')).toBeInTheDocument()
    expect(createAsset).not.toHaveBeenCalled()
  })

  it('does not show stock quantity for types without a quantity field', async () => {
    const freezer: Asset = {
      ...sample,
      id: 'obj-fz',
      name: 'Walk-in freezer',
      objectTypeId: 'type-freezer',
      objectTypeName: 'Freezer',
      sku: null,
      quantity: 0,
      minQuantity: 0,
      customFields: { location: 'Dock' },
    }
    vi.spyOn(apiService, 'getAssets').mockResolvedValue([freezer])
    mockObjectTypes()
    renderAssetsPage()

    expect(await screen.findByText('Walk-in freezer')).toBeInTheDocument()
    expect(screen.queryByText(/Qty/)).not.toBeInTheDocument()
    expect(screen.queryByText('OUT')).not.toBeInTheDocument()
    expect(screen.queryByText('LOW')).not.toBeInTheDocument()
  })

  it('flags inventory as LOW when quantity is at or below the reorder threshold', async () => {
    const low: Asset = {
      ...sample,
      quantity: 2,
      minQuantity: 2,
      customFields: {
        ...sample.customFields,
        quantity: 2,
        min_quantity: 2,
      },
    }
    vi.spyOn(apiService, 'getAssets').mockResolvedValue([low])
    mockObjectTypes()
    renderAssetsPage()

    expect(await screen.findByText('Walk-in cooler')).toBeInTheDocument()
    expect(screen.getByText('LOW')).toBeInTheDocument()
    expect(screen.getByText(/Qty 2/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Walk-in cooler/ })).toHaveClass('bg-amber-50')
  })

  it('flags inventory as OUT when quantity is zero', async () => {
    const out: Asset = {
      ...sample,
      quantity: 0,
      minQuantity: 2,
      customFields: {
        ...sample.customFields,
        quantity: 0,
        min_quantity: 2,
      },
    }
    vi.spyOn(apiService, 'getAssets').mockResolvedValue([out])
    mockObjectTypes()
    renderAssetsPage()

    expect(await screen.findByText('Walk-in cooler')).toBeInTheDocument()
    expect(screen.getByText('OUT')).toBeInTheDocument()
    expect(screen.queryByText('LOW')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Walk-in cooler/ })).toHaveClass('bg-red-50')
  })

  it('shows an error when object types fail to load', async () => {
    vi.spyOn(apiService, 'getAssets').mockResolvedValue([sample])
    vi.spyOn(apiService, 'getObjectTypes').mockRejectedValue(
      Object.assign(new Error('Could not load object types.'), { status: 500 })
    )
    renderAssetsPage()

    await screen.findByText('Walk-in cooler')
    fireEvent.click(screen.getAllByRole('button', { name: 'Add Asset' })[0])

    expect(await screen.findByText('The server had a problem. Please try again in a moment.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('filters the list by object type, not category', async () => {
    vi.spyOn(apiService, 'getAssets').mockResolvedValue([sample, ingredient])
    mockObjectTypes()
    renderAssetsPage()

    await screen.findByText('Walk-in cooler')
    expect(screen.getByRole('heading', { name: 'Object types' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Categories' })).not.toBeInTheDocument()

    const sidebar = screen.getByRole('heading', { name: 'Object types' }).closest('div')
    fireEvent.click(within(sidebar!).getByRole('button', { name: /ingredient/i }))

    expect(screen.getByText('Flour 00')).toBeInTheDocument()
    expect(screen.queryByText('Walk-in cooler')).not.toBeInTheDocument()
  })

  it('renders type, quantity, and updated date on a live row', async () => {
    vi.spyOn(apiService, 'getAssets').mockResolvedValue([sample])
    mockObjectTypes()
    renderAssetsPage()

    expect(await screen.findByText('Walk-in cooler')).toBeInTheDocument()
    expect(screen.getAllByText(/Product/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Qty 12/)).toBeInTheDocument()
    expect(screen.getAllByText(/Updated/).length).toBeGreaterThan(0)
  })

  it('shows an error state when the list API fails', async () => {
    vi.spyOn(apiService, 'getAssets').mockRejectedValue(
      Object.assign(new Error('Could not load assets.'), { status: 500 })
    )
    renderAssetsPage()

    expect(await screen.findByText("Couldn't load assets")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })
})
