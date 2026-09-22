import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { Upload, FileText, CheckCircle, X, Sheet, Edit3 } from 'lucide-react'
import { googleSheetsService, loadGoogleAPIs, type GoogleSheet } from '@/services/googleSheetsService'
import { getAssetImportSnapshot, startAssetImport } from '@/lib/assetImportJob'
import { assessCsvFormat, CSV_MAX_BYTES, idleCsvChecks, type CsvFormatChecks } from '@/lib/csvFormatChecks'
import { toUserMessage } from '@/lib/userFacingError'
import { CsvMapError, mapCsvRowsToAssets, parseCsv, type MappedAssetRow } from '@/lib/parseCsv'
import { AssetImportPreview } from './AssetImportPreview'
import { CsvFormatTips } from './CsvFormatTips'
import { ManualDataEntry } from './ManualDataEntry'

interface DataImportProps {
  vertical: string
}

export function DataImport({ vertical }: DataImportProps) {
  const navigate = useNavigate()
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [ready, setReady] = useState<MappedAssetRow[]>([])
  const [skipped, setSkipped] = useState(0)
  const [ignored, setIgnored] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checks, setChecks] = useState<CsvFormatChecks>(idleCsvChecks)
  const [importMethod, setImportMethod] = useState<'csv' | 'sheets' | 'manual'>('csv')

  // Google Sheets state
  const [sheetsLoading, setSheetsLoading] = useState(false)
  const [sheetsError, setSheetsError] = useState<string | null>(null)
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false)
  const [spreadsheets, setSpreadsheets] = useState<GoogleSheet[]>([])
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const clearMapped = () => {
    setReady([])
    setSkipped(0)
    setIgnored([])
  }

  const applyTable = (headers: string[], rows: string[][]) => {
    try {
      const mapped = mapCsvRowsToAssets({ headers, rows })
      setReady(mapped.ready)
      setSkipped(mapped.skipped)
      setIgnored(mapped.ignoredHeaders)
      setError(mapped.ready.length === 0 ? 'No rows with a name to import.' : null)
    } catch (err) {
      clearMapped()
      setError(
        err instanceof CsvMapError
          ? err.message
          : toUserMessage(err) || 'We could not read that CSV file. Please try another file.'
      )
    }
  }

  const runImport = () => {
    if (ready.length === 0 || getAssetImportSnapshot().status === 'running') return
    startAssetImport(ready, skipped)
    navigate('/assets')
  }

  // Initialize Google Sheets on component mount
  React.useEffect(() => {
    const initializeGoogleSheets = async () => {
      try {
        await loadGoogleAPIs()
        const signedIn = await googleSheetsService.initializeAuth()
        setIsGoogleSignedIn(signedIn)
      } catch (error) {
        console.error('Failed to initialize Google Sheets:', error)
      }
    }

    if (importMethod === 'sheets') {
      initializeGoogleSheets()
    }
  }, [importMethod])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file')
      setUploadedFile(null)
      clearMapped()
      setChecks(assessCsvFormat(file))
      return
    }

    if (file.size > CSV_MAX_BYTES) {
      setError('File size must be less than 10MB')
      setUploadedFile(null)
      clearMapped()
      setChecks(assessCsvFormat(file))
      return
    }

    setUploadedFile(file)
    setError(null)
    clearMapped()
    setLoading(true)

    try {
      const text = await file.text()
      setChecks(assessCsvFormat(file, text))
      const { headers, rows } = parseCsv(text)
      applyTable(headers, rows)
    } catch (err) {
      clearMapped()
      setError(toUserMessage(err) || 'We could not read that CSV file. Please try another file.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setSheetsLoading(true)
      setSheetsError(null)

      const success = await googleSheetsService.signIn()
      if (success) {
        setIsGoogleSignedIn(true)
        // Load spreadsheets after successful sign in
        await loadSpreadsheets()
      }
    } catch (error) {
      setSheetsError(toUserMessage(error))
      console.error('Google sign in error:', error)
    } finally {
      setSheetsLoading(false)
    }
  }

  const loadSpreadsheets = async () => {
    try {
      setSheetsLoading(true)
      setSheetsError(null)

      const sheets = await googleSheetsService.getSpreadsheets()
      setSpreadsheets(sheets)
    } catch (error) {
      setSheetsError(toUserMessage(error))
      console.error('Load spreadsheets error:', error)
    } finally {
      setSheetsLoading(false)
    }
  }

  const handleSpreadsheetSelect = async (spreadsheetId: string) => {
    try {
      setSheetsLoading(true)
      setSheetsError(null)

      setSelectedSpreadsheet(spreadsheetId)
      const data = await googleSheetsService.getSheetData(spreadsheetId)
      const csvData = googleSheetsService.convertToCSVData(data, 'Google Sheet')
      applyTable(csvData.headers, csvData.rows)
    } catch (error) {
      setSheetsError(toUserMessage(error))
      console.error('Load sheet data error:', error)
    } finally {
      setSheetsLoading(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const clearData = () => {
    setUploadedFile(null)
    clearMapped()
    setError(null)
    setChecks(idleCsvChecks())
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center text-slate-900 dark:text-foreground">
          <Upload className="h-5 w-5 mr-2" />
          Import Your Data
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-muted-foreground">
          Upload a CSV file or connect to Google Sheets to import your {vertical === 'retail' ? 'products' : vertical === 'restaurant' ? 'menu items' : 'inventory items'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 bg-slate-100 dark:bg-muted p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setImportMethod('csv')}
            className={`
              flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all flex-1
              ${importMethod === 'csv'
                ? 'bg-white dark:bg-card text-blue-700 dark:text-foreground shadow-sm dark:border dark:border-border'
                : 'text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground'
              }
            `}
          >
            <Upload className="h-4 w-4" />
            <span>CSV Upload</span>
          </button>
          <button
            type="button"
            onClick={() => setImportMethod('sheets')}
            className={`
              flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all flex-1
              ${importMethod === 'sheets'
                ? 'bg-white dark:bg-card text-blue-700 dark:text-foreground shadow-sm dark:border dark:border-border'
                : 'text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground'
              }
            `}
          >
            <Sheet className="h-4 w-4" />
            <span>Google Sheets</span>
          </button>
          <button
            type="button"
            onClick={() => setImportMethod('manual')}
            className={`
              flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all flex-1
              ${importMethod === 'manual'
                ? 'bg-white dark:bg-card text-blue-700 dark:text-foreground shadow-sm dark:border dark:border-border'
                : 'text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground'
              }
            `}
          >
            <Edit3 className="h-4 w-4" />
            <span>Manual Entry</span>
          </button>
        </div>

        {/* CSV Upload Section */}
        {importMethod === 'csv' && (
          <>
            {/* Upload Area */}
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${dragActive
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                }
              `}
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
                onChange={handleFileInput}
                className="hidden"
              />

              {uploadedFile ? (
                <div className="space-y-4">
                  <div
                    className={`flex items-center justify-center space-x-2 ${
                      error || ready.length === 0 ? 'text-slate-600 dark:text-slate-300' : 'text-green-600'
                    }`}
                  >
                    {error || ready.length === 0 ? (
                      <FileText className="h-8 w-8" />
                    ) : (
                      <CheckCircle className="h-8 w-8" />
                    )}
                    <span className="font-medium">{uploadedFile.name}</span>
                  </div>
                  <Button variant="outline" onClick={clearData}>
                    <X className="h-4 w-4 mr-2" />
                    Remove File
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <FileText className="h-12 w-12 text-slate-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                      Drop your CSV file here
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      or click to browse
                    </p>
                  </div>
                  <Button onClick={handleUploadClick}>
                    Select CSV File
                  </Button>
                </div>
              )}
            </div>

            {loading && (
              <LoadingState label="Processing your CSV file…" className="py-8" />
            )}

          </>
        )}

        {/* Google Sheets Section */}
        {importMethod === 'sheets' && (
          <div className="space-y-4">
            {!isGoogleSignedIn ? (
              <div className="text-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                <Sheet className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Connect your Google Sheets to import data directly
                </p>
                <Button onClick={handleGoogleSignIn} disabled={sheetsLoading}>
                  {sheetsLoading ? 'Connecting...' : 'Connect Google Sheets'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Select a Spreadsheet</h3>
                  <Button variant="outline" size="sm" onClick={loadSpreadsheets} disabled={sheetsLoading}>
                    Refresh
                  </Button>
                </div>

                {sheetsLoading ? (
                  <LoadingState label="Loading spreadsheets…" className="py-8" />
                ) : spreadsheets.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {spreadsheets.map((sheet) => (
                      <div
                        key={sheet.id}
                        className={`
                          p-3 border rounded-lg cursor-pointer transition-colors
                          ${selectedSpreadsheet === sheet.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }
                        `}
                        onClick={() => handleSpreadsheetSelect(sheet.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{sheet.name}</p>
                            <p className="text-xs text-slate-500">
                              Modified: {new Date(sheet.modifiedTime).toLocaleDateString()}
                            </p>
                          </div>
                          {selectedSpreadsheet === sheet.id && (
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Sheet className="h-6 w-6 text-slate-500" />}
                    title="No spreadsheets found"
                    description="Create a spreadsheet in Google Sheets first, then refresh this list."
                    className="py-8"
                  />
                )}

                {sheetsError && (
                  <ErrorState
                    title="Could not load Google Sheets"
                    message={sheetsError}
                    onRetry={loadSpreadsheets}
                    className="py-6"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Manual Entry Section */}
        {importMethod === 'manual' && (
          <ManualDataEntry
            vertical={vertical}
            onItemsAdded={(items) => {
              const headers = ['name', 'description', 'price', 'quantity', 'category']
              const rows = items.map(item => [
                item.name,
                item.description || '',
                item.price?.toString() || '',
                item.quantity?.toString() || '',
                item.category || ''
              ])
              applyTable(headers, rows)
            }}
          />
        )}

        {error && !loading ? (
          <ErrorState
            title="Could not import that file"
            message={error}
            className="py-6"
          />
        ) : null}

        {ready.length > 0 && !loading && !error ? (
          <AssetImportPreview
            ready={ready}
            skipped={skipped}
            ignoredHeaders={ignored}
            onImport={runImport}
            disabled={getAssetImportSnapshot().status === 'running'}
          />
        ) : null}

        {importMethod === 'csv' ? (
          <CsvFormatTips checks={checks} />
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              {importMethod === 'sheets' ? 'Google Sheets Tips:' : 'Manual Entry Tips:'}
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              {importMethod === 'sheets' ? (
                <>
                  <li>• Make sure your Google Sheet is shared or public</li>
                  <li>• First row should contain column headers</li>
                  <li>• Only reads the first sheet in your workbook</li>
                  <li>• Real-time sync with your Google Sheets</li>
                </>
              ) : (
                <>
                  <li>• Add items one by one for precise control</li>
                  <li>• Click any item to edit its details</li>
                  <li>• Use categories to organize your items</li>
                  <li>• Price and quantity are optional fields</li>
                </>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
