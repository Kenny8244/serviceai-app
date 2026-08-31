interface Env {
  API: Fetcher
}

export const onRequest: PagesFunction<Env> = async (context) => {
  if (!context.env.API) {
    return new Response('API service binding is not configured', { status: 502 })
  }

  return context.env.API.fetch(context.request)
}
