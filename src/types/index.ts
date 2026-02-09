/**
 * 分类/类目类型
 */
export interface Category {
  id: string
  name: string
  detailLabel: string
  detailType: 'number' | 'text'
  icon: string
  color: string
  unitsPerScore: number
}

/**
 * 打卡记录类型
 */
export interface Record {
  id: string
  categoryId: string
  date: string
  detail: string
  createdAt: number
}

/**
 * API 响应数据结构
 */
export interface ApiConfigResponse {
  message: string
  data: {
    CATEGORIES: Category[]
    RECORDS: Record[]
  }
}

/**
 * 存储键类型
 */
export type StorageKey = 'CATEGORIES' | 'RECORDS'

/**
 * 存储缓存类型
 */
export interface StorageCache {
  CATEGORIES: Category[] | null
  RECORDS: Record[] | null
  lastFetchTime: number | null
}

/**
 * 导入结果类型
 */
export interface ImportResult {
  success: boolean
  error?: string
}

/**
 * 菜单选项类型
 */
export interface MenuOption {
  label: string
  key: string
  icon: string
}

/**
 * 图标选项类型
 */
export interface IconOption {
  key: string
  emoji: string
  label: string
}

/**
 * 日期格子类型（用于热力图）
 */
export interface DateCell {
  dateStr: string
  score: number
  date: import('dayjs').Dayjs
  isFuture: boolean
}

/**
 * 月份分组类型（用于热力图）
 */
export interface MonthGroup {
  key: string
  label: string
  rows: (DateCell | null)[][]
}

/**
 * 年度统计类型
 */
export interface YearStat {
  month: number
  total: number
  score: number
}

/**
 * 类目统计类型
 */
export interface CategoryStat {
  id: string
  name: string
  count: number
  score: number
  rate: number
  scoreRate: number
}

/**
 * 表格行类型（用于统计页面）
 */
export interface TableRow extends Record {
  categoryName: string
  detailLabel: string
  detailType: 'number' | 'text'
  score: number
}
