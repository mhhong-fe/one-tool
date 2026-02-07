<script setup>
import { ref, computed } from 'vue'
import { NForm, NFormItem, NSelect, NInput, NButton, useMessage } from 'naive-ui'
import { useCategories } from '../composables/useCategories'
import { useRecords } from '../composables/useRecords'
import { todayStr as getTodayStr } from '../utils/date'
import { getIcon } from '../components/icons'

const message = useMessage()
const { list: categories } = useCategories()
const { add: addRecord } = useRecords()

const categoryId = ref(null)
const detail = ref('')

const todayStr = computed(() => getTodayStr())

const categoryOptions = computed(() =>
  categories.value.map((c) => ({ label: c.name, value: c.id }))
)

const selectedCategory = computed(() =>
  categories.value.find((c) => c.id === categoryId.value)
)

const detailLabel = computed(() => selectedCategory.value?.detailLabel || '详情')
const detailType = computed(() => selectedCategory.value?.detailType || 'text')

function handleSubmit() {
  if (!categoryId.value) {
    message.warning('请选择打卡类目')
    return
  }
  const cat = selectedCategory.value
  if (cat?.detailType === 'number') {
    const n = Number(detail.value)
    if (detail.value === '' || detail.value == null) {
      message.warning('请填写' + (cat.detailLabel || '详情'))
      return
    }
    if (Number.isNaN(n) || n < 0) {
      message.warning('请输入非负数字')
      return
    }
  }
  addRecord({
    categoryId: categoryId.value,
    date: todayStr.value,
    detail: String(detail.value).trim(),
  })
  message.success('打卡成功')
  detail.value = ''
}

function handleClear() {
  categoryId.value = null
  detail.value = ''
}
</script>

<template>
  <div class="page-checkin">
    <header class="page-header">
      <span class="title-icon">{{ getIcon('Write') }}</span>
      <h1 class="page-title">打卡</h1>
      <p class="page-desc">记录今天的努力</p>
    </header>

    <div class="form-card">
      <NForm :model="{ categoryId, detail }" label-placement="top">
        <NFormItem label="选择类目" required>
          <NSelect
            v-model:value="categoryId"
            :options="categoryOptions"
            placeholder="请选择要打卡的类目"
            clearable
            size="large"
          />
        </NFormItem>
        <NFormItem :label="detailLabel" :required="detailType === 'number'">
          <NInput
            v-model:value="detail"
            :type="detailType === 'number' ? 'number' : 'text'"
            :placeholder="'请输入' + detailLabel"
            clearable
            size="large"
            @keyup.enter="handleSubmit"
          />
        </NFormItem>
        <div class="form-actions">
          <NButton type="primary" size="large" class="btn-submit" @click="handleSubmit">
            完成打卡
          </NButton>
          <NButton size="large" class="btn-clear" @click="handleClear">
            清空
          </NButton>
        </div>
      </NForm>
    </div>
  </div>
</template>

<style scoped>
.page-checkin {
  max-width: 420px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 36px;
}

.title-icon {
  display: inline-block;
  font-size: 36px;
  margin-bottom: 12px;
}

.page-title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.page-desc {
  margin: 0;
  font-size: 15px;
  color: var(--text-tertiary);
}

.form-card {
  padding: 32px 28px;
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-soft);
}

.form-card :deep(.n-form-item-label) {
  font-weight: 500;
  color: var(--text-secondary);
}

.form-card :deep(.n-input),
.form-card :deep(.n-base-selection) {
  border-radius: var(--radius-md);
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 28px;
}

.btn-submit {
  padding: 14px 24px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  border-radius: var(--radius-md) !important;
}

.btn-submit:deep(.n-button__content) {
  font-size: 16px;
}

.btn-clear {
  padding: 12px 24px !important;
  color: var(--text-tertiary) !important;
  border-radius: var(--radius-md) !important;
}
</style>
