/**
 * 计算单条打卡记录的换算分数
 * 1题LeetCode = 20页读书 = 1km跑步 = 1分
 * @param {Object} record - 打卡记录 { detail, categoryId }
 * @param {Object} category - 类目 { detailType, unitsPerScore }
 * @returns {number}
 */
export function recordScore(record, category) {
  const units = category?.unitsPerScore ?? 1
  if (category?.detailType === 'number') {
    const val = parseFloat(record?.detail)
    if (Number.isNaN(val) || val < 0) return 0
    return val / units
  }
  return 1
}
