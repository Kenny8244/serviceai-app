import { cn } from '@/lib/utils'
import type { CsvFormatChecks, CsvTipId, CsvTipState } from '@/lib/csvFormatChecks'

const TIPS: { id: CsvTipId; label: string }[] = [
  { id: 'headers', label: 'First row should contain column headers' },
  {
    id: 'name',
    label: 'Name column: name, product_name, item_name, asset_name, title, product, or item',
  },
  {
    id: 'optional',
    label: 'Optional: sku, asset_id, category, quantity, price, supplier, location, description',
  },
  { id: 'size', label: 'Maximum file size: 10MB' },
  { id: 'commas', label: 'Use commas as separators' },
]

function tipClass(status: CsvTipState): string {
  if (status === 'fail') {
    return 'rounded bg-red-100 font-medium text-red-700 dark:bg-red-950/50 dark:text-red-300'
  }
  if (status === 'pass') {
    return 'rounded bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
  }
  return 'text-blue-800 dark:text-blue-200'
}

export function CsvFormatTips({ checks }: { checks: CsvFormatChecks }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
      <h4 className="mb-2 font-medium text-blue-900 dark:text-blue-100">CSV Format Tips:</h4>
      <ul className="space-y-1 text-sm">
        {TIPS.map((tip) => (
          <li
            key={tip.id}
            data-tip={tip.id}
            data-status={checks[tip.id]}
            className={cn('px-1', tipClass(checks[tip.id]))}
          >
            • {tip.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
