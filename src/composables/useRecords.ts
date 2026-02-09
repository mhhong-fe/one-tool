import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { storage, STORAGE_KEYS } from '../utils/storage'
import { generateRecordId } from '../data/defaults'
import type { Record } from '../types'

const records: Ref<Record[]> = ref([])

/**
 * 从 API 加载记录
 */
async function loadRecords(): Promise<void> {
  try {
    records.value = await storage.get<Record[]>(STORAGE_KEYS.RECORDS, [])
  } catch (error) {
    console.error('加载记录失败:', error)
    records.value = []
  }
}

export function useRecords() {
  const list: ComputedRef<Record[]> = computed(() => records.value)

  /**
   * 添加记录
   */
  async function add(record: Omit<Record, 'id' | 'createdAt'>): Promise<Record> {
    await loadRecords()
    const id = generateRecordId()
    const item: Record = { id, ...record, createdAt: Date.now() }
    records.value = [item, ...records.value]
    await storage.set(STORAGE_KEYS.RECORDS, records.value)
    return item
  }

  /**
   * 更新记录
   */
  async function update(id: string, payload: Partial<Record>): Promise<boolean> {
    await loadRecords()
    const idx = records.value.findIndex((r) => r.id === id)
    if (idx === -1) return false
    records.value = records.value.map((r) =>
      r.id === id ? { ...r, ...payload } : r
    )
    await storage.set(STORAGE_KEYS.RECORDS, records.value)
    return true
  }

  /**
   * 删除记录
   */
  async function remove(id: string): Promise<boolean> {
    await loadRecords()
    records.value = records.value.filter((r) => r.id !== id)
    await storage.set(STORAGE_KEYS.RECORDS, records.value)
    return true
  }

  /**
   * 根据分类ID获取记录
   */
  function getByCategoryId(categoryId: string): Record[] {
    return records.value.filter((r) => r.categoryId === categoryId)
  }

  /**
   * 根据日期获取记录
   */
  function getByDate(dateStr: string): Record[] {
    return records.value.filter((r) => r.date === dateStr)
  }

  /**
   * 替换所有记录
   */
  async function replaceAll(newList: Record[] | null): Promise<void> {
    records.value = newList || []
    await storage.set(STORAGE_KEYS.RECORDS, records.value)
  }

  return {
    list,
    add,
    update,
    remove,
    getByCategoryId,
    getByDate,
    replaceAll,
    loadRecords,
  }
}

/**
 * 初始化记录（异步）
 */
export async function initRecords(): Promise<void> {
  await loadRecords()
}
