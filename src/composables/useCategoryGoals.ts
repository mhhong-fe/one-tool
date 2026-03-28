import { ref, computed } from 'vue'
import type { CategoryGoal, Record } from '../types'
import { dayjs, weekStart } from '../utils/date'

const GOALS_KEY = 'CATEGORY_GOALS'

function load(): CategoryGoal[] {
  try {
    return JSON.parse(localStorage.getItem(GOALS_KEY) || '[]')
  } catch {
    return []
  }
}

function save(data: CategoryGoal[]): void {
  localStorage.setItem(GOALS_KEY, JSON.stringify(data))
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

const goals = ref<CategoryGoal[]>(load())

export function useCategoryGoals() {
  function addGoal(payload: Omit<CategoryGoal, 'id'>): void {
    goals.value.push({ id: genId(), ...payload })
    save(goals.value)
  }

  function updateGoal(id: string, payload: Partial<Omit<CategoryGoal, 'id'>>): void {
    const idx = goals.value.findIndex((g) => g.id === id)
    if (idx !== -1) {
      goals.value[idx] = { ...goals.value[idx], ...payload }
      save(goals.value)
    }
  }

  function removeGoal(id: string): void {
    goals.value = goals.value.filter((g) => g.id !== id)
    save(goals.value)
  }

  function removeByCategoryId(categoryId: string): void {
    goals.value = goals.value.filter((g) => g.categoryId !== categoryId)
    save(goals.value)
  }

  function goalsByCategoryId(categoryId: string): CategoryGoal[] {
    return goals.value.filter((g) => g.categoryId === categoryId)
  }

  const PERIOD_LABEL: Record<CategoryGoal['period'], string> = {
    weekly: '本周',
    monthly: '本月',
    yearly: '本年',
  }

  function calcProgress(goal: CategoryGoal, records: Record[]): { done: number; pct: number } {
    const now = dayjs()
    let filtered: Record[]

    if (goal.period === 'weekly') {
      const start = weekStart()
      const end = start.add(7, 'day')
      filtered = records.filter((r) => {
        const d = dayjs(r.date)
        return r.categoryId === goal.categoryId && !d.isBefore(start) && d.isBefore(end)
      })
    } else if (goal.period === 'monthly') {
      filtered = records.filter(
        (r) => r.categoryId === goal.categoryId && dayjs(r.date).isSame(now, 'month'),
      )
    } else {
      filtered = records.filter(
        (r) => r.categoryId === goal.categoryId && dayjs(r.date).isSame(now, 'year'),
      )
    }

    const done =
      goal.metric === 'sum'
        ? filtered.reduce((s, r) => s + (parseFloat(r.detail) || 0), 0)
        : filtered.length

    const pct = Math.min(100, goal.target > 0 ? Math.round((done / goal.target) * 100) : 0)
    return { done, pct }
  }

  return {
    list: computed(() => goals.value),
    goalsByCategoryId,
    calcProgress,
    PERIOD_LABEL,
    addGoal,
    updateGoal,
    removeGoal,
    removeByCategoryId,
  }
}
