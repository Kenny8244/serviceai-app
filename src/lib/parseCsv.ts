export type CsvTable = {
  headers: string[]
  rows: string[][]
}

export type AssetCsvField =
  | 'name'
  | 'sku'
  | 'category'
  | 'quantity'
  | 'minQuantity'
  | 'unitCost'
  | 'supplier'
  | 'location'
  | 'description'

export type MappedAssetRow = {
  name: string
  sku?: string
  category?: string
  quantity?: number
  minQuantity?: number
  unitCost?: number | null
  supplier?: string
  location?: string
  description?: string
}

const FIELD_ALIASES: Record<AssetCsvField, string[]> = {
  name: ['name', 'title', 'product', 'item'],
  sku: ['sku', 'code', 'article'],
  category: ['category', 'type'],
  quantity: ['quantity', 'qty', 'stock'],
  minQuantity: ['min_quantity', 'minquantity', 'reorder', 'minimum'],
  unitCost: ['unit_cost', 'unitcost', 'cost', 'price'],
  supplier: ['supplier', 'vendor'],
  location: ['location', 'warehouse'],
  description: ['description', 'notes'],
}

export const CSV_NAME_HINT =
  'Add a name column (name, title, product, or item). Optional: sku, category, quantity, min_quantity, unit_cost, supplier, location, description.'

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/['"]/g, '').replace(/\s+/g, '_')
}

function parseLine(line: string): string[] {
  return line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''))
}

export function parseCsv(text: string): CsvTable {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length === 0) {
    throw new Error('CSV file is empty')
  }

  const headers = parseLine(lines[0].replace(/^\uFEFF/, ''))
  const rows = lines.slice(1).map(parseLine)
  return { headers, rows }
}

export function columnIndexMap(headers: string[]): Partial<Record<AssetCsvField, number>> {
  const map: Partial<Record<AssetCsvField, number>> = {}
  const normalized = headers.map(normalizeHeader)

  for (const [field, aliases] of Object.entries(FIELD_ALIASES) as [AssetCsvField, string[]][]) {
    const index = normalized.findIndex((header) => aliases.includes(header))
    if (index >= 0) map[field] = index
  }

  return map
}

function cell(row: string[], index: number | undefined): string {
  if (index == null) return ''
  return (row[index] ?? '').trim()
}

function parseNumber(value: string): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function mapCsvRowsToAssets(table: CsvTable): {
  ready: MappedAssetRow[]
  skipped: number
} {
  const columns = columnIndexMap(table.headers)
  if (columns.name == null) {
    throw new Error(CSV_NAME_HINT)
  }

  const ready: MappedAssetRow[] = []
  let skipped = 0

  for (const row of table.rows) {
    const name = cell(row, columns.name)
    if (!name) {
      skipped += 1
      continue
    }

    const unitCostRaw = cell(row, columns.unitCost)
    ready.push({
      name,
      sku: cell(row, columns.sku) || undefined,
      category: cell(row, columns.category) || undefined,
      quantity: parseNumber(cell(row, columns.quantity)) ?? 0,
      minQuantity: parseNumber(cell(row, columns.minQuantity)) ?? 0,
      unitCost: unitCostRaw === '' ? null : parseNumber(unitCostRaw) ?? null,
      supplier: cell(row, columns.supplier) || undefined,
      location: cell(row, columns.location) || undefined,
      description: cell(row, columns.description) || undefined,
    })
  }

  return { ready, skipped }
}
