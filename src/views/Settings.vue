<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  NCard,
  NButton,
  NInput,
  NInputNumber,
  NFormItem,
  NForm,
  NRadioGroup,
  NRadio,
  NSpace,
  NPopconfirm,
  useMessage,
  useDialog,
} from 'naive-ui'
import { useCategories } from '../composables/useCategories'
import { useRecords } from '../composables/useRecords'
import { useCategoryGoals } from '../composables/useCategoryGoals'
import { storage } from '../utils/storage'
import { dayjs } from '../utils/date'
import IconFont from '../components/IconFont.vue'
import { categoryIcons } from '../components/icons'

const message = useMessage()
const dialog = useDialog()
const { list: categories, add, update, remove, loadCategories } = useCategories()
const { getByCategoryId, loadRecords } = useRecords()
const { goalsByCategoryId, addGoal, removeGoal, PERIOD_LABEL } = useCategoryGoals()

const newName = ref('')
const newDetailLabel = ref('详情')
const newDetailType = ref<'number' | 'text'>('text')
const newUnitsPerScore = ref<number>(1)
const newIcon = ref<string>('ActivitySource')
const editingId = ref<string | null>(null)
const editingName = ref('')
const editingDetailLabel = ref('')
const editingDetailType = ref<'number' | 'text'>('text')
const editingUnitsPerScore = ref<number>(1)
const editingIcon = ref<string>('ActivitySource')

// 目标新增表单（每个类目编辑时内联显示）
const showNewGoalForm = ref(false)
const newGoalPeriod = ref<'weekly' | 'monthly' | 'yearly'>('monthly')
const newGoalTarget = ref<number>(0)
const newGoalMetric = ref<'count' | 'sum'>('count')

onMounted(async () => {
  await loadCategories()
  await loadRecords()
})

async function handleAddCategory(): Promise<void> {
  const name = newName.value.trim()
  if (!name) {
    message.warning('请输入类目名称')
    return
  }
  const unitsPerScore = newDetailType.value === 'number' ? Math.max(0.01, Number(newUnitsPerScore.value) || 1) : 1
  await add(name, newDetailLabel.value || '详情', newDetailType.value as 'number' | 'text', newIcon.value, 'category-custom', unitsPerScore)
  message.success('添加成功')
  newName.value = ''
  newDetailLabel.value = '详情'
  newDetailType.value = 'text'
  newUnitsPerScore.value = 1
  newIcon.value = 'ActivitySource'
}

function startEdit(c: any): void {
  editingId.value = c.id
  editingName.value = c.name
  editingDetailLabel.value = c.detailLabel || '详情'
  editingDetailType.value = c.detailType || 'text'
  editingUnitsPerScore.value = c.unitsPerScore ?? 1
  editingIcon.value = c.icon || 'ActivitySource'
  showNewGoalForm.value = false
  newGoalPeriod.value = 'monthly'
  newGoalTarget.value = 0
  newGoalMetric.value = 'count'
}

function handleAddGoal(): void {
  if (!editingId.value || !newGoalTarget.value || newGoalTarget.value <= 0) {
    message.warning('请填写大于 0 的目标值')
    return
  }
  addGoal({ categoryId: editingId.value, period: newGoalPeriod.value, target: newGoalTarget.value, metric: newGoalMetric.value })
  showNewGoalForm.value = false
  newGoalTarget.value = 0
  message.success('目标已添加')
}

async function saveEdit(): Promise<void> {
  if (!editingId.value) return
  const name = editingName.value.trim()
  if (!name) {
    message.warning('类目名称不能为空')
    return
  }
  const unitsPerScore = editingDetailType.value === 'number' ? Math.max(0.01, Number(editingUnitsPerScore.value) || 1) : 1
  await update(editingId.value!, {
    name,
    detailLabel: editingDetailLabel.value || '详情',
    detailType: editingDetailType.value as 'number' | 'text',
    unitsPerScore,
    icon: editingIcon.value,
  })
  message.success('已保存')
  editingId.value = null
}

function cancelEdit(): void {
  editingId.value = null
}

async function handleDelete(c: any): Promise<void> {
  const records = getByCategoryId(c.id)
  if (records.length > 0) {
    message.warning(`该类目下已有 ${records.length} 条打卡记录，无法删除。请先删除相关记录。`)
    return
  }
  await remove(c.id)
  message.success('已删除')
}

async function handleExport(): Promise<void> {
  const json = await storage.exportAll()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `one-tool-backup-${dayjs().format('YYYY-MM-DD')}.json`
  a.click()
  URL.revokeObjectURL(url)
  message.success('备份已下载')
}

