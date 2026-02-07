import { ref, computed } from 'vue'
import { storage, STORAGE_KEYS } from '../utils/storage'
import { ensureCategories, generateCategoryId } from '../data/defaults'

const categories = ref([])

const DEFAULT_UNITS_PER_SCORE = { cat_1: 3, cat_2: 1, cat_3: 20 }

function loadCategories() {
  categories.value = storage.get(STORAGE_KEYS.CATEGORIES)
  if (!Array.isArray(categories.value) || categories.value.length === 0) {
    categories.value = ensureCategories()
  } else {
    const needsMigration = categories.value.some((c) => c.unitsPerScore == null)
    if (needsMigration) {
      categories.value = categories.value.map((c) => ({
        ...c,
        unitsPerScore: c.unitsPerScore ?? DEFAULT_UNITS_PER_SCORE[c.id] ?? 1,
      }))
      storage.set(STORAGE_KEYS.CATEGORIES, categories.value)
    }
  }
}

export function useCategories() {
  const list = computed(() => categories.value)

  function add(name, detailLabel = '详情', detailType = 'text', icon = 'ActivitySource', color = 'category-custom', unitsPerScore = 1) {
    loadCategories()
    const id = generateCategoryId()
    const item = { id, name, detailLabel, detailType, icon, color, unitsPerScore }
    categories.value = [...categories.value, item]
    storage.set(STORAGE_KEYS.CATEGORIES, categories.value)
    return item
  }

  function update(id, payload) {
    loadCategories()
    const idx = categories.value.findIndex((c) => c.id === id)
    if (idx === -1) return false
    categories.value = categories.value.map((c) =>
      c.id === id ? { ...c, ...payload } : c
    )
    storage.set(STORAGE_KEYS.CATEGORIES, categories.value)
    return true
  }

  function remove(id) {
    loadCategories()
    categories.value = categories.value.filter((c) => c.id !== id)
    storage.set(STORAGE_KEYS.CATEGORIES, categories.value)
    return true
  }

  function getById(id) {
    return categories.value.find((c) => c.id === id)
  }

  return { list: list, add, update, remove, getById, loadCategories }
}

export function initCategories() {
  loadCategories()
}
