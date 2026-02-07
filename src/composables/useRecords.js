import { ref, computed } from 'vue'
import { storage, STORAGE_KEYS } from '../utils/storage'
import { generateRecordId } from '../data/defaults'

const records = ref([])

function loadRecords() {
  records.value = storage.get(STORAGE_KEYS.RECORDS) || []
}

export function useRecords() {
  const list = computed(() => records.value)

  function add(record) {
    loadRecords()
    const id = generateRecordId()
    const item = { id, ...record, createdAt: Date.now() }
    records.value = [item, ...records.value]
    storage.set(STORAGE_KEYS.RECORDS, records.value)
    return item
  }

  function update(id, payload) {
    loadRecords()
    const idx = records.value.findIndex((r) => r.id === id)
    if (idx === -1) return false
    records.value = records.value.map((r) =>
      r.id === id ? { ...r, ...payload } : r
    )
    storage.set(STORAGE_KEYS.RECORDS, records.value)
    return true
  }

  function remove(id) {
    loadRecords()
    records.value = records.value.filter((r) => r.id !== id)
    storage.set(STORAGE_KEYS.RECORDS, records.value)
    return true
  }

  function getByCategoryId(categoryId) {
    return records.value.filter((r) => r.categoryId === categoryId)
  }

  function getByDate(dateStr) {
    return records.value.filter((r) => r.date === dateStr)
  }

  function replaceAll(newList) {
    records.value = newList || []
    storage.set(STORAGE_KEYS.RECORDS, records.value)
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

export function initRecords() {
  loadRecords()
}
