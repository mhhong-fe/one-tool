<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  percentage: number
  colorFrom: string
  colorTo: string
  size?: number
  loading?: boolean
  theme?: 'dark' | 'light'
}>(), {
  size: 160,
  loading: false,
  theme: 'dark',
})

const uid = Math.random().toString(36).slice(2)
const gradId = `ring-grad-${uid}`
const glowId  = `ring-glow-${uid}`

const R = 66
const SW = 14
const C = 80
const circumference = 2 * Math.PI * R  // ≈ 414.69

const spinnerDash = circumference * 0.25
const spinnerGap  = circumference * 0.75

const trackColor = computed(() =>
  props.theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
)
const textColor = computed(() =>
  props.theme === 'light' ? 'var(--text-primary)' : '#fff'
)
const symColor = computed(() =>
  props.theme === 'light' ? 'var(--text-secondary)' : 'rgba(255,255,255,0.8)'
)
const dotColor = computed(() =>
  props.theme === 'light' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.7)'
)

const targetOffset = computed(() => {
  const pct = Math.min(100, Math.max(0, props.percentage))
  return circumference * (1 - pct / 100)
})

const animatedOffset = ref(circumference)
const animatedPct    = ref(0)

let rafId: number | null = null

function animateTo(target: number) {
  if (rafId !== null) cancelAnimationFrame(rafId)

  const targetPct  = Math.round(Math.min(100, Math.max(0, props.percentage)))
  const startOffset = animatedOffset.value
  const startPct    = animatedPct.value
  const duration    = 1400
  const startTime   = performance.now()

  function easeOut(t: number) { return 1 - Math.pow(1 - t, 3) }

  function step(now: number) {
    const t = Math.min(1, (now - startTime) / duration)
    const e = easeOut(t)
    animatedOffset.value = startOffset + (target - startOffset) * e
    animatedPct.value    = Math.round(startPct + (targetPct - startPct) * e)
    if (t < 1) {
      rafId = requestAnimationFrame(step)
    } else {
      animatedOffset.value = target
      animatedPct.value    = targetPct
      rafId = null
    }
  }
  rafId = requestAnimationFrame(step)
}

function triggerEntry() {
  animatedOffset.value = circumference
  animatedPct.value    = 0
  requestAnimationFrame(() => requestAnimationFrame(() => animateTo(targetOffset.value)))
}

watch(() => props.loading, (isLoading) => { if (!isLoading) triggerEntry() })
onMounted(() => { if (!props.loading) triggerEntry() })
</script>

<template>
  <div class="ring-wrap" :style="{ width: size + 'px', height: size + 'px' }">
    <svg :width="size" :height="size" viewBox="0 0 160 160" fill="none">
      <defs>
        <linearGradient :id="gradId" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   :stop-color="colorFrom" />
          <stop offset="100%" :stop-color="colorTo" />
        </linearGradient>
        <filter :id="glowId" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- 背景轨道 -->
      <circle :cx="C" :cy="C" :r="R" :stroke-width="SW" :stroke="trackColor" fill="none" />

      <!-- loading 旋转弧 -->
      <template v-if="loading">
        <circle :cx="C" :cy="C" :r="R" :stroke-width="SW" :stroke="`url(#${gradId})`"
          fill="none" stroke-linecap="round"
          :stroke-dasharray="`${spinnerDash} ${spinnerGap}`"
          :transform="`rotate(-90 ${C} ${C})`" class="ring-spinner" />
        <circle :cx="C" :cy="C" :r="R" :stroke-width="SW + 4" :stroke="`url(#${gradId})`"
          fill="none" stroke-linecap="round"
          :stroke-dasharray="`${spinnerDash} ${spinnerGap}`"
          :transform="`rotate(-90 ${C} ${C})`" :filter="`url(#${glowId})`"
          class="ring-spinner" opacity="0.35" />
      </template>

      <!-- 进度弧 -->
      <template v-else>
        <circle :cx="C" :cy="C" :r="R" :stroke-width="SW + 4" :stroke="`url(#${gradId})`"
          fill="none" stroke-linecap="round"
          :stroke-dasharray="circumference" :stroke-dashoffset="animatedOffset"
          :transform="`rotate(-90 ${C} ${C})`" :filter="`url(#${glowId})`" opacity="0.35" />
        <circle :cx="C" :cy="C" :r="R" :stroke-width="SW" :stroke="`url(#${gradId})`"
          fill="none" stroke-linecap="round"
          :stroke-dasharray="circumference" :stroke-dashoffset="animatedOffset"
          :transform="`rotate(-90 ${C} ${C})`" />
      </template>
    </svg>

    <div class="ring-center">
      <span v-if="loading" class="ring-dots">
        <span class="dot" style="--i:0" :style="{ background: dotColor }" />
        <span class="dot" style="--i:1" :style="{ background: dotColor }" />
        <span class="dot" style="--i:2" :style="{ background: dotColor }" />
      </span>
      <span v-else class="ring-pct" :style="{ color: textColor }">
        {{ animatedPct }}<span class="ring-sym" :style="{ color: symColor }">%</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.ring-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ring-wrap svg {
  position: absolute;
  top: 0; left: 0;
}
.ring-spinner {
  transform-origin: 80px 80px;
  animation: ring-spin 1s linear infinite;
}
@keyframes ring-spin {
  to { transform: rotate(360deg); }
}
.ring-center {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ring-pct {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -1px;
}
.ring-sym {
  font-size: 18px;
  font-weight: 500;
}
.ring-dots {
  display: flex;
  gap: 6px;
  align-items: center;
}
.dot {
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: dot-bounce 1.2s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.2s);
}
@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40%           { transform: scale(1);   opacity: 1; }
}
</style>
