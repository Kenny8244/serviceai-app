export const SERVICE_REQUEST_ACTIVITY_TYPES = ['created', 'status_changed', 'priority_changed'] as const

export type ServiceRequestActivityEventType = (typeof SERVICE_REQUEST_ACTIVITY_TYPES)[number]

export type ServiceRequestActivityChange = {
  eventType: ServiceRequestActivityEventType
  fromValue: string | null
  toValue: string | null
}

export type ServiceRequestLifecycle = {
  status: string
  priority: string
}

export function activityEventLabel(change: ServiceRequestActivityChange): string {
  const toLabel = (value: string | null) => (value ? value.replace(/_/g, ' ') : '—')
  if (change.eventType === 'created') return 'Request created'
  if (change.eventType === 'status_changed') {
    return `Status changed from ${toLabel(change.fromValue)} to ${toLabel(change.toValue)}`
  }
  return `Priority changed from ${toLabel(change.fromValue)} to ${toLabel(change.toValue)}`
}

export function createdActivityChange(status: string): ServiceRequestActivityChange {
  return { eventType: 'created', fromValue: null, toValue: status }
}

/** Status and priority events only, and only when the stored value actually changes. */
export function lifecycleActivityChanges(
  previous: ServiceRequestLifecycle,
  next: ServiceRequestLifecycle
): ServiceRequestActivityChange[] {
  const changes: ServiceRequestActivityChange[] = []
  if (next.status !== previous.status) {
    changes.push({
      eventType: 'status_changed',
      fromValue: previous.status,
      toValue: next.status,
    })
  }
  if (next.priority !== previous.priority) {
    changes.push({
      eventType: 'priority_changed',
      fromValue: previous.priority,
      toValue: next.priority,
    })
  }
  return changes
}
