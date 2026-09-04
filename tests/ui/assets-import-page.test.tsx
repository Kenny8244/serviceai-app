import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AssetsImportPage from '@/pages/AssetsImportPage'
import * as importJob from '@/lib/assetImportJob'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/assets/import']}>
      <Routes>
        <Route path="/assets/import" element={<AssetsImportPage />} />
        <Route path="/assets" element={<div>Assets list</div>} />
      </Routes>
    </MemoryRouter>
  )
}

function csvFile(name: string, contents: string) {
  return new File([contents], name, { type: 'text/csv' })
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  importJob.resetAssetImport()
})

describe('AssetsImportPage', () => {
  it('previews mapped rows including extra fields and starts a background import', async () => {
    const start = vi.spyOn(importJob, 'startAssetImport')

    renderPage()

    fireEvent.change(screen.getByLabelText('CSV file'), {
      target: {
        files: [
          csvFile(
            'items.csv',
            'name,sku,category,quantity,min_quantity,unit_cost,supplier,location,description\nWidget,SKU-1,Grocery,5,2,1.5,Acme,Aisle 1,Snack pack\n'
          ),
        ],
      },
    })

    expect(await screen.findByText('Widget')).toBeInTheDocument()
    expect(screen.getByText('Min qty')).toBeInTheDocument()
    expect(screen.getByText('Unit cost')).toBeInTheDocument()
    expect(screen.getByText('Supplier')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('1.5')).toBeInTheDocument()
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('Snack pack')).toBeInTheDocument()
    expect(screen.getByText('1 will be imported.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Import 1 item' }))

    expect(start).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          name: 'Widget',
          sku: 'SKU-1',
          quantity: 5,
          minQuantity: 2,
          unitCost: 1.5,
          supplier: 'Acme',
          location: 'Aisle 1',
          description: 'Snack pack',
        }),
      ],
      0
    )
    expect(screen.getByText('Assets list')).toBeInTheDocument()
  })

  it('rejects a non-CSV file', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('CSV file'), {
      target: { files: [new File(['oops'], 'notes.txt', { type: 'text/plain' })] },
    })

    expect(await screen.findByText('Please upload a CSV file.')).toBeInTheDocument()
  })

  it('explains a CSV without a name column', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('CSV file'), {
      target: { files: [csvFile('items.csv', 'sku,quantity\nSKU-1,2\n')] },
    })

    expect(await screen.findByText(/Add a name column/)).toBeInTheDocument()
  })
})
