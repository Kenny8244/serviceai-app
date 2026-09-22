import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { AssetImportPreview } from '@/components/import/AssetImportPreview'
import { CsvFormatTips } from '@/components/import/CsvFormatTips'
import { PageShell } from '@/components/layout/PageShell'
import { getAssetImportSnapshot, startAssetImport } from '@/lib/assetImportJob'
import { assessCsvFormat, CSV_MAX_BYTES, idleCsvChecks, type CsvFormatChecks } from '@/lib/csvFormatChecks'
import { CsvMapError, CSV_NAME_HINT, mapCsvRowsToAssets, parseCsv, type MappedAssetRow } from '@/lib/parseCsv'
import { toUserMessage } from '@/lib/userFacingError'

function AssetsImportPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [ready, setReady] = useState<MappedAssetRow[]>([])
  const [skipped, setSkipped] = useState(0)
  const [ignored, setIgnored] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const [checks, setChecks] = useState<CsvFormatChecks>(idleCsvChecks)

  const resetFile = () => {
    setFileName(null)
    setReady([])
    setSkipped(0)
    setIgnored([])
    setError(null)
    setChecks(idleCsvChecks())
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file.')
      setFileName(null)
      setReady([])
      setSkipped(0)
      setIgnored([])
      setChecks(assessCsvFormat(file))
      return
    }

    if (file.size > CSV_MAX_BYTES) {
      setError('File size must be less than 10MB.')
      setFileName(null)
      setReady([])
      setSkipped(0)
      setIgnored([])
      setChecks(assessCsvFormat(file))
      return
    }

    setReading(true)
    setError(null)

    try {
      const text = await file.text()
      setChecks(assessCsvFormat(file, text))
      const table = parseCsv(text)
      const mapped = mapCsvRowsToAssets(table)
      setFileName(file.name)
      setReady(mapped.ready)
      setSkipped(mapped.skipped)
      setIgnored(mapped.ignoredHeaders)
      if (mapped.ready.length === 0) {
        setError('No rows with a name to import.')
      }
    } catch (err) {
      setFileName(file.name)
      setReady([])
      setSkipped(0)
      setIgnored([])
      setError(err instanceof CsvMapError ? err.message : toUserMessage(err) || CSV_NAME_HINT)
    } finally {
      setReading(false)
    }
  }

  const handleDrag = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true)
    } else if (event.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)
    const file = event.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) void handleFile(file)
  }

  const runImport = () => {
    if (ready.length === 0 || getAssetImportSnapshot().status === 'running') return
    startAssetImport(ready, skipped)
    navigate('/assets')
  }

  const canImport = ready.length > 0 && !reading && getAssetImportSnapshot().status !== 'running'

  return (
    <PageShell
      title="Import Data"
      subtitle="Upload a CSV to add products to your asset list."
      actions={
        <Button type="button" variant="outline" onClick={() => navigate('/assets')}>
          Back to assets
        </Button>
      }
    >
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Upload className="mr-2 h-5 w-5" />
              CSV file
            </CardTitle>
            <CardDescription>
              Columns are mapped automatically. {CSV_NAME_HINT}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                aria-label="CSV file"
                className="hidden"
                onChange={handleFileInput}
              />

              {fileName ? (
                <div className="space-y-4">
                  <div
                    className={`flex items-center justify-center space-x-2 ${
                      error ? 'text-slate-600 dark:text-slate-300' : 'text-green-600'
                    }`}
                  >
                    <FileText className="h-8 w-8" />
                    <span className="font-medium text-slate-800 dark:text-slate-100">{fileName}</span>
                  </div>
                  <Button type="button" variant="outline" onClick={resetFile}>
                    <X className="mr-2 h-4 w-4" />
                    Remove file
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <FileText className="mx-auto h-12 w-12 text-slate-400" />
                  <div>
                    <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                      Drop your CSV file here
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">or click to browse</p>
                  </div>
                  <Button type="button" onClick={() => fileInputRef.current?.click()}>
                    Select CSV file
                  </Button>
                </div>
              )}
            </div>

            {reading ? <LoadingState label="Reading CSV…" className="py-6" /> : null}

            {error ? (
              <ErrorState title="Could not import that file" message={error} className="py-6" />
            ) : null}

            {ready.length > 0 ? (
              <AssetImportPreview
                ready={ready}
                skipped={skipped}
                ignoredHeaders={ignored}
                onImport={runImport}
                disabled={!canImport}
              />
            ) : null}

            <CsvFormatTips checks={checks} />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}

export default AssetsImportPage
