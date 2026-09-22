import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ServiceRequestDetailPage from '@/pages/ServiceRequestDetailPage'
import { apiService, type ServiceRequest } from '@/services/api'

const sample: ServiceRequest = {
  id: 'sr-1',
  userId: 'user-1',
  workspaceId: 'ws-1',
  title: 'Cooler alarm',
  description: 'Beeping overnight',
  category: 'Equipment',
  priority: 'high',
  status: 'in_progress',
  relatedAssetId: 'obj-1',
  relatedAssetName: 'Walk-in cooler',
  createdAt: new Date('2026-09-14T10:00:00.000Z'),
  updatedAt: new Date('2026-09-15T08:30:00.000Z'),
}

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderDetail(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/service-requests/:id" element={<ServiceRequestDetailPage />} />
        <Route path="/service-requests" element={<LocationProbe />} />
        <Route path="/assets/:id" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  )
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ServiceRequestDetailPage', () => {
  it('shows request fields, status, priority, and a link to the related asset', async () => {
    vi.spyOn(apiService, 'getServiceRequest').mockResolvedValue({ serviceRequest: sample })
    renderDetail('/service-requests/sr-1')

    expect(await screen.findByRole('heading', { name: 'Cooler alarm' })).toBeInTheDocument()
    expect(screen.getByText('Equipment')).toBeInTheDocument()
    expect(screen.getByText('Beeping overnight')).toBeInTheDocument()
    expect(screen.getAllByText('high').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('in progress').length).toBeGreaterThanOrEqual(1)

    const assetLink = screen.getByRole('link', { name: 'Walk-in cooler' })
    expect(assetLink).toHaveAttribute('href', '/assets/obj-1')
  })

  it('keeps the related asset clickable when the name is missing', async () => {
    vi.spyOn(apiService, 'getServiceRequest').mockResolvedValue({
      serviceRequest: { ...sample, relatedAssetName: null },
    })
    renderDetail('/service-requests/sr-1')

    expect(await screen.findByRole('heading', { name: 'Cooler alarm' })).toBeInTheDocument()
    const assetLink = screen.getByRole('link', { name: 'Related asset' })
    expect(assetLink).toHaveAttribute('href', '/assets/obj-1')
    fireEvent.click(assetLink)
    expect(await screen.findByTestId('location')).toHaveTextContent('/assets/obj-1')
  })

  it('shows a placeholder when no related asset is linked', async () => {
    vi.spyOn(apiService, 'getServiceRequest').mockResolvedValue({
      serviceRequest: { ...sample, relatedAssetId: null, relatedAssetName: null },
    })
    renderDetail('/service-requests/sr-1')

    expect(await screen.findByText('None — can be linked later')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Related asset' })).not.toBeInTheDocument()
  })

  it('navigates to the related asset from the named link', async () => {
    vi.spyOn(apiService, 'getServiceRequest').mockResolvedValue({ serviceRequest: sample })
    renderDetail('/service-requests/sr-1')

    fireEvent.click(await screen.findByRole('link', { name: 'Walk-in cooler' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/assets/obj-1')
  })

  it('shows a loading state while the request is fetching', () => {
    vi.spyOn(apiService, 'getServiceRequest').mockReturnValue(new Promise(() => {}))
    renderDetail('/service-requests/sr-1')

    expect(screen.getByRole('status', { name: 'Loading service request' })).toBeInTheDocument()
  })

  it('handles a missing request with a not-found state and back action', async () => {
    vi.spyOn(apiService, 'getServiceRequest').mockRejectedValue(
      Object.assign(new Error('Service request not found'), { status: 404 })
    )
    renderDetail('/service-requests/missing')

    expect(await screen.findByText('Service request not found')).toBeInTheDocument()
    const backButtons = screen.getAllByRole('button', { name: 'Back to list' })
    expect(backButtons.length).toBeGreaterThanOrEqual(1)
    fireEvent.click(backButtons[backButtons.length - 1])
    expect(await screen.findByTestId('location')).toHaveTextContent('/service-requests')
  })

  it('shows an error state when the request API fails', async () => {
    vi.spyOn(apiService, 'getServiceRequest').mockRejectedValue(
      Object.assign(new Error('Could not load service request.'), { status: 500 })
    )
    renderDetail('/service-requests/sr-1')

    expect(await screen.findByText("Couldn't load service request")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('retries after a load error', async () => {
    const getServiceRequest = vi
      .spyOn(apiService, 'getServiceRequest')
      .mockRejectedValueOnce(Object.assign(new Error('Could not load service request.'), { status: 500 }))
      .mockResolvedValueOnce({ serviceRequest: sample })
    renderDetail('/service-requests/sr-1')

    expect(await screen.findByText("Couldn't load service request")).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByRole('heading', { name: 'Cooler alarm' })).toBeInTheDocument()
    expect(getServiceRequest).toHaveBeenCalledTimes(2)
  })

  it('updates status and priority from the detail controls and shows the new timestamp', async () => {
    vi.spyOn(apiService, 'getServiceRequest').mockResolvedValue({ serviceRequest: sample })
    const afterStatus: ServiceRequest = {
      ...sample,
      status: 'resolved',
      updatedAt: new Date('2026-09-15T12:00:00.000Z'),
    }
    const afterPriority: ServiceRequest = {
      ...afterStatus,
      priority: 'urgent',
      updatedAt: new Date('2026-09-15T12:05:00.000Z'),
    }
    const updateServiceRequest = vi
      .spyOn(apiService, 'updateServiceRequest')
      .mockResolvedValueOnce({ serviceRequest: afterStatus })
      .mockResolvedValueOnce({ serviceRequest: afterPriority })
    renderDetail('/service-requests/sr-1')

    const statusSelect = await screen.findByLabelText('Status')
    const prioritySelect = screen.getByLabelText('Priority')
    expect(statusSelect).toHaveValue('in_progress')
    expect(prioritySelect).toHaveValue('high')

    fireEvent.change(statusSelect, { target: { value: 'resolved' } })
    await waitFor(() => {
      expect(updateServiceRequest).toHaveBeenCalledWith('sr-1', { status: 'resolved' })
    })
    expect(statusSelect).toHaveValue('resolved')
    expect(screen.getByText(afterStatus.updatedAt.toLocaleString())).toBeInTheDocument()

    fireEvent.change(prioritySelect, { target: { value: 'urgent' } })
    await waitFor(() => {
      expect(updateServiceRequest).toHaveBeenCalledWith('sr-1', { priority: 'urgent' })
    })
    expect(prioritySelect).toHaveValue('urgent')
    expect(screen.getByText(afterPriority.updatedAt.toLocaleString())).toBeInTheDocument()
  })

  it('reverts status and priority when the update fails', async () => {
    vi.spyOn(apiService, 'getServiceRequest').mockResolvedValue({ serviceRequest: sample })
    const updateServiceRequest = vi.spyOn(apiService, 'updateServiceRequest').mockRejectedValue(
      Object.assign(new Error('Could not update service request.'), { status: 500 })
    )
    renderDetail('/service-requests/sr-1')

    const statusSelect = await screen.findByLabelText('Status')
    fireEvent.change(statusSelect, { target: { value: 'closed' } })

    await waitFor(() => {
      expect(updateServiceRequest).toHaveBeenCalledWith('sr-1', { status: 'closed' })
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('The server had a problem')
    expect(statusSelect).toHaveValue('in_progress')
    expect(screen.getByLabelText('Priority')).toHaveValue('high')
  })
})
