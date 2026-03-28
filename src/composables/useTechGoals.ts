import { ref, computed } from 'vue'
import { createStorage } from '../utils/storage'
import { DataType } from '../types'
import type { TechGoalsData, TechGoal, TechArticle } from '../types'

const DEFAULT_DATA: TechGoalsData = {
  detail: '',
  goals: [],
}

const store = createStorage<TechGoalsData>(DataType.TECH_GOALS, DEFAULT_DATA)

const data = ref<TechGoalsData>({ ...DEFAULT_DATA })
const loading = ref(false)

async function load(): Promise<void> {
  loading.value = true
  try {
    const d = await store.get()
    data.value = d
  } finally {
    loading.value = false
  }
}

async function persist(): Promise<void> {
  await store.set(data.value)
}

export function useTechGoals() {
  const goalList = computed(() => data.value.goals)
  const detail = computed(() => data.value.detail)

  function goalProgress(goal: TechGoal): { pct: number; avgScore: number } {
    if (goal.articles.length === 0) return { pct: 0, avgScore: 0 }
    const avg = goal.articles.reduce((s, a) => s + a.score, 0) / goal.articles.length
    const pct = Math.min(100, Math.round((avg / 10) * 100))
    return { pct, avgScore: avg }
  }

  // 加权总进度：Σ(maxScore × avgScore/10) / Σ(maxScore)
  const progress = computed(() => {
    const goals = data.value.goals
    const totalWeight = goals.reduce((s, g) => s + g.maxScore, 0)
    if (totalWeight === 0) return { pct: 0 }
    const weighted = goals.reduce((s, g) => {
      const { avgScore } = goalProgress(g)
      return s + g.maxScore * (avgScore / 10)
    }, 0)
    const pct = Math.min(100, Math.round((weighted / totalWeight) * 100))
    return { pct }
  })

  async function updateDetail(val: string): Promise<void> {
    data.value = { ...data.value, detail: val }
    await persist()
  }

  function addGoal(g: Omit<TechGoal, 'id' | 'articles'>): void {
    data.value = {
      ...data.value,
      goals: [...data.value.goals, { ...g, id: `tg_${Date.now()}`, articles: [] }],
    }
    persist()
  }

  function updateGoal(id: string, patch: Partial<Omit<TechGoal, 'id' | 'articles'>>): void {
    data.value = {
      ...data.value,
      goals: data.value.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }
    persist()
  }

  function removeGoal(id: string): void {
    data.value = { ...data.value, goals: data.value.goals.filter((g) => g.id !== id) }
    persist()
  }

  function addArticle(goalId: string, article: Omit<TechArticle, 'id'>): void {
    data.value = {
      ...data.value,
      goals: data.value.goals.map((g) =>
        g.id === goalId
          ? { ...g, articles: [...g.articles, { ...article, id: `ta_${Date.now()}` }] }
          : g,
      ),
    }
    persist()
  }

  function updateArticle(goalId: string, articleId: string, patch: Partial<Omit<TechArticle, 'id'>>): void {
    data.value = {
      ...data.value,
      goals: data.value.goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              articles: g.articles.map((a) => (a.id === articleId ? { ...a, ...patch } : a)),
            }
          : g,
      ),
    }
    persist()
  }

  function removeArticle(goalId: string, articleId: string): void {
    data.value = {
      ...data.value,
      goals: data.value.goals.map((g) =>
        g.id === goalId
          ? { ...g, articles: g.articles.filter((a) => a.id !== articleId) }
          : g,
      ),
    }
    persist()
  }

  function exportData(): void {
    const json = JSON.stringify(data.value, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `TECH_GOALS-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    goalList, detail, loading, progress,
    load, updateDetail, exportData,
    goalProgress,
    addGoal, updateGoal, removeGoal,
    addArticle, updateArticle, removeArticle,
  }
}
