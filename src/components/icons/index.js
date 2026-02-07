/** UTF-8 图标映射 */
export const icons = {
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
  RunLeft: '🏃',
  Code: '💻',
  Book: '📖',
  ActivitySource: '📌',
}

export function getIcon(name) {
  return icons[name] || icons.ActivitySource
}
