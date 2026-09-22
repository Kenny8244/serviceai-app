import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DataImport } from '@/components/import/DataImport'
import * as importJob from '@/lib/assetImportJob'

function renderImport() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<DataImport vertical="retail" />} />
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

describe('DataImport', () => {
  it('starts a background import from a mapped CSV', async () => {
    const start = vi.spyOn(importJob, 'startAssetImport')
    renderImport()

    fireEvent.change(screen.getByLabelText('CSV file'), {
      target: {
        files: [
          csvFile(
            'items.csv',
            'asset_id,name,type,location,status,category\nRET-1001,Widget A,Widget,Aisle 1,active,Footwear\n'
          ),
        ],
      },
    })

    expect(await screen.findByRole('button', { name: 'Import 1 item' })).toBeInTheDocument()
    expect(screen.getByText('Not imported: type, status.')).toBeInTheDocument()
    expect(screen.queryByText(/Ready to import/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Import 1 item' }))

    expect(start).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          name: 'Widget A',
          sku: 'RET-1001',
          category: 'Footwear',
          location: 'Aisle 1',
        }),
      ],
      0
    )
    expect(screen.getByText('Assets list')).toBeInTheDocument()
  })

  it('shows the columns it found when the file has no name column', async () => {
    renderImport()

    fireEvent.change(screen.getByLabelText('CSV file'), {
      target: { files: [csvFile('items.csv', 'sku,quantity\nSKU-1,2\n')] },
    })

    expect(await screen.findByText(/This file has: sku, quantity/)).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong. Please try again.')).not.toBeInTheDocument()
    expect(screen.queryByText(/Ready to import/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Import \d/ })).not.toBeInTheDocument()
    expect(document.querySelector('[data-tip="name"]')).toHaveAttribute('data-status', 'fail')
    expect(document.querySelector('[data-tip="headers"]')).toHaveAttribute('data-status', 'pass')
    expect(document.querySelector('[data-tip="commas"]')).toHaveAttribute('data-status', 'pass')
  })
})
