// Google Sheets Integration Service
// This handles Google Sheets API integration for data import

export interface GoogleSheet {
  id: string
  name: string
  modifiedTime: string
}

export interface SheetData {
  sheetName: string
  headers: string[]
  rows: string[][]
}

class GoogleSheetsService {
  private CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id'
  private SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly'

  // Initialize Google Auth
  async initializeAuth(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).gapi) {
        (window as any).gapi.load('auth2', async () => {
          try {
            const authInstance = await (window as any).gapi.auth2.init({
              client_id: this.CLIENT_ID,
              scope: this.SCOPES
            })
            resolve(authInstance.isSignedIn.get())
          } catch (error) {
            console.error('Failed to initialize Google Auth:', error)
            resolve(false)
          }
        })
      } else {
        resolve(false)
      }
    })
  }

  // Sign in to Google
  async signIn(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && (window as any).gapi) {
        const authInstance = (window as any).gapi.auth2.getAuthInstance()
        await authInstance.signIn()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to sign in to Google:', error)
      return false
    }
  }

  // Sign out from Google
  async signOut(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && (window as any).gapi) {
        const authInstance = (window as any).gapi.auth2.getAuthInstance()
        await authInstance.signOut()
      }
    } catch (error) {
      console.error('Failed to sign out from Google:', error)
    }
  }

  // Check if user is signed in
  isSignedIn(): boolean {
    if (typeof window !== 'undefined' && (window as any).gapi) {
      try {
        const authInstance = (window as any).gapi.auth2.getAuthInstance()
        return authInstance.isSignedIn.get()
      } catch {
        return false
      }
    }
    return false
  }

  // Get user's spreadsheets
  async getSpreadsheets(): Promise<GoogleSheet[]> {
    if (!this.isSignedIn()) {
      throw new Error('User not signed in to Google')
    }

    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets?fields=spreadsheets(id,name,modifiedTime)`,
        {
          headers: {
            'Authorization': `Bearer ${(window as any).gapi.auth.getToken().access_token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.status}`)
      }

      const data = await response.json()
      return data.spreadsheets || []
    } catch (error) {
      console.error('Failed to fetch spreadsheets:', error)
      throw error
    }
  }

  // Get data from a specific sheet
  async getSheetData(spreadsheetId: string, sheetName?: string): Promise<SheetData> {
    if (!this.isSignedIn()) {
      throw new Error('User not signed in to Google')
    }

    try {
      // First get spreadsheet metadata to find sheet names
      const metadataResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
        {
          headers: {
            'Authorization': `Bearer ${(window as any).gapi.auth.getToken().access_token}`
          }
        }
      )

      if (!metadataResponse.ok) {
        throw new Error(`Failed to fetch spreadsheet metadata: ${metadataResponse.status}`)
      }

      const metadata = await metadataResponse.json()
      const sheets = metadata.sheets || []

      // Use specified sheet or first sheet
      const targetSheet = sheets.find((sheet: any) =>
        sheet.properties.title === sheetName
      ) || sheets[0]

      if (!targetSheet) {
        throw new Error('No sheets found in spreadsheet')
      }

      const range = `${targetSheet.properties.title}!A:Z`

      // Get the actual data
      const dataResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
        {
          headers: {
            'Authorization': `Bearer ${(window as any).gapi.auth.getToken().access_token}`
          }
        }
      )

      if (!dataResponse.ok) {
        throw new Error(`Failed to fetch sheet data: ${dataResponse.status}`)
      }

      const data = await dataResponse.json()

      if (!data.values || data.values.length === 0) {
        return {
          sheetName: targetSheet.properties.title,
          headers: [],
          rows: []
        }
      }

      const headers = data.values[0] || []
      const rows = data.values.slice(1) || []

      return {
        sheetName: targetSheet.properties.title,
        headers,
        rows
      }
    } catch (error) {
      console.error('Failed to fetch sheet data:', error)
      throw error
    }
  }

  // Convert Google Sheets data to our CSV format
  convertToCSVData(sheetData: SheetData, spreadsheetName: string): any {
    return {
      headers: sheetData.headers,
      rows: sheetData.rows,
      filename: `${spreadsheetName} - ${sheetData.sheetName}.csv`,
      source: 'google-sheets'
    }
  }
}

export const googleSheetsService = new GoogleSheetsService()

// Load Google APIs script
export function loadGoogleAPIs(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve()
      return
    }

    // Check if already loaded
    if ((window as any).gapi) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google APIs'))
    document.head.appendChild(script)
  })
}
