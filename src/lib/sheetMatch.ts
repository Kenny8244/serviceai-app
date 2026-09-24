export type SheetAssetRef = {
  id: string
  name: string
  sku?: string | null
}

function normalizeKey(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

/** Match a sheet row to an existing asset: SKU first, then name. */
export function findSheetAssetMatch<T extends SheetAssetRef>(
  assets: readonly T[],
  row: { name: string; sku?: string | null }
): T | null {
  const sku = normalizeKey(row.sku)
  if (sku) {
    const bySku = assets.find((asset) => normalizeKey(asset.sku) === sku)
    if (bySku) return bySku
  }

  const name = normalizeKey(row.name)
  if (!name) return null
  return assets.find((asset) => normalizeKey(asset.name) === name) ?? null
}