const fileInput = ref<HTMLInputElement | null>(null)

function handleImportClick(): void {
  fileInput.value?.click()
}

async function handleFileChange(e: Event): Promise<void> {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = async () => {
    const result = await storage.importFrom(reader.result as string)
    if (result.success) {
      await loadCategories()
      await loadRecords()
      message.success('导入成功')
    } else {
      message.error('导入失败：' + (result.error || '无效的 JSON'))
    }
  }
  reader.readAsText(file)
  const target = e.target as HTMLInputElement
  if (target) {
    target.value = ''
  }
}

function handleClearData(): void {
  dialog.warning({
    title: '确认清空',
    content: '将清空所有打卡类目与打卡记录，且无法恢复。确定继续？',
    positiveText: '确定清空',
    negativeText: '取消',
    onPositiveClick: async () => {
      await storage.clear()
      await loadCategories()
      await loadRecords()
      message.success('已清空')
    },
  })
}
</script>

<template>
  <div class="page-settings">
    <header class="page-header">
      <div class="header-content">
        <div class="header-icon-wrapper">
          <IconFont name="Setting" class="title-icon" :size="48" />
        </div>
        <div class="header-text">
          <h1 class="page-title">设置</h1>
          <p class="page-desc">管理类目与数据</p>
        </div>
      </div>
    </header>

    <!-- 类目管理 -->
    <NCard class="card section-card" title="打卡类目管理">
      <NForm label-placement="top" class="form-add">
        <NFormItem label="新类目名称">
          <NInput v-model:value="newName" placeholder="输入类目名称" clearable @keyup.enter="handleAddCategory" />
        </NFormItem>
        <NFormItem label="详情字段名">
          <NInput v-model:value="newDetailLabel" placeholder="如：公里数、刷题数" />
        </NFormItem>
        <NFormItem label="详情类型">
          <NRadioGroup v-model:value="newDetailType">
            <NRadio value="number">数字</NRadio>
            <NRadio value="text">文本</NRadio>
          </NRadioGroup>
        </NFormItem>
        <NFormItem v-if="newDetailType === 'number'" label="换算分数">
          <NInputNumber
            v-model:value="newUnitsPerScore"
            min="0.01"
            step="0.1"
            placeholder="每 N 单位 = 1 分"
            size="large"
          />
          <span class="form-hint">每 {{ newUnitsPerScore || 1 }} {{ newDetailLabel || '单位' }} = 1 分</span>
        </NFormItem>
        <NFormItem label="图标">
          <div class="icon-picker">
            <button
              v-for="opt in categoryIcons"
              :key="opt.key"
              type="button"
              class="icon-option"
              :class="{ active: newIcon === opt.key }"
              :title="opt.label"
              @click="newIcon = opt.key"
            >
              <IconFont v-if="opt.icon" :name="opt.key" :size="20" />
              <span v-else-if="opt.emoji">{{ opt.emoji }}</span>
            </button>
          </div>
        </NFormItem>
        <NButton type="primary" @click="handleAddCategory">
          <span class="btn-with-icon">
            <IconFont name="Add" :size="16" style="margin-right: 4px;" />
            添加类目
          </span>
        </NButton>
      </NForm>

      <ul class="category-list">
        <li v-for="c in categories" :key="c.id" class="category-item">
          <template v-if="editingId === c.id">
            <div class="category-edit-form">
              <div class="edit-row">
                <div class="edit-label">图标</div>
                <div class="icon-picker inline">
                  <button
                    v-for="opt in categoryIcons"
                    :key="opt.key"
                    type="button"
                    class="icon-option small"
                    :class="{ active: editingIcon === opt.key }"
                    :title="opt.label"
                    @click="editingIcon = opt.key"
                  >
                    <IconFont v-if="opt.icon" :name="opt.key" :size="16" />
                    <span v-else-if="opt.emoji">{{ opt.emoji }}</span>
                  </button>
                </div>
              </div>
              <div class="edit-row">
                <div class="edit-label">名称</div>
                <NInput v-model:value="editingName" size="small" placeholder="名称" />
              </div>
              <div class="edit-row">
                <div class="edit-label">详情标签</div>
                <NInput v-model:value="editingDetailLabel" size="small" placeholder="详情标签" />
              </div>
              <div class="edit-row">
                <div class="edit-label">类型</div>
                <NRadioGroup v-model:value="editingDetailType" size="small">
                  <NRadio value="number">数字</NRadio>
                  <NRadio value="text">文本</NRadio>
                </NRadioGroup>
              </div>
              <div v-if="editingDetailType === 'number'" class="edit-row">
                <div class="edit-label">计分规则</div>
                <NInputNumber
                  v-model:value="editingUnitsPerScore"
                  size="small"
                  min="0.01"
                  step="0.1"
                  placeholder="每 N = 1 分"
                  class="input-units"
                />
              </div>
              <div class="edit-actions">
                <NButton size="small" @click="saveEdit">保存</NButton>
                <NButton size="small" secondary @click="cancelEdit">取消</NButton>
              </div>

              <!-- 目标管理 -->
              <div class="goal-section">
                <div class="goal-section-header">
                  <span class="goal-section-title">目标设置</span>
                  <button v-if="!showNewGoalForm" class="btn-add-goal-inline" @click="showNewGoalForm = true">+ 添加</button>
                </div>

                <!-- 已有目标列表 -->
                <div v-if="goalsByCategoryId(editingId!).length > 0" class="goal-tag-list">
                  <div v-for="g in goalsByCategoryId(editingId!)" :key="g.id" class="goal-tag">
                    <span class="goal-tag-period">{{ PERIOD_LABEL[g.period] }}</span>
                    <span class="goal-tag-val">{{ g.target }}{{ g.metric === 'count' ? '次' : editingDetailLabel }}</span>
                    <button class="goal-tag-del" @click="removeGoal(g.id)">×</button>
                  </div>
                </div>
                <p v-else-if="!showNewGoalForm" class="goal-empty-hint">暂无目标</p>

                <!-- 新增目标表单 -->
                <div v-if="showNewGoalForm" class="goal-new-form">
                  <div class="goal-form-row">
                    <div class="goal-form-group">
                      <span class="goal-form-label">周期</span>
                      <div class="period-btns">
                        <button v-for="p in (['weekly','monthly','yearly'] as const)" :key="p"
                          class="period-btn" :class="{ active: newGoalPeriod === p }"
                          @click="newGoalPeriod = p">
                          {{ PERIOD_LABEL[p] }}
                        </button>
                      </div>
                    </div>
                    <div class="goal-form-group">
                      <span class="goal-form-label">指标</span>
                      <div class="period-btns">
                        <button class="period-btn" :class="{ active: newGoalMetric === 'count' }" @click="newGoalMetric = 'count'">次数</button>
                        <button class="period-btn" :class="{ active: newGoalMetric === 'sum' }" @click="newGoalMetric = 'sum'">{{ editingDetailLabel }}</button>
                      </div>
                    </div>
                    <div class="goal-form-group">
                      <span class="goal-form-label">目标值</span>
                      <NInputNumber v-model:value="newGoalTarget" size="small" :min="1" class="goal-target-input" />
                    </div>
                  </div>
                  <div class="goal-form-actions">
                    <NButton size="small" type="primary" @click="handleAddGoal">确认</NButton>
                    <NButton size="small" @click="showNewGoalForm = false">取消</NButton>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="category-info">
              <div class="category-header">
                <IconFont :name="c.icon || 'ActivitySource'" class="cat-icon" :size="22" />
                <span class="cat-name">{{ c.name }}</span>
              </div>
              <div class="category-details">
                <span class="cat-meta">
                  {{ c.detailLabel }} ({{ c.detailType === 'number' ? '数字' : '文本' }})
                  <template v-if="c.detailType === 'number'">
                    · 每 {{ c.unitsPerScore ?? 1 }}{{ c.detailLabel }} = 1分
                  </template>
                </span>
              </div>
            </div>
            <div class="category-actions">
              <NButton size="small" secondary @click="startEdit(c)">
                <span class="btn-with-icon">
                  <IconFont name="Edit" :size="14" style="margin-right: 4px;" />
                  编辑
                </span>
              </NButton>
              <NPopconfirm @positive-click="handleDelete(c)">
                <template #trigger>
                  <NButton size="small" type="error" tertiary>
                    <span class="btn-with-icon">
                      <IconFont name="Delete" :size="14" style="margin-right: 4px;" />
                      删除
                    </span>
                  </NButton>
                </template>
                确定删除该类目？
              </NPopconfirm>
            </div>
          </template>
        </li>
      </ul>
    </NCard>

    <!-- 数据备份 -->
    <NCard class="card section-card" title="数据备份与恢复">
      <input
        ref="fileInput"
        type="file"
        accept=".json,application/json"
        class="hidden-input"
        @change="handleFileChange"
      />
      <NSpace>
        <NButton @click="handleExport">
          <span class="btn-with-icon">
            <IconFont name="Download" :size="16" style="margin-right: 4px;" />
            导出备份 (JSON)
          </span>
        </NButton>
        <NButton @click="handleImportClick">导入备份</NButton>
        <NButton type="error" tertiary @click="handleClearData">清空全部数据</NButton>
      </NSpace>
    </NCard>
  </div>
