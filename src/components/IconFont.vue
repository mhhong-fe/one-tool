<script setup lang="ts">
import { Icon } from '@iconify/vue'

const props = defineProps<{
  name: string
  size?: number | string
  color?: string
  className?: string
}>()

// 图标名称映射
const iconMap: Record<string, string> = {
  // 导航菜单图标（使用 heroicons，简洁现代）
  Dashboard: 'heroicons:home-20-solid',
  Write: 'heroicons:pencil-square-solid',
  ChartLine: 'heroicons:chart-bar-square-solid',
  Setting: 'heroicons:cog-6-tooth-solid',
  
  // 操作图标
  Add: 'heroicons:plus-circle-solid',
  Edit: 'heroicons:pencil-solid',
  Delete: 'heroicons:trash-solid',
  Filter: 'heroicons:funnel-solid',
  Download: 'heroicons:arrow-down-tray-solid',
  CheckOne: 'heroicons:check-circle-solid',
  Info: 'heroicons:information-circle-solid',
  Trophy: 'heroicons:trophy-solid',
  
  // 类目图标（使用 mdi，图标更丰富）
  RunLeft: 'mdi:run-fast',
  Code: 'mdi:code-tags',
  Book: 'mdi:book-open-variant',
  Swim: 'mdi:swim',
  Gym: 'mdi:dumbbell',
  Bike: 'mdi:bike',
  Yoga: 'mdi:yoga',
  Sleep: 'mdi:sleep',
  Meditate: 'mdi:meditation',
  Coffee: 'mdi:coffee',
  English: 'mdi:translate',
  Piano: 'mdi:piano',
  Pen: 'mdi:pen',
  Camera: 'mdi:camera',
  ActivitySource: 'mdi:dots-horizontal',
}

const iconName = iconMap[props.name] || iconMap.ActivitySource || 'mdi:dots-horizontal'

const iconSize = typeof props.size === 'number' ? `${props.size}px` : (props.size || '1em')
</script>

<template>
  <Icon
    :icon="iconName"
    :width="iconSize"
    :height="iconSize"
    :class="className"
    :style="{ color: color }"
    :inline="true"
  />
</template>

<style scoped>
:deep(svg) {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
