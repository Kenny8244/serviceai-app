import Papa from 'papaparse'
import { CSVImportAnalysis } from '../models/Onboarding'

export class CSVImportService {

  /**
   * Parse and analyze CSV file content
   */
  async parseCSV(fileContent: string): Promise<any[]> {
    try {
      const results = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => {
          // Normalize header names
          return header.toLowerCase().replace(/[^a-z0-9]/g, '_')
        }
      })

      if (results.errors.length > 0) {
        console.warn('CSV parsing warnings:', results.errors)
      }

      return results.data || []
    } catch (error) {
      console.error('Error parsing CSV:', error)
      throw error
    }
  }

  /**
   * Analyze CSV structure and suggest field mappings
   */
  async analyzeCSVStructure(csvData: any[]): Promise<{
    headers: string[]
    rowCount: number
    fieldMapping: Record<string, string>
    suggestedCategories: string[]
    dataQuality: {
      completeness: number
      consistency: number
      accuracy: number
    }
  }> {
    if (!csvData.length) {
      throw new Error('CSV file is empty')
    }

    const headers = Object.keys(csvData[0])
    const rowCount = csvData.length

    // Analyze field mapping suggestions
    const fieldMapping = this.suggestFieldMapping(headers)

    // Analyze data quality
    const dataQuality = this.assessDataQuality(csvData)

    // Suggest categories based on content
    const suggestedCategories = this.suggestCategories(csvData, headers)

    return {
      headers,
      rowCount,
      fieldMapping,
      suggestedCategories,
      dataQuality
    }
  }

  /**
   * Validate CSV data and identify potential issues
   */
  async validateCSVData(csvData: any[]): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
    validRows: number
    totalRows: number
  }> {
    const errors: string[] = []
    const warnings: string[] = []
    let validRows = 0

    if (!csvData.length) {
      errors.push('CSV file is empty')
      return { isValid: false, errors, warnings, validRows: 0, totalRows: 0 }
    }

    const headers = Object.keys(csvData[0])
    const requiredFields = ['name', 'category'] // Minimum required fields

    // Check for required headers
    const missingHeaders = requiredFields.filter(field =>
      !headers.some(header => this.normalizeHeader(header).includes(field))
    )

    if (missingHeaders.length > 0) {
      errors.push(`Missing required columns: ${missingHeaders.join(', ')}`)
    }

    // Validate each row
    csvData.forEach((row, index) => {
      const rowNumber = index + 1

      // Check for empty rows
      if (Object.values(row).every(value => !value || value.toString().trim() === '')) {
        errors.push(`Row ${rowNumber}: Empty row`)
        return
      }

      // Validate required fields
      for (const field of requiredFields) {
        const fieldValue = this.getFieldValue(row, field)
        if (!fieldValue || fieldValue.toString().trim() === '') {
          errors.push(`Row ${rowNumber}: Missing required field '${field}'`)
        }
      }

      // Check data types
      if (row.quantity && isNaN(Number(row.quantity))) {
        warnings.push(`Row ${rowNumber}: Invalid quantity value '${row.quantity}'`)
      }

      if (row.unit_cost && isNaN(Number(row.unit_cost))) {
        warnings.push(`Row ${rowNumber}: Invalid unit cost value '${row.unit_cost}'`)
      }

      // Check for duplicate SKUs (if SKU field exists)
      if (row.sku && csvData.filter(r => r.sku === row.sku).length > 1) {
        warnings.push(`Row ${rowNumber}: Duplicate SKU '${row.sku}'`)
      }

      if (errors.filter(e => e.includes(`Row ${rowNumber}`)).length === 0) {
        validRows++
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validRows,
      totalRows: csvData.length
    }
  }

  /**
   * Transform CSV data to match our asset schema
   */
  async transformCSVToAssets(csvData: any[], fieldMapping: Record<string, string>): Promise<any[]> {
    return csvData.map((row, index) => {
      const asset: any = {
        name: this.getFieldValue(row, 'name') || `Asset ${index + 1}`,
        category: this.getFieldValue(row, 'category') || 'General',
        sku: this.getFieldValue(row, 'sku') || null,
        quantity: this.parseNumber(this.getFieldValue(row, 'quantity')) || 0,
        minQuantity: this.parseNumber(this.getFieldValue(row, 'min_quantity')) || 10,
        unitCost: this.parseNumber(this.getFieldValue(row, 'unit_cost')) || null,
        supplier: this.getFieldValue(row, 'supplier') || null,
        location: this.getFieldValue(row, 'location') || null,
        description: this.getFieldValue(row, 'description') || null,
        tags: this.parseArray(this.getFieldValue(row, 'tags')) || null,
        metadata: {}
      }

      // Add any unmapped fields to metadata
      Object.keys(row).forEach(key => {
        if (!fieldMapping[key] && row[key]) {
          asset.metadata[key] = row[key]
        }
      })

      return asset
    })
  }

  // Private helper methods
  private suggestFieldMapping(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {}

    headers.forEach(header => {
      const normalized = this.normalizeHeader(header)

      if (normalized.includes('name') || normalized.includes('product') || normalized.includes('item')) {
        mapping[header] = 'name'
      } else if (normalized.includes('sku') || normalized.includes('code') || normalized.includes('id')) {
        mapping[header] = 'sku'
      } else if (normalized.includes('category') || normalized.includes('type') || normalized.includes('class')) {
        mapping[header] = 'category'
      } else if (normalized.includes('quantity') || normalized.includes('qty') || normalized.includes('stock')) {
        mapping[header] = 'quantity'
      } else if (normalized.includes('min') && normalized.includes('quantity')) {
        mapping[header] = 'min_quantity'
      } else if (normalized.includes('price') || normalized.includes('cost') || normalized.includes('value')) {
        mapping[header] = 'unit_cost'
      } else if (normalized.includes('supplier') || normalized.includes('vendor') || normalized.includes('manufacturer')) {
        mapping[header] = 'supplier'
      } else if (normalized.includes('location') || normalized.includes('warehouse') || normalized.includes('storage')) {
        mapping[header] = 'location'
      } else if (normalized.includes('description') || normalized.includes('notes') || normalized.includes('comment')) {
        mapping[header] = 'description'
      } else if (normalized.includes('tag')) {
        mapping[header] = 'tags'
      }
    })

    return mapping
  }

  private assessDataQuality(csvData: any[]): {
    completeness: number
    consistency: number
    accuracy: number
  } {
    let totalFields = 0
    let filledFields = 0
    const fieldTypes = new Map<string, Set<string>>()

    // Analyze completeness
    csvData.forEach(row => {
      Object.values(row).forEach(value => {
        totalFields++
        if (value && value.toString().trim() !== '') {
          filledFields++
        }
      })
    })

    const completeness = totalFields > 0 ? filledFields / totalFields : 0

    // Analyze consistency (check for mixed data types in same column)
    const headers = Object.keys(csvData[0] || {})
    headers.forEach(header => {
      const types = new Set<string>()
      csvData.forEach(row => {
        const value = row[header]
        if (value !== null && value !== undefined && value !== '') {
          types.add(typeof value)
        }
      })
      fieldTypes.set(header, types)
    })

    // Calculate consistency score (prefer single data type per column)
    let consistencyScore = 0
    fieldTypes.forEach(types => {
      consistencyScore += types.size === 1 ? 1 : 0.5
    })
    const consistency = fieldTypes.size > 0 ? consistencyScore / fieldTypes.size : 1

    // Simple accuracy assessment (check for obvious errors)
    let accuracyIssues = 0
    csvData.forEach(row => {
      // Check for negative quantities
      if (row.quantity && Number(row.quantity) < 0) accuracyIssues++
      // Check for extremely high prices
      if (row.unit_cost && Number(row.unit_cost) > 1000000) accuracyIssues++
      // Check for suspicious SKUs
      if (row.sku && row.sku.length < 2) accuracyIssues++
    })

    const accuracy = Math.max(0, 1 - (accuracyIssues / csvData.length))

    return {
      completeness: Math.round(completeness * 100) / 100,
      consistency: Math.round(consistency * 100) / 100,
      accuracy: Math.round(accuracy * 100) / 100
    }
  }

  private suggestCategories(csvData: any[], headers: string[]): string[] {
    const categories = new Set<string>()
    const textContent = csvData.map(row =>
      Object.values(row).join(' ').toLowerCase()
    ).join(' ')

    // Analyze content to suggest categories
    if (textContent.match(/\b(phone|laptop|computer|tablet|electronics)\b/)) {
      categories.add('Electronics')
    }
    if (textContent.match(/\b(shirt|dress|clothing|apparel|fashion)\b/)) {
      categories.add('Clothing')
    }
    if (textContent.match(/\b(food|beverage|restaurant|catering)\b/)) {
      categories.add('Food & Beverage')
    }
    if (textContent.match(/\b(book|office|supplies|stationery)\b/)) {
      categories.add('Office Supplies')
    }
    if (textContent.match(/\b(tool|equipment|machinery|hardware)\b/)) {
      categories.add('Equipment')
    }

    // If no specific categories detected, suggest general ones
    if (categories.size === 0) {
      categories.add('General')
      categories.add('Inventory')
    }

    return Array.from(categories).slice(0, 5)
  }

  private normalizeHeader(header: string): string {
    return header.toLowerCase().replace(/[^a-z0-9]/g, '_')
  }

  private getFieldValue(row: any, fieldName: string): string | null {
    // Try exact match first
    if (row[fieldName] !== undefined) {
      return row[fieldName]
    }

    // Try normalized header match
    const normalizedField = this.normalizeHeader(fieldName)
    for (const [key, value] of Object.entries(row)) {
      if (this.normalizeHeader(key) === normalizedField) {
        return value as string
      }
    }

    return null
  }

  private parseNumber(value: string | null): number | null {
    if (!value) return null
    const parsed = Number(value)
    return isNaN(parsed) ? null : parsed
  }

  private parseArray(value: string | null): string[] | null {
    if (!value) return null

    // Handle comma-separated values
    if (value.includes(',')) {
      return value.split(',').map(item => item.trim()).filter(item => item.length > 0)
    }

    // Handle pipe-separated values
    if (value.includes('|')) {
      return value.split('|').map(item => item.trim()).filter(item => item.length > 0)
    }

    // Single value
    return [value.trim()]
  }
}

export const csvImportService = new CSVImportService()
