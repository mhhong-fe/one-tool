import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { storage, STORAGE_KEYS } from '../utils/storage'
import { ensureCategories, generateCategoryId } from '../data/defaults'
import type { Category } from '../types'

const categories: Ref<Category[]> = ref([])

const DEFAULT_UNITS_PER_SCORE: Record<string, number> = { cat_1: 3, cat_2: 1, cat_3: 20 }

/**
 * 从 API 加载分类
 */
async function loadCategories(): Promise<void> {
  try {
    const stored = await storage.get<Category[]>(STORAGE_KEYS.CATEGORIES)
    if (!Array.isArray(stored) || stored.length === 0) {
      // 如果没有数据，使用默认分类
      const defaultCategories = ensureCategories()
      categories.value = defaultCategories
      // 保存默认分类到 API
      await storage.set(STORAGE_KEYS.CATEGORIES, defaultCategories)
    } else {
      categories.value = stored
      // 检查是否需要迁移（添加 unitsPerScore）
      const needsMigration = categories.value.some((c) => c.unitsPerScore == null)
      if (needsMigration) {
        categories.value = categories.value.map((c) => ({
          ...c,
          unitsPerScore: c.unitsPerScore ?? DEFAULT_UNITS_PER_SCORE[c.id] ?? 1,
        }))
        await storage.set(STORAGE_KEYS.CATEGORIES, categories.value)
      }
    }
  } catch (error) {
    console.error('加载分类失败:', error)
    // 如果加载失败，使用默认分类
    categories.value = ensureCategories()
  }
}

export function useCategories() {
  const list: ComputedRef<Category[]> = computed(() => categories.value)

  /**
   * 添加分类
   */
  async function add(
    name: string,
    detailLabel: string = '详情',
    detailType: 'number' | 'text' = 'text',
    icon: string = 'ActivitySource',
    color: string = 'category-custom',
    unitsPerScore: number = 1
  ): Promise<Category> {
    await loadCategories()
    const id = generateCategoryId()
    const item: Category = { id, name, detailLabel, detailType, icon, color, unitsPerScore }
    categories.value = [...categories.value, item]
    await storage.set(STORAGE_KEYS.CATEGORIES, categories.value)
    return item
  }

  /**
   * 更新分类
   */
  async function update(id: string, payload: Partial<Category>): Promise<boolean> {
    await loadCategories()
    const idx = categories.value.findIndex((c) => c.id === id)
    if (idx === -1) return false
    categories.value = categories.value.map((c) =>
      c.id === id ? { ...c, ...payload } : c
    )
    await storage.set(STORAGE_KEYS.CATEGORIES, categories.value)
    return true
  }

  /**
   * 删除分类
   */
  async function remove(id: string): Promise<boolean> {
    await loadCategories()
    categories.value = categories.value.filter((c) => c.id !== id)
    await storage.set(STORAGE_KEYS.CATEGORIES, categories.value)
    return true
  }

  /**
   * 根据ID获取分类
   */
  function getById(id: string): Category | undefined {
    return categories.value.find((c) => c.id === id)
  }

  return { list, add, update, remove, getById, loadCategories }
}

/**
 * 初始化分类（异步）
 */
export async function initCategories(): Promise<void> {
  await loadCategories()
}
