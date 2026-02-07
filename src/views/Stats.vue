<script setup>
import { ref, computed, h } from 'vue'
import {
  NCard,
  NTabs,
  NTabPane,
  NCheckboxGroup,
  NCheckbox,
  NDataTable,
  NProgress,
  NEmpty,
  NButton,
  NModal,
  NInput,
  NPopover,
  useMessage,
  useDialog,
} from 'naive-ui'
import { useCategories } from '../composables/useCategories'
import { useRecords } from '../composables/useRecords'
import { dayjs } from '../utils/date'
import { recordScore } from '../utils/score'
import { getIcon } from '../components/icons'

const message = useMessage()
const dialog = useDialog()
const { list: categoriesList } = useCategories()
const { list: records, update: updateRecord, remove: removeRecord } = useRecords()

const showEditModal = ref(false)
const editRecordRow = ref(null)
const editRecordDetail = ref('')
const selectedDateStr = ref('')
const showDayDetail = ref(false)

const timeView = ref('grid') // grid | year
const viewMode = ref('detail') // detail | overview
const selectedCategories = ref([])
const displayYear = ref(dayjs().year())

const filteredRecords = computed(() => {
  let list = records.value
  if (selectedCategories.value.length > 0) {
    list = list.filter((r) => selectedCategories.value.includes(r.categoryId))
  }
  return list
})

/** 按日期聚合当日得分 */
const recordScoreByDate = computed(() => {
  const cats = categoriesList.value
  const map = {}
  filteredRecords.value.forEach((r) => {
    const cat = cats.find((c) => c.id === r.categoryId)
    const s = recordScore(r, cat)
    map[r.date] = (map[r.date] || 0) + s
  })
  return map
})

/** 按日期获取打卡记录 */
function getRecordsByDate(dateStr) {
  return filteredRecords.value.filter((r) => r.date === dateStr)
}

/** 按月生成格子：每列一月，只含该月日期，不存在的日期为空。按 1-12 月从左到右排列 */
const contributionByMonth = computed(() => {
  const endDate = dayjs().endOf('day')
  const year = endDate.year()
  const months = []
  for (let m = 0; m < 12; m++) {
    const monthStart = dayjs(`${year}-${String(m + 1).padStart(2, '0')}-01`).startOf('month')
    const monthEnd = monthStart.endOf('month')
    const firstWeekday = monthStart.isoWeekday() // 1=Mon, 7=Sun
    const daysInMonth = monthEnd.date()
    const padStart = firstWeekday - 1 // 首行前的空位
    const totalCells = padStart + daysInMonth
    const padEnd = (7 - (totalCells % 7)) % 7
    const cells = []

    for (let i = 0; i < padStart; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const date = monthStart.date(d)
      const dateStr = date.format('YYYY-MM-DD')
      cells.push({
        dateStr,
        score: recordScoreByDate.value[dateStr] || 0,
        date,
        isFuture: date.isAfter(endDate),
      })
    }
    for (let i = 0; i < padEnd; i++) cells.push(null)

    const weekRows = []
    for (let r = 0; r < cells.length; r += 7) {
      weekRows.push(cells.slice(r, r + 7))
    }
    const numWeeks = weekRows.length
    const weekdayRows = []
    for (let wd = 0; wd < 7; wd++) {
      const row = []
      for (let w = 0; w < numWeeks; w++) {
        row.push(weekRows[w][wd] ?? null)
      }
      weekdayRows.push(row)
    }
    months.push({
      key: `${monthStart.year()}-${monthStart.month()}`,
      label: `${monthStart.month() + 1}月`,
      rows: weekdayRows,
    })
  }
  return months
})

/** 根据分数返回颜色等级 0-4：0分 | 1～3 | 3～6 | 6～10 | 10+ */
function getLevel(score) {
  if (score <= 0) return 0
  if (score < 3) return 1
  if (score < 6) return 2
  if (score < 10) return 3
  return 4
}

