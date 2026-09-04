import { useSyncExternalStore } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  dismissAssetImport,
  getAssetImportSnapshot,
  subscribeAssetImport,
} from '@/lib/assetImportJob'

export function ImportProgressPanel() {
  const snapshot = useSyncExternalStore(subscribeAssetImport, getAssetImportSnapshot)

  if (snapshot.status === 'idle') return null

  const running = snapshot.status === 'running'
  const percent = snapshot.total > 0 ? Math.round((snapshot.current / snapshot.total) * 100) : 0

  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 z-50 w-72 rounded-lg border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Import</p>
          {running ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {snapshot.current} of {snapshot.total}
            </p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Imported {snapshot.imported}
              {snapshot.imported === 1 ? ' item' : ' items'}
              {snapshot.failed > 0 ? `, ${snapshot.failed} failed` : ''}
              {snapshot.skipped > 0 ? `, ${snapshot.skipped} skipped` : ''}
            </p>
          )}
        </div>
        {running ? null : (
          <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={dismissAssetImport} aria-label="Dismiss import">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {running ? <Progress value={percent} className="h-1.5" /> : null}
    </div>
  )
}
