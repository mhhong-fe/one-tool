import { STORAGE_KEYS } from '../utils/storage'
import { storage } from '../utils/storage'

const DEFAULT_CATEGORIES = [
  { id: 'cat_1', name: '跑步', detailLabel: '公里数', detailType: 'number', icon: 'RunLeft', color: 'category-run', unitsPerScore: 3 },
  { id: 'cat_2', name: 'LeetCode刷题', detailLabel: '刷题数', detailType: 'number', icon: 'Code', color: 'category-leetcode', unitsPerScore: 1 },
  { id: 'cat_3', name: '读书', detailLabel: '页数', detailType: 'number', icon: 'Book', color: 'category-reading', unitsPerScore: 20 },
]

export function getDefaultCategories() {
  return DEFAULT_CATEGORIES.map((c) => ({ ...c }))
}

export function ensureCategories() {
  let list = storage.get(STORAGE_KEYS.CATEGORIES)
  if (!Array.isArray(list) || list.length === 0) {
    list = getDefaultCategories()
    storage.set(STORAGE_KEYS.CATEGORIES, list)
  }
  return list
}

export function generateCategoryId() {
  return 'cat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

export function generateRecordId() {
  return 'rec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}