const levelColors = [
  'var(--cell-empty)',      // 0
  'var(--cell-level-1)',    // 1～3分
  'var(--cell-level-2)',    // 3～6分
  'var(--cell-level-3)',    // 6～10分
  'var(--cell-level-4)',    // 10+
]
const legendLevels = [
  { color: levelColors[0], label: '0分' },
  { color: levelColors[1], label: '1～3分' },
  { color: levelColors[2], label: '3～6分' },
  { color: levelColors[3], label: '6～10分' },
  { color: levelColors[4], label: '10+分' },
]

function getCellBg(score, isFuture) {
  if (isFuture) return 'var(--cell-empty)'
  return levelColors[getLevel(score)]
}

const selectedDayRecords = computed(() => {
  if (!selectedDateStr.value) return []
  return getRecordsByDate(selectedDateStr.value).map((r) => {
    const cat = categoriesList.value.find((c) => c.id === r.categoryId)
    return {
      ...r,
      categoryName: cat?.name || '-',
      detailLabel: cat?.detailLabel || '详情',
      detailType: cat?.detailType || 'text',
      score: recordScore(r, cat),
    }
  })
})

const selectedDayTotalScore = computed(() =>
  selectedDayRecords.value.reduce((sum, r) => sum + (r.score || 0), 0)
)

const detailLabelToUnit = { 公里数: '公里', 刷题数: '题', 页数: '页' }
function getDetailWithUnit(row) {
  if (row.detail == null || row.detail === '') return '-'
  if (row.detailType !== 'number') return row.detail
  const unit = detailLabelToUnit[row.detailLabel] || row.detailLabel || ''
  return unit ? `${row.detail} ${unit}` : row.detail
}

function openDayDetail(dateStr) {
  selectedDateStr.value = dateStr
  showDayDetail.value = true
}

function handleEditRecord(row) {
  editRecordRow.value = row
  editRecordDetail.value = row.detail || ''
  showEditModal.value = true
}

function saveEditRecord() {
  if (!editRecordRow.value) return
  updateRecord(editRecordRow.value.id, { detail: editRecordDetail.value })
  message.success('已更新')
  showEditModal.value = false
  editRecordRow.value = null
}

function handleDeleteRecord(row) {
  dialog.warning({
    title: '确认删除',
    content: '确定删除这条打卡记录？',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      removeRecord(row.id)
      message.success('已删除')
    },
  })
}

const detailColumns = [
  { title: '类目', key: 'categoryName', width: 120 },
  { title: '详情', key: 'detail', render: (row) => getDetailWithUnit(row) },
  { title: '分数', key: 'score', width: 56, render: (row) => (row.score != null ? row.score.toFixed(1) : '-') },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render: (row) => h('span', { class: 'table-actions' }, [
      h(NButton, { size: 'tiny', tertiary: true, onClick: () => handleEditRecord(row) }, () => '编辑'),
      h(NButton, { size: 'tiny', type: 'error', tertiary: true, onClick: () => handleDeleteRecord(row) }, () => '删除'),
    ]),
  },
]

const yearStats = computed(() => {
  const y = displayYear.value
  const cats = categoriesList.value
  const byMonth = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: 0, score: 0 }))
  filteredRecords.value.forEach((r) => {
    const d = dayjs(r.date)
    if (d.year() !== y) return
    const cat = cats.find((c) => c.id === r.categoryId)
    byMonth[d.month()].total += 1
    byMonth[d.month()].score += recordScore(r, cat)
  })
  return byMonth
})

const yearTotalScore = computed(() =>
  yearStats.value.reduce((sum, m) => sum + m.score, 0)
)

const overviewStats = computed(() => {
  const y = displayYear.value
  const list = filteredRecords.value.filter((r) => dayjs(r.date).year() === y)
  const total = list.length
  const cats = categoriesList.value
  const byCat = {}
  let totalScoreSum = 0
  list.forEach((r) => {
    const cat = cats.find((c) => c.id === r.categoryId)
    const s = recordScore(r, cat)
    totalScoreSum += s
    if (!byCat[r.categoryId]) byCat[r.categoryId] = { count: 0, score: 0 }
    byCat[r.categoryId].count += 1
    byCat[r.categoryId].score += s
  })
  return Object.entries(byCat).map(([id, { count, score }]) => ({
    id,
    name: cats.find((c) => c.id === id)?.name || id,
    count,
    score,
    rate: total === 0 ? 0 : Math.round((count / total) * 100),
    scoreRate: totalScoreSum === 0 ? 0 : Math.round((score / totalScoreSum) * 100),
  }))
})

