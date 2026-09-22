import { describe, expect, it } from 'vitest'
import { assessCsvFormat } from '@/lib/csvFormatChecks'

describe('assessCsvFormat', () => {
  it('marks a missing name column as failed and the other checks as passed', () => {
    const checks = assessCsvFormat(
      { name: 'items.csv', size: 40 },
      'sku,quantity\nSKU-1,2\n'
    )
    expect(checks).toEqual({
      headers: 'pass',
      name: 'fail',
      optional: 'pass',
      size: 'pass',
      commas: 'pass',
    })
  })

  it('passes every check for a usable file', () => {
    const checks = assessCsvFormat(
      { name: 'items.csv', size: 80 },
      'asset_id,name,category\nRET-1,Widget,Footwear\n'
    )
    expect(checks.name).toBe('pass')
    expect(checks.headers).toBe('pass')
  })

  it('fails the size check without reading the rest', () => {
    const checks = assessCsvFormat({ name: 'items.csv', size: 11 * 1024 * 1024 })
    expect(checks.size).toBe('fail')
    expect(checks.name).toBe('idle')
    expect(checks.headers).toBe('idle')
  })

  it('fails comma separators when the file uses semicolons', () => {
    const checks = assessCsvFormat(
      { name: 'items.csv', size: 30 },
      'name;sku\nWidget;A-1\n'
    )
    expect(checks.commas).toBe('fail')
    expect(checks.name).toBe('fail')
  })
})
