import { describe, expect, it } from 'vitest'
import {
  activityEventLabel,
  createdActivityChange,
  lifecycleActivityChanges,
} from '@/lib/serviceRequestActivity'

describe('serviceRequestActivity', () => {
  it('records creation with the initial status', () => {
    expect(createdActivityChange('open')).toEqual({
      eventType: 'created',
      fromValue: null,
      toValue: 'open',
    })
  })

  it('records status and priority only when the stored value changes', () => {
    expect(
      lifecycleActivityChanges(
        { status: 'open', priority: 'medium' },
        { status: 'in_progress', priority: 'urgent' }
      )
    ).toEqual([
      { eventType: 'status_changed', fromValue: 'open', toValue: 'in_progress' },
      { eventType: 'priority_changed', fromValue: 'medium', toValue: 'urgent' },
    ])
  })

  it('labels status and priority changes', () => {
    expect(
      activityEventLabel({ eventType: 'status_changed', fromValue: 'open', toValue: 'in_progress' })
    ).toBe('Status changed from open to in progress')
    expect(
      activityEventLabel({ eventType: 'priority_changed', fromValue: 'medium', toValue: 'urgent' })
    ).toBe('Priority changed from medium to urgent')
  })

  it('skips unchanged status and priority', () => {
    expect(
      lifecycleActivityChanges(
        { status: 'open', priority: 'low' },
        { status: 'open', priority: 'low' }
      )
    ).toEqual([])
  })
})