const categoryColors = ['var(--category-1)', 'var(--category-2)', 'var(--category-3)', 'var(--category-4)', 'var(--category-5)']

function getCategoryColor(index) {
  return categoryColors[index % categoryColors.length]
}

const weekLabels = ['', '一', '二', '三', '四', '五', '六', '日']
</script>

<template>
  <div class="page-stats">
    <header class="page-header">
      <span class="title-icon">{{ getIcon('ChartLine') }}</span>
      <h1 class="page-title">数据统计</h1>
      <p class="page-desc">查看你的打卡记录与趋势</p>
    </header>

    <div class="toolbar">
      <NTabs v-model:value="timeView" type="segment" size="small">
        <NTabPane name="grid" tab="打卡热力图" />
        <NTabPane name="year" tab="年度趋势" />
      </NTabs>
      <div class="filter-row">
        <span class="filter-icon">{{ getIcon('Filter') }}</span>
        <span class="filter-label">类目：</span>
        <NCheckboxGroup v-model:value="selectedCategories">
          <NCheckbox v-for="c in categoriesList" :key="c.id" :value="c.id" :label="c.name" />
        </NCheckboxGroup>
      </div>
    </div>

    <!-- 打卡热力图（LeetCode 风格） -->
    <template v-if="timeView === 'grid'">
      <NCard class="card-contribution">
        <div class="contribution-header">
          <h3>最近一年打卡记录</h3>
          <div class="legend-block">
            <div class="legend">
              <span v-for="(item, i) in legendLevels" :key="i" class="legend-item">
                <span class="legend-cell" :style="{ background: item.color }" />
                <span class="legend-range">{{ item.label }}</span>
              </span>
            </div>
            <p class="legend-hint">点击格子可查看当日明细</p>
          </div>
        </div>
        <div class="contribution-grid-wrap">
          <div class="week-labels">
            <span v-for="i in 7" :key="i" class="week-label">{{ weekLabels[i] }}</span>
          </div>
          <div class="contribution-grid">
            <div v-for="group in contributionByMonth" :key="group.key" class="month-group">
              <div class="month-rows">
                <div v-for="(row, ri) in group.rows" :key="ri" class="month-row">
                  <div
                    v-for="(day, di) in row"
                    :key="di"
                    class="grid-cell"
                    :class="{ future: day?.isFuture, empty: !day }"
                    :style="day ? { background: getCellBg(day.score, day.isFuture) } : {}"
                    :title="day ? `${day.dateStr} · ${day.score.toFixed(1)} 分` : ''"
                    @click="day && !day.isFuture && openDayDetail(day.dateStr)"
                  />
                </div>
              </div>
              <div class="month-label">{{ group.label }}</div>
            </div>
          </div>
        </div>
      </NCard>
    </template>

    <!-- 年度趋势 -->
    <template v-if="timeView === 'year'">
      <NCard class="card-year">
        <div class="year-header">
          <h3>{{ displayYear }} 年各月打卡</h3>
          <span class="year-total-score">累计 {{ yearTotalScore.toFixed(1) }} 分</span>
        </div>
        <div class="year-chart">
          <div v-for="(item, i) in yearStats" :key="i" class="year-bar-wrap">
            <div
              class="year-bar"
              :style="{
                height: (item.total / Math.max(...yearStats.map((x) => x.total), 1)) * 100 + '%',
                backgroundColor: 'var(--primary-color)',
              }"
            />
            <span class="year-label">{{ item.month }}月</span>
          </div>
        </div>
      </NCard>
      <NCard class="card-overview">
        <h3>类目占比</h3>
        <div v-for="(item, i) in overviewStats" :key="item.id" class="progress-row">
          <span class="progress-label">{{ item.name }}</span>
          <div class="progress-bar-wrap">
            <NProgress type="line" :percentage="item.scoreRate" :color="getCategoryColor(i)" :show-indicator="false" />
          </div>
          <span class="progress-value">{{ item.count }}条 · {{ item.score.toFixed(1) }}分 ({{ item.scoreRate }}%)</span>
        </div>
      </NCard>
    </template>

    <!-- 当日明细弹窗 -->
    <NModal
      v-model:show="showDayDetail"
      preset="card"
      :title="selectedDateStr ? dayjs(selectedDateStr).format('YYYY年M月D日') + ' 打卡明细' + (selectedDayTotalScore > 0 ? ` · 共 ${selectedDayTotalScore.toFixed(1)} 分` : '') : ''"
      style="width: 420px;"
      @mask-click="showDayDetail = false"
    >
      <NDataTable
        v-if="selectedDayRecords.length > 0"
        :columns="detailColumns"
        :data="selectedDayRecords"
        :bordered="false"
        size="small"
      />
      <p v-else class="empty-detail">该日暂无打卡记录</p>
    </NModal>

    <NModal v-model:show="showEditModal" preset="dialog" title="编辑打卡详情" positive-text="保存" negative-text="取消" @positive-click="saveEditRecord">
      <NInput v-model:value="editRecordDetail" placeholder="详情" />
    </NModal>
  </div>
