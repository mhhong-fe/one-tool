<script setup>
import { ref, onMounted } from 'vue'
import {
  NCard,
  NButton,
  NInput,
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
import { storage } from '../utils/storage'
import { dayjs } from '../utils/date'
import { getIcon, categoryIcons } from '../components/icons'

const message = useMessage()
const dialog = useDialog()
const { list: categories, add, update, remove, loadCategories } = useCategories()
const { getByCategoryId, loadRecords } = useRecords()

const newName = ref('')
const newDetailLabel = ref('详情')
const newDetailType = ref('text')
const newUnitsPerScore = ref(1)
const newIcon = ref('ActivitySource')
const editingId = ref(null)
const editingName = ref('')
const editingDetailLabel = ref('')
const editingDetailType = ref('text')
const editingUnitsPerScore = ref(1)
const editingIcon = ref('ActivitySource')

onMounted(() => {
  loadCategories()
  loadRecords()
})

function handleAddCategory() {
  const name = newName.value.trim()
  if (!name) {
    message.warning('请输入类目名称')
    return
  }
  const unitsPerScore = newDetailType.value === 'number' ? Math.max(0.01, Number(newUnitsPerScore.value) || 1) : 1
  add(name, newDetailLabel.value || '详情', newDetailType.value, newIcon.value, 'category-custom', unitsPerScore)
  message.success('添加成功')
  newName.value = ''
  newDetailLabel.value = '详情'
  newDetailType.value = 'text'
  newUnitsPerScore.value = 1
  newIcon.value = 'ActivitySource'
}

function startEdit(c) {
  editingId.value = c.id
  editingName.value = c.name
  editingDetailLabel.value = c.detailLabel || '详情'
  editingDetailType.value = c.detailType || 'text'
  editingUnitsPerScore.value = c.unitsPerScore ?? 1
  editingIcon.value = c.icon || 'ActivitySource'
}

function saveEdit() {
  if (!editingId.value) return
  const name = editingName.value.trim()
  if (!name) {
    message.warning('类目名称不能为空')
    return
  }
  const unitsPerScore = editingDetailType.value === 'number' ? Math.max(0.01, Number(editingUnitsPerScore.value) || 1) : 1
  update(editingId.value, {
    name,
    detailLabel: editingDetailLabel.value || '详情',
    detailType: editingDetailType.value || 'text',
    unitsPerScore,
    icon: editingIcon.value,
  })
  message.success('已保存')
  editingId.value = null
}

function cancelEdit() {
  editingId.value = null
}

function handleDelete(c) {
  const records = getByCategoryId(c.id)
  if (records.length > 0) {
    message.warning(`该类目下已有 ${records.length} 条打卡记录，无法删除。请先删除相关记录。`)
    return
  }
  remove(c.id)
  message.success('已删除')
}

function handleExport() {
  const json = storage.exportAll()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `one-tool-backup-${dayjs().format('YYYY-MM-DD')}.json`
  a.click()
  URL.revokeObjectURL(url)
  message.success('备份已下载')
}

const fileInput = ref(null)

function handleImportClick() {
  fileInput.value?.click()
}

function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const result = storage.importFrom(reader.result)
    if (result.success) {
      loadCategories()
      loadRecords()
      message.success('导入成功')
    } else {
      message.error('导入失败：' + (result.error || '无效的 JSON'))
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}

function handleClearData() {
  dialog.warning({
    title: '确认清空',
    content: '将清空所有打卡类目与打卡记录，且无法恢复。确定继续？',
    positiveText: '确定清空',
    negativeText: '取消',
    onPositiveClick: () => {
      storage.clear()
      loadCategories()
      loadRecords()
      message.success('已清空')
    },
  })
}
</script>

<template>
  <div class="page-settings">
    <header class="page-header">
      <span class="title-icon">{{ getIcon('Setting') }}</span>
      <h1 class="page-title">设置</h1>
      <p class="page-desc">管理类目与数据</p>
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
          <NInput
            v-model:value="newUnitsPerScore"
            type="number"
            min="0.01"
            step="0.1"
            placeholder="每 N 单位 = 1 分"
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
              {{ opt.emoji }}
            </button>
          </div>
        </NFormItem>
        <NButton type="primary" @click="handleAddCategory">
          <span class="btn-with-icon">{{ getIcon('Add') }} 添加类目</span>
        </NButton>
      </NForm>

      <ul class="category-list">
        <li v-for="c in categories" :key="c.id" class="category-item">
          <template v-if="editingId === c.id">
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
                {{ opt.emoji }}
              </button>
            </div>
            <NInput v-model:value="editingName" size="small" placeholder="名称" />
            <NInput v-model:value="editingDetailLabel" size="small" placeholder="详情标签" />
            <NRadioGroup v-model:value="editingDetailType" size="small">
              <NRadio value="number">数字</NRadio>
              <NRadio value="text">文本</NRadio>
            </NRadioGroup>
            <NInput
              v-if="editingDetailType === 'number'"
              v-model:value="editingUnitsPerScore"
              type="number"
              size="small"
              min="0.01"
              placeholder="每 N = 1 分"
              class="input-units"
            />
            <NButton size="small" @click="saveEdit">保存</NButton>
            <NButton size="small" secondary @click="cancelEdit">取消</NButton>
          </template>
          <template v-else>
            <span class="cat-icon">{{ getIcon(c.icon || 'ActivitySource') }}</span>
            <span class="cat-name">{{ c.name }}</span>
            <span class="cat-meta">
              {{ c.detailLabel }} ({{ c.detailType === 'number' ? '数字' : '文本' }})
              <template v-if="c.detailType === 'number'">
                · 每 {{ c.unitsPerScore ?? 1 }}{{ c.detailLabel }} = 1分
              </template>
            </span>
            <NButton size="small" secondary @click="startEdit(c)">
              <span class="btn-with-icon">{{ getIcon('Edit') }} 编辑</span>
            </NButton>
            <NPopconfirm @positive-click="handleDelete(c)">
              <template #trigger>
                <NButton size="small" type="error" tertiary>
                  <span class="btn-with-icon">{{ getIcon('Delete') }} 删除</span>
                </NButton>
              </template>
              确定删除该类目？
            </NPopconfirm>
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
          <span class="btn-with-icon">{{ getIcon('Download') }} 导出备份 (JSON)</span>
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
  margin-bottom: 32px;
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
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 20px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  margin-bottom: 12px;
  transition: all 0.2s ease;
}

.category-item:hover {
  box-shadow: var(--shadow-sm);
}

.cat-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.cat-name {
  font-weight: 600;
  font-size: 15px;
  color: var(--text-primary);
}

.cat-meta {
  font-size: 13px;
  color: var(--text-tertiary);
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
  width: 90px;
}

.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.icon-picker.inline {
  flex-shrink: 0;
}

.icon-option {
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-option:hover {
  border-color: var(--primary-color);
  background: var(--bg-soft);
}

.icon-option.active {
  border-color: var(--primary-color);
  background: var(--primary-soft);
}

.icon-option.small {
  width: 28px;
  height: 28px;
  font-size: 14px;
}

.hidden-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
}
</style>
