import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, RefreshCw, Search, Sheet, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getAssetImportSnapshot, reportImportProgress, startBackgroundImport, subscribeAssetImport } from '@/lib/assetImportJob'
import { toUserMessage } from '@/lib/userFacingError'
import {
  apiService,
  type GoogleSheetStatus,
  type GoogleSpreadsheetOption,
} from '@/services/api'

type GoogleSheetSyncPanelProps = {
  onImported: () => void
}

function formatSyncTime(value: string | null): string {
  if (!value) return 'Not synced yet'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not synced yet'
  return date.toLocaleString()
}

function sheetSummary(status: GoogleSheetStatus): string {
  if (!status.lastResult) return status.lastError ?? 'Sync finished.'
  const { created, updated, skipped } = status.lastResult
  return `Added ${created}, updated ${updated}, skipped ${skipped}.`
}

function resultLine(status: GoogleSheetStatus): string | null {
  if (!status.lastResult) return null
  const { created, updated, skipped } = status.lastResult
  return `Added ${created}, updated ${updated}, skipped ${skipped}.`
}

export function GoogleSheetSyncPanel({ onImported }: GoogleSheetSyncPanelProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [status, setStatus] = useState<GoogleSheetStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [spreadsheets, setSpreadsheets] = useState<GoogleSpreadsheetOption[]>([])
  const [tabs, setTabs] = useState<string[]>([])
  const [spreadsheetId, setSpreadsheetId] = useState('')
  const [sheetName, setSheetName] = useState('')
  const [query, setQuery] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const importSnap = useSyncExternalStore(subscribeAssetImport, getAssetImportSnapshot)
  const importRunning = importSnap.status === 'running'

  const sheetsFlag = searchParams.get('sheets')
  const picking = sheetsFlag === 'pick' || (status?.connected && !status.spreadsheetId)

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true)
      const next = await apiService.getGoogleSheetStatus()
      setStatus(next)
      setError(null)
    } catch (err) {
      setError(toUserMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  useEffect(() => {
    if (sheetsFlag !== 'error') return
    const message = searchParams.get('message') || 'Could not connect Google Sheets.'
    setError(message)
  }, [sheetsFlag, searchParams])

  useEffect(() => {
    if (sheetsFlag === 'pick' && status?.connected) setPickerOpen(true)
  }, [sheetsFlag, status?.connected])

  useEffect(() => {
    if (!pickerOpen || !status?.connected) return
    let cancelled = false
    ;(async () => {
      try {
        setBusy(true)
        const { spreadsheets: files } = await apiService.listGoogleSpreadsheets()
        if (cancelled) return
        setSpreadsheets(files)
        setError(null)
      } catch (err) {
        if (!cancelled) setError(toUserMessage(err))
      } finally {
        if (!cancelled) setBusy(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pickerOpen, status?.connected])

  const clearSheetsQuery = () => {
    if (!searchParams.has('sheets')) return
    const next = new URLSearchParams(searchParams)
    next.delete('sheets')
    next.delete('message')
    setSearchParams(next, { replace: true })
  }

  const handleConnect = async () => {
    try {
      setBusy(true)
      setError(null)
      const { url } = await apiService.connectGoogleSheet()
      window.location.assign(url)
    } catch (err) {
      setError(toUserMessage(err))
      setBusy(false)
    }
  }

  const handleSpreadsheet = async (id: string) => {
    setSpreadsheetId(id)
    setSheetName('')
    setTabs([])
    if (!id) return
    try {
      setBusy(true)
      const { sheets } = await apiService.listGoogleSheetTabs(id)
      setTabs(sheets)
      setSheetName(sheets[0] ?? '')
      setError(null)
    } catch (err) {
      setError(toUserMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const runSheetBatches = (
    label: string,
    first: () => Promise<GoogleSheetStatus>
  ) => {
    const started = startBackgroundImport({
      label,
      run: async () => {
        let next = await first()
        setStatus(next)
        reportImportProgress(next.syncProcessed, next.syncTotal)
        onImported()
        while (!next.syncDone && !next.lastError) {
          next = await apiService.syncGoogleSheet({ continue: true })
          setStatus(next)
          reportImportProgress(next.syncProcessed, next.syncTotal)
          onImported()
        }
        return { summary: sheetSummary(next), error: next.lastError }
      },
    })
    if (!started) setError('An import is already running.')
    return started
  }

  const handleLink = () => {
    const spreadsheet = spreadsheets.find((file) => file.id === spreadsheetId)
    if (!spreadsheet || !sheetName) return
    const started = runSheetBatches('Importing from Google Sheet…', () =>
      apiService.linkGoogleSheet({
        spreadsheetId: spreadsheet.id,
        spreadsheetName: spreadsheet.name,
        sheetName,
      })
    )
    if (!started) return
    setError(null)
    setPickerOpen(false)
    clearSheetsQuery()
  }

  const handleSync = () => {
    if (!runSheetBatches('Syncing Google Sheet…', () => apiService.syncGoogleSheet())) return
  }

  const closePicker = () => {
    setPickerOpen(false)
    clearSheetsQuery()
  }

  const handleDisconnect = async () => {
    try {
      setBusy(true)
      setError(null)
      const next = await apiService.disconnectGoogleSheet()
      setStatus(next)
      setSpreadsheets([])
      setTabs([])
      setSpreadsheetId('')
      setSheetName('')
      setQuery('')
      setPickerOpen(false)
      clearSheetsQuery()
    } catch (err) {
      setError(toUserMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Sheet className="h-4 w-4" />
            Google Sheet
          </h2>
          {loading ? (
            <p className="mt-1 text-sm text-slate-500">Checking connection…</p>
          ) : status && !status.configured ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Google Sheets is not configured.
            </p>
          ) : status?.connected && status.spreadsheetName && status.sheetName && !picking ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {status.spreadsheetName} · {status.sheetName}
              <span className="mt-0.5 block text-xs text-slate-500">
                Last sync {formatSyncTime(status.lastSyncAt)}
                {resultLine(status) ? ` · ${resultLine(status)}` : ''}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Import inventory from a sheet. Matching rows update every 10 minutes. Rows missing from the sheet stay in inventory.
            </p>
          )}
          {error && !pickerOpen ? (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {status?.configured && !status.connected ? (
            <Button type="button" onClick={() => void handleConnect()} disabled={busy}>
              Connect Google Sheet
            </Button>
          ) : null}
          {status?.connected && status.spreadsheetId && !picking ? (
            <>
              <Button type="button" variant="outline" onClick={handleSync} disabled={busy || importRunning}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync now
              </Button>
              <Button type="button" variant="outline" onClick={() => void handleDisconnect()} disabled={busy}>
                Disconnect
              </Button>
            </>
          ) : null}
          {status?.connected && !status.spreadsheetId ? (
            <>
              <Button type="button" onClick={() => setPickerOpen(true)} disabled={busy}>
                Choose spreadsheet
              </Button>
              <Button type="button" variant="outline" onClick={() => void handleDisconnect()} disabled={busy}>
                Disconnect
              </Button>
            </>
          ) : null}
        </div>
      </div>
      {pickerOpen && status?.connected ? (
        <SheetPicker
          spreadsheets={spreadsheets}
          spreadsheetId={spreadsheetId}
          tabs={tabs}
          sheetName={sheetName}
          query={query}
          busy={busy}
          importRunning={importRunning}
          error={error}
          onQuery={setQuery}
          onSpreadsheet={(id) => void handleSpreadsheet(id)}
          onTab={setSheetName}
          onImport={() => void handleLink()}
          onClose={closePicker}
        />
      ) : null}
    </section>
  )
}

function formatModified(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString()
}

function SheetPicker({
  spreadsheets,
  spreadsheetId,
  tabs,
  sheetName,
  query,
  busy,
  importRunning,
  error,
  onQuery,
  onSpreadsheet,
  onTab,
  onImport,
  onClose,
}: {
  spreadsheets: GoogleSpreadsheetOption[]
  spreadsheetId: string
  tabs: string[]
  sheetName: string
  query: string
  busy: boolean
  importRunning: boolean
  error: string | null
  onQuery: (value: string) => void
  onSpreadsheet: (id: string) => void
  onTab: (title: string) => void
  onImport: () => void
  onClose: () => void
}) {
  const needle = query.trim().toLowerCase()
  const visible = needle
    ? spreadsheets.filter((file) => file.name.toLowerCase().includes(needle))
    : spreadsheets
  const selected = spreadsheets.find((file) => file.id === spreadsheetId)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose()
      }}
    >
    <Card
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-picker-title"
      className="flex max-h-[85vh] w-full max-w-lg flex-col p-6"
    >
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 id="sheet-picker-title" className="text-lg font-semibold">Choose a spreadsheet</h2>
        <p className="mt-1 text-sm text-slate-500">Pick a file, then the tab to import.</p>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close" disabled={busy}>
        <X className="h-4 w-4" />
      </Button>
    </div>
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
      <label className="block text-sm text-slate-700 dark:text-slate-200">
        Spreadsheet
        <span className="relative mt-1 block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search spreadsheets"
            aria-label="Search spreadsheets"
            className="pl-9"
            disabled={busy && spreadsheets.length === 0}
          />
        </span>
      </label>
      <div
        className="max-h-64 overflow-y-auto rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
        role="listbox"
        aria-label="Spreadsheets"
      >
        {spreadsheets.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-slate-500">
            {busy ? 'Loading spreadsheets…' : 'No spreadsheets found in this Google account.'}
          </p>
        ) : visible.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-slate-500">No spreadsheets match that search.</p>
        ) : (
          visible.map((file) => {
            const active = file.id === spreadsheetId
            const modified = formatModified(file.modifiedTime)
            return (
              <button
                key={file.id}
                type="button"
                role="option"
                aria-selected={active}
                disabled={busy}
                onClick={() => onSpreadsheet(file.id)}
                className={`flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2 text-left last:border-b-0 dark:border-slate-700 ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/60'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {file.name}
                  </span>
                  {modified ? (
                    <span className="block text-xs text-slate-500">Modified {modified}</span>
                  ) : null}
                </span>
                {active ? <Check className="h-4 w-4 shrink-0 text-blue-600" /> : null}
              </button>
            )
          })
        )}
      </div>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>
      ) : null}
      {selected ? (
        <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-slate-700">
          <div className="min-w-0">
            <p className="text-sm text-slate-700 dark:text-slate-200">Tab</p>
            <div className="mt-1 flex flex-wrap gap-1" role="radiogroup" aria-label="Sheet tab">
              {tabs.length === 0 ? (
                <span className="text-sm text-slate-500">{busy ? 'Loading tabs…' : 'This spreadsheet has no tabs.'}</span>
              ) : (
                tabs.map((title) => {
                  const active = title === sheetName
                  return (
                    <button
                      key={title}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={busy}
                      onClick={() => onTab(title)}
                      className={`max-w-full truncate rounded-md border px-3 py-1.5 text-sm ${
                        active
                          ? 'border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-100'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {title}
                    </button>
                  )
                })
              )}
            </div>
          </div>
          <Button type="button" onClick={onImport} disabled={busy || importRunning || !sheetName}>
            Import and sync
          </Button>
        </div>
      ) : null}
    </div>
    </Card>
    </div>
  )
}
