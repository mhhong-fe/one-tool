<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLeetCode } from '../composables/useLeetCode'
import { useTechGoals } from '../composables/useTechGoals'
import GoalRing from '../components/GoalRing.vue'

const router = useRouter()
const { stats: lcStats, loading: lcLoading, load: loadLC } = useLeetCode()
const { progress: techProgress, loading: techLoading, load: loadTech } = useTechGoals()

const lcPct = computed(() => {
  const { mastered, total } = lcStats.value
  if (total === 0) return 0
  return Math.min(100, Math.round((mastered / total) * 100))
})

onMounted(() => {
  loadLC()
  loadTech()
})
</script>

<template>
  <div class="page-home">
    <h1 class="page-title">目标中心</h1>
    <p class="page-sub">追踪你的成长轨迹</p>

    <div class="goal-grid">
      <!-- LeetCode 卡片 -->
      <div class="goal-card card-lc" @click="router.push('/leetcode')">
        <div class="card-accent" />
        <div class="card-ring">
          <GoalRing
            :percentage="lcPct"
            color-from="#D97757"
            color-to="#F4A261"
            :size="148"
            :loading="lcLoading"
            theme="light"
          />
        </div>
        <div class="card-info">
          <div class="card-name">LeetCode</div>
          <div class="card-desc">算法题刷题记录</div>
          <div class="card-stats">
            <span class="stat-item">
              <span class="stat-val lc-color">{{ lcStats.mastered }}</span>
              <span class="stat-key">已掌握</span>
            </span>
            <span class="stat-divider">/</span>
            <span class="stat-item">
              <span class="stat-val">{{ lcStats.total }}</span>
              <span class="stat-key">总题数</span>
            </span>
          </div>
        </div>
      </div>

      <!-- 知识沉淀卡片 -->
      <div class="goal-card card-tech" @click="router.push('/tech')">
        <div class="card-accent" />
        <div class="card-ring">
          <GoalRing
            :percentage="techProgress.pct"
            color-from="#059669"
            color-to="#6EE7B7"
            :size="148"
            :loading="techLoading"
            theme="light"
          />
        </div>
        <div class="card-info">
          <div class="card-name">知识沉淀</div>
          <div class="card-desc">深度学习目标追踪</div>
          <div class="card-stats">
            <span class="stat-item">
              <span class="stat-val tech-color">{{ techProgress.pct }}</span>
              <span class="stat-key">综合进度 %</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-home {
  max-width: 100%;
}

.page-title {
  margin: 0 0 6px;
  font-size: 30px;
  font-weight: 700;
  color: var(--text-primary);
}

.page-sub {
  margin: 0 0 36px;
  font-size: 14px;
  color: var(--text-tertiary);
}

.goal-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .goal-grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* ── 卡片 ── */
.goal-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 32px 28px 28px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-xl);
  cursor: pointer;
  overflow: hidden;
  transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
  box-shadow: var(--shadow-sm);
}

.goal-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

/* 顶部彩色边框条 */
.card-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

.card-lc .card-accent {
  background: linear-gradient(90deg, #D97757, #F4A261);
}
.card-lc:hover {
  border-color: rgba(217, 119, 87, 0.3);
}

.card-tech .card-accent {
  background: linear-gradient(90deg, #059669, #6EE7B7);
}
.card-tech:hover {
  border-color: rgba(5, 150, 105, 0.3);
}

/* ── 圆环 ── */
.card-ring {
  flex-shrink: 0;
}

/* ── 文字 ── */
.card-info {
  text-align: center;
  width: 100%;
}

.card-name {
  font-family: 'Lora', Georgia, serif;
  font-size: 19px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.card-desc {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 18px;
}

.card-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-val {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-val.lc-color   { color: #D97757; }
.stat-val.tech-color { color: #059669; }

.stat-key {
  font-size: 11px;
  color: var(--text-tertiary);
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.stat-divider {
  font-size: 18px;
  color: var(--border-color);
  margin-bottom: 12px;
}
</style>
