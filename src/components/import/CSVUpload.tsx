import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { onboardingService } from '@/services/onboardingService'
import type { CSVAnalysisResponse } from '@/services/onboardingService'

interface CSVUploadProps {
  onAnalysisComplete?: (analysis: CSVAnalysisResponse) => void
  onSkip?: () => void
}

export function CSVUpload({ onAnalysisComplete, onSkip }: CSVUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [analysis, setAnalysis] = useState<CSVAnalysisResponse | null>(null)
  const [error, setError] = useState<string>('')

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setError('Please select a valid CSV file')
        return
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size must be less than 10MB')
        return
      }
      setSelectedFile(file)
      setError('')
      setAnalysis(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError('')

    try {
      const analysisResult = await onboardingService.analyzeCSV(selectedFile)
      setAnalysis(analysisResult)
      onAnalysisComplete?.(analysisResult)
    } catch (error) {
      console.error('Upload error:', error)
      setError('Failed to analyze CSV file. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSkip = () => {
    onSkip?.()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Your Inventory Data</span>
          </CardTitle>
          <CardDescription>
            Upload a CSV file with your existing inventory data, or skip to use our sample data
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <div className="space-y-4">
                <div className="flex justify-center">
                  {selectedFile ? (
                    <CheckCircle className="h-16 w-16 text-green-500" />
                  ) : (
                    <FileText className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'CSV files up to 10MB'}
                  </p>
                </div>
                <Button variant="outline" className="mt-4">
                  {selectedFile ? 'Change File' : 'Select CSV File'}
                </Button>
              </div>
            </label>
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Analysis Results */}
          {analysis && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium text-green-900">
                    CSV Analysis Complete!
                  </div>
                  <div className="text-sm text-green-700">
                    <div>📊 Found {analysis.analysis.totalRows} rows of data</div>
                    <div>✅ {analysis.analysis.validRows} valid rows ready to import</div>
                    <div>📈 Data quality score: {Math.round(analysis.analysis.dataQuality.completeness * 100)}%</div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleSkip}>
              Skip & Use Sample Data
            </Button>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Analyze CSV
                </>
              )}
            </Button>
          </div>

          {/* File Format Help */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Expected CSV Format:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div><strong>Required columns:</strong> name, category</div>
              <div><strong>Optional columns:</strong> sku, quantity, price, supplier, location, description</div>
              <div><strong>Example:</strong> "iPhone 14","Electronics","IPH14-128",50,799,"Apple Store","Warehouse A","Latest smartphone"</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
