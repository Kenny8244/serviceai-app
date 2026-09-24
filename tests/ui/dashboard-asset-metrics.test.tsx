import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Dashboard } from '@/pages/Dashboard'
import { apiService } from '@/services/api'

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('dashboard asset metric cards', () => {
  it('opens the low-stock asset list when that card is clicked', async () => {
    vi.spyOn(apiService, 'getDashboardOverview').mockResolvedValue({
      stats: [
        { label: 'Products / Assets', value: '4', iconKey: 'package', href: '/assets' },
        { label: 'Low Stock Items', value: '1', iconKey: 'alert-triangle', href: '/assets?status=LOW' },
        { label: 'Inventory Value', value: '$12,450', iconKey: 'trending-up' },
      ],
      activities: [],
      aiRecommendation: { title: 'Tip', detail: 'Restock' },
    })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <>
                <LocationProbe />
                <Dashboard />
              </>
            }
          />
          <Route path="/assets" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Low Stock Items: 1' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/assets?status=LOW')
  })
})
