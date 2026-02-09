import type { IconOption } from '../../types'

/**
 * 使用 Iconify 图标库
 * 图标库：https://icon-sets.iconify.design/
 * 无需注册，直接使用
 */

// 图标映射（格式：图标集:图标名称）
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
  Calendar: 'heroicons:calendar-days-solid',
  CheckCircle: 'heroicons:check-circle-solid',
  
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

/** 类目可选图标（用于新建/编辑时选择） */
export const categoryIcons: IconOption[] = [
  { key: 'RunLeft', icon: 'mdi:run-fast', label: '跑步' },
  { key: 'Code', icon: 'mdi:code-tags', label: '刷题' },
  { key: 'Book', icon: 'mdi:book-open-variant', label: '读书' },
  { key: 'Swim', icon: 'mdi:swim', label: '游泳' },
  { key: 'Gym', icon: 'mdi:dumbbell', label: '健身' },
  { key: 'Bike', icon: 'mdi:bike', label: '骑行' },
  { key: 'Yoga', icon: 'mdi:yoga', label: '瑜伽' },
  { key: 'Meditate', icon: 'mdi:meditation', label: '冥想' },
  { key: 'Sleep', icon: 'mdi:sleep', label: '早睡' },
  { key: 'Coffee', icon: 'mdi:coffee', label: '早起' },
  { key: 'English', icon: 'mdi:translate', label: '英语' },
  { key: 'Piano', icon: 'mdi:piano', label: '练琴' },
  { key: 'Pen', icon: 'mdi:pen', label: '写作' },
  { key: 'Camera', icon: 'mdi:camera', label: '摄影' },
  { key: 'ActivitySource', icon: 'mdi:dots-horizontal', label: '其他' },
]

/**
 * 获取图标名称（用于 Iconify）
 */
export function getIcon(name: string): string {
  return iconMap[name] || iconMap.ActivitySource || 'mdi:dots-horizontal'
}