</template>

<style scoped>
.page-settings {
  max-width: 560px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 40px;
  position: relative;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 28px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%);
  border-radius: var(--radius-xl);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(139, 92, 246, 0.1);
  box-shadow: var(--shadow-sm);
}

.header-icon-wrapper {
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);
}

.title-icon {
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.header-text {
  flex: 1;
}

.page-title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.page-desc {
  margin: 0;
  font-size: 15px;
  color: var(--text-secondary);
  font-weight: 500;
}

.card.section-card {
  margin-bottom: 28px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-soft);
  transition: all 0.2s ease;
}

.card.section-card:hover {
  box-shadow: var(--shadow-md);
}

.card.section-card :deep(.n-card-header) {
  font-size: 16px;
  font-weight: 600;
}

.form-add {
  margin-bottom: 20px;
}

.category-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.category-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  margin-bottom: 12px;
  background: var(--bg-card);
  transition: all 0.2s ease;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

.category-item:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--primary-light);
}

.category-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cat-icon {
  flex-shrink: 0;
  color: var(--primary-color);
}

.cat-name {
  font-weight: 600;
  font-size: 15px;
  color: var(--text-primary);
  flex: 1;
  min-width: 0;
}

.cat-meta {
  font-size: 13px;
  color: var(--text-tertiary);
  line-height: 1.5;
}

