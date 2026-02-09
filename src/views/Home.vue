<script setup lang="ts">
import { computed } from 'vue'
import { NProgress, NTag } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useCategories } from '../composables/useCategories'
import { useRecords } from '../composables/useRecords'
import { recordScore } from '../utils/score'
import { dayjs, todayStr as getTodayStr, weekStart as getWeekStart } from '../utils/date'
import IconFont from '../components/IconFont.vue'

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
      <div class="header-content">
        <div class="header-text">
          <p class="greeting">{{ greeting }}，今天也要加油 ✨</p>
          <h1 class="page-title">今日打卡</h1>
        </div>
        <div class="header-decoration">
          <div class="decoration-circle circle-1"></div>
          <div class="decoration-circle circle-2"></div>
          <div class="decoration-circle circle-3"></div>
        </div>
      </div>
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
          :color="todayRate >= 100 ? 'var(--primary-color)' : 'var(--primary-light)'"
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
          <IconFont v-if="c.icon" :name="c.icon" class="tag-icon" :size="16" />
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
            <IconFont v-if="categories.find(c => c.id === r.categoryId)?.icon" :name="categories.find(c => c.id === r.categoryId)?.icon || 'ActivitySource'" class="record-icon" :size="20" />
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
  margin-bottom: 40px;
  position: relative;
  overflow: hidden;
}

.header-content {
  position: relative;
  padding: 32px 28px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%);
  border-radius: var(--radius-xl);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(99, 102, 241, 0.1);
  box-shadow: var(--shadow-sm);
}

.header-text {
  position: relative;
  z-index: 2;
}

.greeting {
  margin: 0 0 12px;
  font-size: 16px;
  color: var(--text-secondary);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.greeting::before {
  content: '✨';
  font-size: 18px;
  animation: sparkle 2s ease-in-out infinite;
}

@keyframes sparkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}

.page-title {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.header-decoration {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
  border-radius: var(--radius-xl);
  pointer-events: none;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 120px;
  height: 120px;
  top: -40px;
  right: -20px;
  animation-delay: 0s;
}

.circle-2 {
  width: 80px;
  height: 80px;
  bottom: -20px;
  right: 40px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%);
  animation-delay: 2s;
}

.circle-3 {
  width: 60px;
  height: 60px;
  top: 50%;
  left: -10px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
  50% { transform: translate(10px, -10px) scale(1.1); opacity: 0.8; }
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
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.08) 100%) !important;
  color: var(--primary-color) !important;
  border: none !important;
  font-size: 14px !important;
  cursor: pointer;
  transition: transform 0.2s;
}

.tag-remind:hover {
  transform: scale(1.02);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.12) 100%) !important;
}

.tag-icon {
  color: var(--primary-color);
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
  border-color: rgba(99, 102, 241, 0.3);
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
  color: var(--primary-color);
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
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}
</style>
