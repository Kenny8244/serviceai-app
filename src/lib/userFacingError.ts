function getStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = Number((error as { status?: number }).status)
    return Number.isFinite(status) ? status : undefined
  }
  return undefined
}

function getRawMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return ''
}

export function toAuthMessage(error: unknown): string {
  const status = getStatus(error)
  const raw = getRawMessage(error)
  const message = raw.toLowerCase()

  if (
    error instanceof TypeError ||
    message.includes('failed to fetch') ||
    message.includes('network error') ||
    message.includes('load failed')
  ) {
    return 'We could not connect to the server. Check your internet connection and try again.'
  }

  if (status === 401 || message.includes('invalid email or password')) {
    return 'Invalid email or password'
  }

  if (status === 409 || message.includes('already exists')) {
    return 'An account with this email already exists'
  }

  if (status === 400 && raw && raw.length < 140) {
    return raw
  }

  if (status === 503 || message.includes('not configured')) {
    return 'Sign-in is not available right now. Please try again later.'
  }

  if ((status != null && status >= 500) || message.includes('internal server')) {
    return 'The server had a problem. Please try again in a moment.'
  }

  if (raw && raw.length < 140 && !message.includes('exception') && !message.includes('stack')) {
    return raw
  }

  return 'Something went wrong. Please try again.'
}
export function toUserMessage(error: unknown): string {
  const status = getStatus(error)
  const raw = getRawMessage(error)
  const message = raw.toLowerCase()

  if (
    error instanceof TypeError ||
    message.includes('failed to fetch') ||
    message.includes('network error') ||
    message.includes('load failed')
  ) {
    return 'We could not connect to the server. Check your internet connection and try again.'
  }

  if (
    status === 401 ||
    message.includes('unauthorized') ||
    message.includes('authentication required') ||
    message.includes('access token required') ||
    message.includes('invalid or expired token')
  ) {
    return 'Your session has expired. Please sign in again.'
  }

  if (status === 403 && (message.includes('user not found') || message.includes('invalid or expired'))) {
    return 'Your session has expired. Please sign in again.'
  }

  if (status === 403 || message.includes('forbidden')) {
    return 'You do not have permission to do that.'
  }

  if (status === 404 || message.includes('not found')) {
    return 'We could not find that information. It may have been removed.'
  }

  if (status === 429) {
    return 'Too many requests. Please wait a moment and try again.'
  }

  if ((status != null && status >= 500) || message.includes('internal server')) {
    return 'The server had a problem. Please try again in a moment.'
  }

  if (message === 'request failed') {
    return 'The server had a problem. Please try again in a moment.'
  }

  if (raw && raw.length < 140 && !message.includes('exception') && !message.includes('stack')) {
    return raw
  }

  return 'Something went wrong. Please try again.'
}
