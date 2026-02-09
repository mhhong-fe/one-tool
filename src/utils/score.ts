import type { Record, Category } from '../types'

/**
 * 计算单条打卡记录的换算分数
 * 1题LeetCode = 20页读书 = 1km跑步 = 1分
 * @param record - 打卡记录 { detail, categoryId }
 * @param category - 类目 { detailType, unitsPerScore }
 */
export function recordScore(record: Record | null | undefined, category: Category | null | undefined): number {
  const units = category?.unitsPerScore ?? 1
  if (category?.detailType === 'number') {
    const val = parseFloat(record?.detail || '0')
    if (Number.isNaN(val) || val < 0) return 0
    return val / units
  }
  return 1
}
