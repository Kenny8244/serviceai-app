const FRESH_MS = 20_000

type Entry<T> = { value: T; at: number }

export function createShellCache<T>() {
  let entry: Entry<T> | null = null
  let inflight: Promise<T> | null = null
  let generation = 0

  function peek(): T | null {
    return entry?.value ?? null
  }

  function isFresh(): boolean {
    return entry != null && Date.now() - entry.at < FRESH_MS
  }

  function remember(value: T): void {
    entry = { value, at: Date.now() }
  }

  function clear(): void {
    entry = null
    inflight = null
    generation += 1
  }

  async function load(fetcher: () => Promise<T>): Promise<T> {
    if (isFresh() && entry) return entry.value
    if (inflight) return inflight
    const started = generation
    const run = fetcher()
      .then((value) => {
        if (started === generation) remember(value)
        return value
      })
      .finally(() => {
        if (inflight === run) inflight = null
      })
    inflight = run
    return run
  }

  return { peek, isFresh, remember, clear, load }
}
