export enum DataType {
  LEETCODE = 'LEETCODE',
  TECH_GOALS = 'TECH_GOALS',
}

// ── LeetCode ──────────────────────────────────────────────

export interface LeetCodeAttempt {
  date: string    // "2026.02.11"
  passed: boolean
  note: string
}

export interface LeetCodeProblem {
  id: string
  no: number
  title: string
  attempts: LeetCodeAttempt[]
}

export interface LeetCodeGoal {
  id: string
  year: number
  target: number
}

export interface LeetCodeData {
  detail: string
  problems: LeetCodeProblem[]
  goals: LeetCodeGoal[]
}

// ── 技术精进 ───────────────────────────────────────────────

export interface TechArticle {
  id: string
  title: string
  url: string
  score: number   // 0-10
  note: string
}

export interface TechGoal {
  id: string
  title: string
  detail: string
  maxScore: number
  articles: TechArticle[]
}

export interface TechGoalsData {
  detail: string
  goals: TechGoal[]
}

// ── 布局 ───────────────────────────────────────────────────

export interface MenuOption {
  label: string
  key: string
  icon: string
}
