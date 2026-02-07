<script setup>
import { computed } from 'vue'
import { NProgress, NTag } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useCategories } from '../composables/useCategories'
import { useRecords } from '../composables/useRecords'
import { recordScore } from '../utils/score'
import { dayjs, todayStr as getTodayStr, weekStart as getWeekStart } from '../utils/date'
import { getIcon } from '../components/icons'

const router = useRouter()
const { list: categories } = useCategories()
const { list: records } = useRecords()

const todayStr = computed(() => getTodayStr())

const todayRecords = computed(() =>
  records.value.filter((r) => r.date === todayStr.value)
)

const todayByCategory = computed(() => {
  const map = {}
  todayRecords.value.forEach((r) => {
    map[r.categoryId] = (map[r.categoryId] || 0) + 1
  })
  return map
})

const todayScore = computed(() => {
  const cats = categories.value
  return todayRecords.value.reduce((sum, r) => {
    const cat = cats.find((c) => c.id === r.categoryId)
    return sum + recordScore(r, cat)
  }, 0)
})

const completedCount = computed(() => Object.keys(todayByCategory.value).length)
const totalCategories = computed(() => categories.value.length)
const todayRate = computed(() =>
  totalCategories.value === 0 ? 0 : Math.round((completedCount.value / totalCategories.value) * 100)
)

const weekRecordsCount = computed(() => {
  const start = getWeekStart()
  const end = start.add(7, 'day')
  return records.value.filter((r) => {
    const d = dayjs(r.date)
    return !d.isBefore(start) && d.isBefore(end)
  }).length
})

const monthRecordsCount = computed(() => {
  const now = dayjs()
  return records.value.filter((r) => dayjs(r.date).isSame(now, 'month')).length
})

const notCheckedToday = computed(() =>
  categories.value.filter((c) => !todayByCategory.value[c.id])
)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return '早上好'
  if (h < 18) return '下午好'
  return '晚上好'
})
</script>

<template>
  <div class="page-home">
    <header class="page-header">
      <p class="greeting">{{ greeting }}，今天也要加油 ✨</p>
      <h1 class="page-title">今日打卡</h1>
    </header>

    <!-- 完成度卡片 -->
    <section class="section-progress">
      <div class="progress-card">
        <div class="progress-header">
          <span class="progress-label">今日完成度</span>
          <span class="progress-value">{{ completedCount }}/{{ totalCategories }}</span>
        </div>
        <NProgress
          type="line"
          :percentage="todayRate"
          :color="todayRate >= 100 ? 'var(--primary-color)' : 'var(--warning-color)'"
          :rail-color="'var(--border-soft)'"
          :height="10"
          :border-radius="5"
        />
      </div>
    </section>

    <!-- 快捷统计 -->
    <section class="section-stats">
      <div class="stat-card" @click="router.push('/stats')">
        <span class="stat-num">{{ weekRecordsCount }}</span>
        <span class="stat-label">本周打卡</span>
      </div>
      <div class="stat-card" @click="router.push('/stats')">
        <span class="stat-num">{{ monthRecordsCount }}</span>
        <span class="stat-label">本月打卡</span>
      </div>
      <div class="stat-card" @click="router.push('/stats')">
        <span class="stat-num">{{ todayScore.toFixed(1) }}</span>
        <span class="stat-label">今日得分</span>
      </div>
    </section>

    <!-- 未打卡提醒 -->
    <section v-if="notCheckedToday.length > 0" class="section-remind">
      <h2 class="section-title">还没打卡哦</h2>
      <div class="tag-list">
        <NTag
          v-for="c in notCheckedToday"
          :key="c.id"
          round
          class="tag-remind"
          @click="router.push('/checkin')"
        >
          <span v-if="c.icon" class="tag-icon">{{ getIcon(c.icon) }}</span>
          {{ c.name }}
        </NTag>
      </div>
    </section>

    <!-- 今日明细 -->
    <section class="section-today">
      <h2 class="section-title">今日明细</h2>
      <div v-if="todayRecords.length === 0" class="empty-state">
        <p class="empty-text">今日暂无打卡记录</p>
        <button class="btn-primary" @click="router.push('/checkin')">去打卡</button>
      </div>
      <ul v-else class="record-list">
        <li
          v-for="r in todayRecords"
          :key="r.id"
          class="record-item"
        >
          <span class="record-cat">
            <span v-if="categories.find(c => c.id === r.categoryId)?.icon" class="record-icon">{{ getIcon(categories.find(c => c.id === r.categoryId)?.icon) }}</span>
            {{ categories.find(c => c.id === r.categoryId)?.name || '-' }}
          </span>
          <span class="record-detail">{{ r.detail || '-' }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.page-home {
  max-width: 100%;
}

.page-header {
  margin-bottom: 32px;
}

.greeting {
  margin: 0 0 8px;
  font-size: 15px;
  color: var(--text-tertiary);
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.section-progress {
  margin-bottom: 24px;
}

.progress-card {
  padding: 24px 28px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-soft);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.progress-label {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
}

.progress-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-color);
}

.section-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  flex: 1;
  padding: 24px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-soft);
  cursor: pointer;
  transition: all 0.2s ease;
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--primary-light);
  transform: translateY(-2px);
}

.stat-num {
  display: block;
  font-size: 32px;
  font-weight: 700;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--text-tertiary);
}

.section-remind,
.section-today {
  margin-top: 32px;
}

.section-title {
  margin: 0 0 16px;
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-remind {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px !important;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.08) 100%) !important;
  color: var(--warning-color) !important;
  border: none !important;
  font-size: 14px !important;
  cursor: pointer;
  transition: transform 0.2s;
}

.tag-remind:hover {
  transform: scale(1.02);
}

.tag-icon {
  font-size: 16px;
}

.record-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  margin-bottom: 12px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-soft);
  transition: all 0.2s ease;
}

.record-item:hover {
  box-shadow: var(--shadow-md);
  border-color: rgba(34, 197, 94, 0.3);
}

.record-cat {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 15px;
  color: var(--primary-color);
}

.record-icon {
  font-size: 20px;
}

.record-detail {
  font-size: 15px;
  color: var(--text-secondary);
}

.empty-state {
  padding: 48px 24px;
  text-align: center;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 2px dashed var(--border-color);
}

.empty-text {
  margin: 0 0 20px;
  font-size: 15px;
  color: var(--text-tertiary);
}

.btn-primary {
  padding: 12px 28px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: var(--primary-gradient);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4);
}
</style>
