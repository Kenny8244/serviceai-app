const API_ORIGIN = 'https://serviceai-api.wadimsergeew190405.workers.dev'

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url)
  const target = `${API_ORIGIN}${url.pathname}${url.search}`

  const headers = new Headers(context.request.headers)
  headers.delete('host')

  const init: RequestInit = {
    method: context.request.method,
    headers,
  }

  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    init.body = context.request.body
  }

  const response = await fetch(target, init)
  const responseHeaders = new Headers(response.headers)
  responseHeaders.set('Access-Control-Allow-Origin', url.origin)
  responseHeaders.set('Access-Control-Allow-Credentials', 'true')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  })
}
