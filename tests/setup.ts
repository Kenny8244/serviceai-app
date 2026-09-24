import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'
import { clearShellDataCache } from '@/services/api'

beforeEach(() => {
  clearShellDataCache()
})
