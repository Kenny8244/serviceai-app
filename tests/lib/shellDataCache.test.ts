import { describe, expect, it } from 'vitest'
import { createShellCache } from '@/lib/shellDataCache'

describe('createShellCache', () => {
  it('does not restore a list that finished after the cache was cleared', async () => {
    const cache = createShellCache<string[]>()
    let release: (value: string[]) => void = () => undefined
    const first = cache.load(
      () =>
        new Promise((resolve) => {
          release = resolve
        })
    )

    cache.clear()
    release(['stale'])
    await first

    expect(cache.peek()).toBeNull()

    const fresh = await cache.load(async () => ['current'])
    expect(fresh).toEqual(['current'])
    expect(cache.peek()).toEqual(['current'])
  })
})