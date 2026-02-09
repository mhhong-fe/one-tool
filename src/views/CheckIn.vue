<script setup lang="ts">
import { ref, computed, h, watch } from 'vue'
import { NForm, NFormItem, NSelect, NInput, NInputNumber, NButton, useMessage } from 'naive-ui'
import { useCategories } from '../composables/useCategories'
import { useRecords } from '../composables/useRecords'
import { todayStr as getTodayStr } from '../utils/date'
import IconFont from '../components/IconFont.vue'

const message = useMessage()
const { list: categories } = useCategories()
const { add: addRecord } = useRecords()

const categoryId = ref<string | null>(null)
const detail = ref<string>('')
const detailNumber = ref<number | null>(null)

const todayStr = computed(() => getTodayStr())

const categoryOptions = computed(() =>
  categories.value.map((c) => ({
    label: c.name,
    value: c.id,
    icon: c.icon || 'ActivitySource',
  }))
)

const selectedCategory = computed(() =>
  categories.value.find((c) => c.id === categoryId.value)
)

const detailLabel = computed(() => selectedCategory.value?.detailLabel || '详情')
const detailType = computed(() => selectedCategory.value?.detailType || 'text')

// 监听分类变化，重置详情输入
watch(categoryId, () => {
  detail.value = ''
  detailNumber.value = null
})

async function handleSubmit(): Promise<void> {
  if (!categoryId.value) {
    message.warning('请选择打卡类目')
    return
  }
  const cat = selectedCategory.value
  let detailValue: string
  
  if (cat?.detailType === 'number') {
    if (detailNumber.value === null || detailNumber.value === undefined) {
      message.warning('请填写' + (cat.detailLabel || '详情'))
      return
    }
    if (detailNumber.value < 0) {
      message.warning('请输入非负数字')
      return
    }
    detailValue = String(detailNumber.value)
  } else {
    detailValue = String(detail.value || '').trim()
    if (!detailValue) {
      message.warning('请填写' + (cat?.detailLabel || '详情'))
      return
    }
  }
  
  await addRecord({
    categoryId: categoryId.value!,
    date: todayStr.value,
    detail: detailValue,
  })
  message.success('打卡成功')
  detail.value = ''
  detailNumber.value = null
}

function handleClear(): void {
  categoryId.value = null
  detail.value = ''
  detailNumber.value = null
}
</script>

<template>
  <div class="page-checkin">
    <header class="page-header">
      <div class="header-content">
        <div class="header-icon-wrapper">
          <IconFont name="Write" class="title-icon" :size="48" />
        </div>
        <div class="header-text">
          <h1 class="page-title">打卡</h1>
          <p class="page-desc">记录今天的努力</p>
        </div>
      </div>
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
            :render-label="(option: any) => {
              return h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
                h(IconFont, { name: option.icon, size: 18 }),
                h('span', option.label)
              ])
            }"
            :render-option="(option: any) => {
              return h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
                h(IconFont, { name: option.icon, size: 18 }),
                h('span', option.label)
              ])
            }"
          />
        </NFormItem>
        <NFormItem :label="detailLabel" :required="detailType === 'number'">
          <NInputNumber
            v-if="detailType === 'number'"
            v-model:value="detailNumber"
            :placeholder="'请输入' + detailLabel"
            clearable
            size="large"
            :min="0"
            :precision="2"
            @keyup.enter="handleSubmit"
          />
          <NInput
            v-else
            v-model:value="detail"
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
  margin-bottom: 40px;
  position: relative;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 28px;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%);
  border-radius: var(--radius-xl);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(34, 197, 94, 0.1);
  box-shadow: var(--shadow-sm);
}

.header-icon-wrapper {
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-gradient);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.25);
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
