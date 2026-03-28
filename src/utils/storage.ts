import { getConfig, saveConfig } from './api'
import { DataType } from '../types'

const CACHE_DURATION = 1000 // 1 秒

export function createStorage<T>(type: DataType, defaultValue: T) {
  let cached: T | null = null
  let cachedAt = 0

  return {
    async get(): Promise<T> {
      const now = Date.now()
      if (cached !== null && now - cachedAt < CACHE_DURATION) {
        return cached
      }
      const data = await getConfig<T>(type)
      cached = data ?? defaultValue
      cachedAt = Date.now()
      return cached
    },

    async set(data: T): Promise<void> {
      cached = data
      cachedAt = Date.now()
      await saveConfig(type, data)
    },

    clearCache(): void {
      cached = null
      cachedAt = 0
    },
  }
}
