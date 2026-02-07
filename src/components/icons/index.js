/** UTF-8 图标映射 */
export const icons = {
  // 导航 / 操作
  Dashboard: '📊',
  Write: '✏️',
  ChartLine: '📈',
  Setting: '⚙️',
  Add: '➕',
  Edit: '✏️',
  Delete: '🗑️',
  Filter: '🔍',
  Download: '⬇️',
  CheckOne: '✅',
  Info: '⚠️',
  Trophy: '🏆',
  // 类目
  RunLeft: '🏃',
  Code: '💻',
  Book: '📖',
  Swim: '🏊',
  Gym: '💪',
  Bike: '🚴',
  Yoga: '🧘',
  Sleep: '😴',
  Meditate: '🧘‍♂️',
  Coffee: '☕',
  English: '🇬🇧',
  Piano: '🎹',
  Pen: '✒️',
  Camera: '📷',
  ActivitySource: '📌',
}

/** 类目可选图标（用于新建/编辑时选择） */
export const categoryIcons = [
  { key: 'RunLeft', emoji: '🏃', label: '跑步' },
  { key: 'Code', emoji: '💻', label: '刷题' },
  { key: 'Book', emoji: '📖', label: '读书' },
  { key: 'Swim', emoji: '🏊', label: '游泳' },
  { key: 'Gym', emoji: '💪', label: '健身' },
  { key: 'Bike', emoji: '🚴', label: '骑行' },
  { key: 'Yoga', emoji: '🧘', label: '瑜伽' },
  { key: 'Meditate', emoji: '🧘‍♂️', label: '冥想' },
  { key: 'Sleep', emoji: '😴', label: '早睡' },
  { key: 'Coffee', emoji: '☕', label: '早起' },
  { key: 'English', emoji: '🇬🇧', label: '英语' },
  { key: 'Piano', emoji: '🎹', label: '练琴' },
  { key: 'Pen', emoji: '✒️', label: '写作' },
  { key: 'Camera', emoji: '📷', label: '摄影' },
  { key: 'ActivitySource', emoji: '📌', label: '其他' },
]

export function getIcon(name) {
  return icons[name] || icons.ActivitySource
}