.category-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.btn-with-icon {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.form-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.input-units {
  width: 150px;
}

.category-edit-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.edit-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
  width: 100%;
}

.edit-row:has(.icon-picker) {
  align-items: flex-start;
}

.edit-label {
  min-width: 80px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  flex-shrink: 0;
  padding-top: 4px;
}

.edit-row :deep(.n-input),
.edit-row :deep(.n-input-number),
.edit-row :deep(.n-radio-group) {
  flex: 1;
  min-width: 0;
  max-width: 100%;
}

.edit-row .icon-picker {
  flex: 1;
  min-width: 0;
  max-width: 100%;
}

.edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--border-soft);
}

.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
}

.icon-picker.inline {
  flex: 1;
  min-width: 0;
}

.icon-option {
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-secondary);
}

.icon-option:hover {
  border-color: var(--primary-color);
  background: var(--bg-soft);
  color: var(--primary-color);
  transform: scale(1.05);
}

.icon-option.active {
  border-color: var(--primary-color);
  background: var(--primary-soft);
  color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
}

.icon-option.small {
  width: 28px;
  height: 28px;
}

.hidden-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
}

/* ── 目标管理 ─────────────────────── */
.goal-section {
  padding-top: 16px;
  border-top: 1px solid var(--border-soft);
}
.goal-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.goal-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}
.btn-add-goal-inline {
  font-size: 12px;
  color: var(--primary-color);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
}
.btn-add-goal-inline:hover {
  text-decoration: underline;
}
.goal-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 4px;
}
.goal-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--primary-soft);
  border-radius: 20px;
  font-size: 12px;
}
.goal-tag-period {
  color: var(--primary-color);
  font-weight: 600;
}
.goal-tag-val {
  color: var(--text-secondary);
}
.goal-tag-del {
  color: var(--text-tertiary);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
}
.goal-tag-del:hover {
  color: var(--error-color, #d03050);
}
.goal-empty-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  margin: 0;
}
.goal-new-form {
  background: var(--bg-soft, #f8f8f8);
  border-radius: var(--radius-md);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.goal-form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.goal-form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.goal-form-label {
  font-size: 11px;
  color: var(--text-tertiary);
  font-weight: 500;
}
.period-btns {
  display: flex;
  gap: 4px;
}
.period-btn {
  padding: 3px 10px;
  font-size: 12px;
  border: 1px solid var(--border-soft);
  border-radius: 4px;
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}
.period-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}
.period-btn.active {
  background: var(--primary-soft);
  border-color: var(--primary-color);
  color: var(--primary-color);
  font-weight: 600;
}
.goal-target-input {
  width: 100px;
}
.goal-form-actions {
  display: flex;
  gap: 8px;
}
</style>
