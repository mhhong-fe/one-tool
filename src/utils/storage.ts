import { getConfig, saveConfig } from './api'
import type { Category, Record, StorageKey, StorageCache, ImportResult } from '../types'

const STORAGE_KEYS = {
  CATEGORIES: 'CATEGORIES' as const,
  RECORDS: 'RECORDS' as const,
}

// 内存缓存，避免频繁请求
let cache: StorageCache = {
  CATEGORIES: null,
  RECORDS: null,
  lastFetchTime: null,
}

const CACHE_DURATION = 1000 // 缓存时间（毫秒），1秒内不重复请求

/**
 * 统一 API 存储封装，支持增删改查
 */
export const storage = {
  /**
   * 从 API 获取数据
   * @param key - 数据键（CATEGORIES 或 RECORDS）
   * @param defaultValue - 默认值
   */
  async get<T = any>(key: StorageKey, defaultValue: T | null = null): Promise<T> {
    try {
      // 检查缓存
      const now = Date.now()
      if (cache[key] !== null && cache.lastFetchTime && (now - cache.lastFetchTime) < CACHE_DURATION) {
        return cache[key] as T
      }

      // 从 API 获取数据
      const data = await getConfig()
      
      // 更新缓存
      cache.CATEGORIES = data.CATEGORIES || []
      cache.RECORDS = data.RECORDS || []
      cache.lastFetchTime = now

      return (data[key] || defaultValue) as T
    } catch (error) {
      console.error(`获取 ${key} 失败:`, error)
      // 返回缓存数据或默认值
      return (cache[key] || defaultValue) as T
    }
  },

  /**
   * 保存数据到 API
   * @param key - 数据键（CATEGORIES 或 RECORDS）
   * @param value - 要保存的值
   */
  async set(key: StorageKey, value: Category[] | Record[]): Promise<boolean> {
    try {
      // 更新缓存
      cache[key] = value as any

      // 获取当前所有数据
      const currentData = {
        CATEGORIES: (cache.CATEGORIES || []) as Category[],
        RECORDS: (cache.RECORDS || []) as Record[],
      }

      // 更新对应键的值
      currentData[key] = value as any

      // 保存到 API
      const success = await saveConfig(currentData)
      
      if (success) {
        cache.lastFetchTime = Date.now()
      }
      
      return success
    } catch (error) {
      console.error(`保存 ${key} 失败:`, error)
      return false
    }
  },

  /**
   * 删除数据（通过设置为空数组）
   * @param key - 数据键
   */
  async remove(key: StorageKey): Promise<boolean> {
    return this.set(key, [])
  },

  /**
   * 清空所有数据
   */
  async clear(): Promise<boolean> {
    try {
      const success = await saveConfig({
        CATEGORIES: [],
        RECORDS: [],
      })
      
      if (success) {
        cache.CATEGORIES = []
        cache.RECORDS = []
        cache.lastFetchTime = Date.now()
      }
      
      return success
    } catch (error) {
      console.error('清空数据失败:', error)
      return false
    }
  },

  /**
   * 导出全部数据为 JSON 字符串
   */
  async exportAll(): Promise<string> {
    try {
      const data = await getConfig()
      return JSON.stringify(data, null, 2)
    } catch (error) {
      console.error('导出数据失败:', error)
      return JSON.stringify({ CATEGORIES: [], RECORDS: [] }, null, 2)
    }
  },

  /**
   * 从 JSON 字符串导入
   * @param jsonStr - JSON 字符串
   */
  async importFrom(jsonStr: string | ArrayBuffer): Promise<ImportResult> {
    try {
      const str = typeof jsonStr === 'string' ? jsonStr : new TextDecoder().decode(jsonStr)
      const data = JSON.parse(str)
      const config = {
        CATEGORIES: data.CATEGORIES || [],
        RECORDS: data.RECORDS || [],
      }
      
      const success = await saveConfig(config)
      
      if (success) {
        cache.CATEGORIES = config.CATEGORIES
        cache.RECORDS = config.RECORDS
        cache.lastFetchTime = Date.now()
      }
      
      return { success }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  /**
   * 清除缓存，强制从 API 重新获取
   */
  clearCache(): void {
    cache = {
      CATEGORIES: null,
      RECORDS: null,
      lastFetchTime: null,
    }
  },
}

export { STORAGE_KEYS }
