import { mapCsvRowsToAssets, parseCsv } from '@/lib/parseCsv'

export const CSV_MAX_BYTES = 10 * 1024 * 1024

export type CsvTipId = 'headers' | 'name' | 'optional' | 'size' | 'commas'

export type CsvTipState = 'idle' | 'pass' | 'fail'

export type CsvFormatChecks = Record<CsvTipId, CsvTipState>

export function idleCsvChecks(): CsvFormatChecks {
  return {
    headers: 'idle',
    name: 'idle',
    optional: 'idle',
    size: 'idle',
    commas: 'idle',
  }
}

export function assessCsvFormat(
  file: { name: string; size: number },
  text?: string
): CsvFormatChecks {
  const checks = idleCsvChecks()
  checks.size = file.size > CSV_MAX_BYTES ? 'fail' : 'pass'

  if (!file.name.toLowerCase().endsWith('.csv')) {
    checks.commas = 'fail'
    return checks
  }

  if (checks.size === 'fail' || text == null) return checks

  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) ?? ''
  const commaCount = (firstLine.match(/,/g) ?? []).length
  const semicolonCount = (firstLine.match(/;/g) ?? []).length
  checks.commas = semicolonCount > 0 && commaCount === 0 ? 'fail' : 'pass'

  let table
  try {
    table = parseCsv(text)
  } catch {
    checks.headers = 'fail'
    checks.name = 'fail'
    return checks
  }

  const hasHeader = table.headers.some((header) => header.trim())
  checks.headers = hasHeader ? 'pass' : 'fail'
  if (!hasHeader) {
    checks.name = 'fail'
    return checks
  }

  checks.optional = 'pass'
  try {
    const mapped = mapCsvRowsToAssets(table)
    checks.name = mapped.ready.length > 0 ? 'pass' : 'fail'
  } catch {
    checks.name = 'fail'
  }

  return checks
}
