import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Upload, FileText, CheckCircle, AlertCircle, X, Sheet, Edit3 } from 'lucide-react'
import { googleSheetsService, loadGoogleAPIs, type GoogleSheet } from '@/services/googleSheetsService'
import { ManualDataEntry } from './ManualDataEntry'

interface CSVData {
  headers: string[]
  rows: string[][]
  filename: string
  source?: string
}

interface DataImportProps {
  vertical: string
  onDataImported?: (data: CSVData) => void
}

export function DataImport({ vertical, onDataImported }: DataImportProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<CSVData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importMethod, setImportMethod] = useState<'csv' | 'sheets' | 'manual'>('csv')

  // Google Sheets state
  const [sheetsLoading, setSheetsLoading] = useState(false)
  const [sheetsError, setSheetsError] = useState<string | null>(null)
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false)
  const [spreadsheets, setSpreadsheets] = useState<GoogleSheet[]>([])
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

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
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setUploadedFile(file)
    setError(null)
    setLoading(true)

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())

      if (lines.length === 0) {
        throw new Error('CSV file is empty')
      }

      // Parse CSV (simple implementation)
      const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''))
      const rows = lines.slice(1).map(line => {
        return line.split(',').map(cell => cell.trim().replace(/"/g, ''))
      })

      const csvData: CSVData = {
        headers,
        rows,
        filename: file.name,
        source: 'csv'
      }

      setCsvData(csvData)
      onDataImported?.(csvData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file')
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
      setSheetsError('Failed to sign in to Google')
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
      setSheetsError('Failed to load spreadsheets')
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

      // Convert to our format and trigger callback
      const csvData = googleSheetsService.convertToCSVData(data, 'Google Sheet')
      setCsvData(csvData)
      onDataImported?.(csvData)
    } catch (error) {
      setSheetsError('Failed to load sheet data')
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
    setCsvData(null)
    setError(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center text-slate-900 dark:text-slate-100">
          <Upload className="h-5 w-5 mr-2" />
          Import Your Data
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          Upload a CSV file or connect to Google Sheets to import your {vertical === 'retail' ? 'products' : vertical === 'restaurant' ? 'menu items' : 'inventory items'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setImportMethod('csv')}
            className={`
              flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all flex-1
              ${importMethod === 'csv'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
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
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
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
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
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
                onChange={handleFileInput}
                className="hidden"
              />

              {uploadedFile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2 text-green-600">
                    <CheckCircle className="h-8 w-8" />
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

            {/* Loading State */}
            {loading && (
              <Alert>
                <AlertDescription>
                  Processing your CSV file...
                </AlertDescription>
              </Alert>
            )}

            {/* Error State */}
            {error && (
              <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  {error}
                </AlertDescription>
              </Alert>
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
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Loading spreadsheets...</p>
                  </div>
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
                  <div className="text-center py-8 text-slate-500">
                    No spreadsheets found. Create a spreadsheet in Google Sheets first.
                  </div>
                )}

                {sheetsError && (
                  <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      {sheetsError}
                    </AlertDescription>
                  </Alert>
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
              // Convert manual items to CSV format for consistency
              const headers = ['name', 'description', 'price', 'quantity', 'category']
              const rows = items.map(item => [
                item.name,
                item.description || '',
                item.price?.toString() || '',
                item.quantity?.toString() || '',
                item.category || ''
              ])

              const csvData: CSVData = {
                headers,
                rows,
                filename: 'Manual Entry',
                source: 'manual'
              }

              setCsvData(csvData)
              onDataImported?.(csvData)
            }}
          />
        )}

        {/* Data Preview */}
        {csvData && !loading && !error && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Data Preview
              </h3>
              <span className="text-sm text-slate-500">
                {csvData.rows.length} rows × {csvData.headers.length} columns
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {csvData.headers.slice(0, 4).map((header, index) => (
                      <TableHead key={index}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.rows.slice(0, 5).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.slice(0, 4).map((cell, cellIndex) => (
                        <TableCell key={cellIndex} className="truncate max-w-[12rem]">{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {csvData.rows.length > 5 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        ... and {csvData.rows.length - 5} more rows
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>

            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {csvData.source === 'google-sheets' ? 'Google Sheets data' : csvData.source === 'manual' ? 'Manual entry data' : 'CSV file'} processed successfully! Ready to import {csvData.rows.length} items.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            {importMethod === 'csv' ? 'CSV Format Tips:' :
             importMethod === 'sheets' ? 'Google Sheets Tips:' :
             'Manual Entry Tips:'}
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            {importMethod === 'csv' ? (
              <>
                <li>• First row should contain column headers</li>
                <li>• Supported columns: name, description, price, quantity, category</li>
                <li>• Maximum file size: 10MB</li>
                <li>• Use commas as separators</li>
              </>
            ) : importMethod === 'sheets' ? (
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
      </CardContent>
    </Card>
  )
}