</template>

<style scoped>
.page-stats {
  max-width: 100%;
}

.page-header {
  margin-bottom: 28px;
}

.page-header .title-icon {
  display: inline-block;
  font-size: 32px;
  margin-bottom: 8px;
}

.page-title {
  margin: 0 0 6px;
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.page-desc {
  margin: 0;
  font-size: 14px;
  color: var(--text-tertiary);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-soft);
}

.filter-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-icon {
  font-size: 18px;
}

.filter-label {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 贡献图 */
.card-contribution {
  margin-bottom: 24px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-soft);
}

.contribution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
}

.contribution-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.legend-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.legend {
  display: flex;
  align-items: center;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-range {
  font-size: 12px;
  color: var(--text-tertiary);
}

.legend-hint {
  margin: 0;
  font-size: 12px;
  color: var(--text-tertiary);
}

.legend-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.legend-cell {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.contribution-grid-wrap {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.week-labels {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.week-label {
  width: 14px;
  height: 14px;
  min-height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--text-tertiary);
}

.contribution-grid {
  display: flex;
  gap: 12px;
}

.month-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.month-rows {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.month-label {
  font-size: 11px;
  color: var(--text-tertiary);
}

.month-row {
  display: flex;
  gap: 3px;
}

.grid-cell {
  width: 14px;
  height: 14px;
  min-width: 14px;
  min-height: 14px;
  border-radius: 3px;
  cursor: pointer;
  transition: transform 0.1s;
}

.grid-cell:not(.future):not(.empty):hover {
  transform: scale(1.15);
}

.grid-cell.empty {
  background: transparent !important;
  cursor: default;
  pointer-events: none;
}

.grid-cell.future {
  cursor: default;
  opacity: 0.5;
}

.empty-detail {
  margin: 0;
  padding: 24px 0;
  text-align: center;
  color: var(--text-tertiary);
}

/* 年度 */
.card-year,
.card-overview {
  margin-bottom: 24px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-soft);
}

.year-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.year-header h3 {
  margin: 0;
}

.year-total-score {
  font-size: 14px;
  color: var(--text-secondary);
}

.card-year h3,
.card-overview h3 {
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.year-chart {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 120px;
}

.year-bar-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 120px;
}

.year-bar {
  width: 100%;
  max-width: 28px;
  min-height: 4px;
  border-radius: 6px 6px 0 0;
}

.year-label {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 8px;
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.progress-label {
  flex-shrink: 0;
  width: 90px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.progress-bar-wrap {
  flex: 1;
  min-width: 0;
  max-width: 180px;
}

.progress-value {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--text-secondary);
  white-space: nowrap;
}
</style>
