/**
 * Iconify 图标映射配置
 * 使用 Iconify 图标库，无需注册，直接使用
 * 图标库：https://icon-sets.iconify.design/
 * 
 * 推荐的图标集：
 * - heroicons (简洁现代，适合C端)
 * - mdi (Material Design，图标丰富)
 * - carbon (IBM风格，专业)
 * - tabler (开源，风格统一)
 */

// 图标映射（格式：图标集:图标名称）
export const iconMap: Record<string, string> = {
  // 导航菜单图标（使用 heroicons，简洁现代）
  Dashboard: 'heroicons:home-20-solid', // 总览 - 首页图标
  Write: 'heroicons:pencil-square-solid', // 打卡 - 编辑图标
  ChartLine: 'heroicons:chart-bar-square-solid', // 统计 - 图表图标
  Setting: 'heroicons:cog-6-tooth-solid', // 设置 - 齿轮图标
  
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

/**
 * 获取图标名称
 */
export function getIconName(name: string): string {
  return iconMap[name] || iconMap.ActivitySource || 'mdi:dots-horizontal'
}
