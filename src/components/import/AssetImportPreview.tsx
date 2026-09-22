import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { MappedAssetRow } from '@/lib/parseCsv'

const PREVIEW_LIMIT = 20

export function AssetImportPreview({
  ready,
  skipped,
  ignoredHeaders,
  onImport,
  disabled,
}: {
  ready: MappedAssetRow[]
  skipped: number
  ignoredHeaders: string[]
  onImport: () => void
  disabled?: boolean
}) {
  const previewRows = ready.slice(0, PREVIEW_LIMIT)

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {ready.length} will be imported
        {skipped > 0 ? `, ${skipped} skipped (missing name)` : ''}.
        {ready.length > PREVIEW_LIMIT ? ` Showing the first ${PREVIEW_LIMIT} rows.` : ''}
      </p>
      {ignoredHeaders.length > 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Not imported: {ignoredHeaders.join(', ')}.
        </p>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Min qty</TableHead>
            <TableHead>Unit cost</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {previewRows.map((row, index) => (
            <TableRow key={`${row.name}-${index}`}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.sku || '—'}</TableCell>
              <TableCell>{row.category || '—'}</TableCell>
              <TableCell>{row.quantity ?? 0}</TableCell>
              <TableCell>{row.minQuantity ?? 0}</TableCell>
              <TableCell>{row.unitCost == null ? '—' : row.unitCost}</TableCell>
              <TableCell>{row.supplier || '—'}</TableCell>
              <TableCell>{row.location || '—'}</TableCell>
              <TableCell className="max-w-[16rem] truncate">{row.description || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={onImport} disabled={disabled}>
          Import {ready.length} {ready.length === 1 ? 'item' : 'items'}
        </Button>
      </div>
    </div>
  )
}
