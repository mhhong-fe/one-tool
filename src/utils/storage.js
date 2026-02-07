const STORAGE_KEYS = {
  CATEGORIES: 'one_tool_categories',
  RECORDS: 'one_tool_records',
}

/**
 * 统一 localStorage 封装，支持增删改查
 */
export const storage = {
  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(key)
      if (raw == null) return defaultValue
      return JSON.parse(raw)
    } catch {
      return defaultValue
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  },

  clear() {
    try {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k))
      return true
    } catch {
      return false
    }
  },

  /** 导出全部数据为 JSON 字符串 */
  exportAll() {
    const data = {}
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      data[name] = this.get(key)
    })
    return JSON.stringify(data, null, 2)
  },

  /** 从 JSON 字符串导入 */
  importFrom(jsonStr) {
    try {
      const data = JSON.parse(jsonStr)
      Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
        if (data[name] != null) {
          this.set(key, data[name])
        }
      })
      return { success: true }
    } catch (e) {
      return { success: false, error: e.message }
    }
  },
}

export { STORAGE_KEYS }
