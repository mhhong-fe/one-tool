import type { Category } from '../types'

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_1', name: '跑步', detailLabel: '公里数', detailType: 'number', icon: 'RunLeft', color: 'category-run', unitsPerScore: 3 },
  { id: 'cat_2', name: 'LeetCode刷题', detailLabel: '刷题数', detailType: 'number', icon: 'Code', color: 'category-leetcode', unitsPerScore: 1 },
  { id: 'cat_3', name: '读书', detailLabel: '页数', detailType: 'number', icon: 'Book', color: 'category-reading', unitsPerScore: 20 },
]

export function getDefaultCategories(): Category[] {
  return DEFAULT_CATEGORIES.map((c) => ({ ...c }))
}

export function ensureCategories(): Category[] {
  // 直接返回默认分类，不进行存储操作
  // 存储操作由 useCategories 中的 loadCategories 处理
  return getDefaultCategories()
}

export function generateCategoryId(): string {
  return 'cat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

export function generateRecordId(): string {
  return 'rec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}
