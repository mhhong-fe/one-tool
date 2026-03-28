<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NButton, NInput, NModal, useMessage } from 'naive-ui'
import { useTechGoals } from '../composables/useTechGoals'
import type { TechGoal } from '../types'

const message = useMessage()
const {
  goalList, detail, loading, progress,
  load, updateDetail, exportData,
  goalProgress,
  addGoal, updateGoal, removeGoal,
  addArticle, updateArticle, removeArticle,
} = useTechGoals()

onMounted(() => load())

// ── detail 编辑 ──────────────────────────────────────────
const editingDetail = ref(false)
const detailDraft = ref('')
function startDetailEdit() {
  detailDraft.value = detail.value
  editingDetail.value = true
}
async function saveDetail() {
  await updateDetail(detailDraft.value)
  editingDetail.value = false
}

// ── 添加目标 Modal ────────────────────────────────────────
const showAddGoal = ref(false)
const goalForm = ref({ title: '', detail: '', maxScore: 10 })
function openAddGoal() {
  goalForm.value = { title: '', detail: '', maxScore: 10 }
  showAddGoal.value = true
}
function confirmAddGoal() {
  if (!goalForm.value.title.trim()) {
    message.warning('请填写目标名称')
    return
  }
  addGoal({ ...goalForm.value, maxScore: Number(goalForm.value.maxScore) || 10 })
  showAddGoal.value = false
  message.success('目标已添加')
}

// ── 编辑目标 ──────────────────────────────────────────────
const editingGoalId = ref<string | null>(null)
const editGoalForm = ref({ title: '', detail: '', maxScore: 10 })
function startEditGoal(g: TechGoal) {
  editingGoalId.value = g.id
  editGoalForm.value = { title: g.title, detail: g.detail, maxScore: g.maxScore }
}
function saveEditGoal(id: string) {
  updateGoal(id, { ...editGoalForm.value, maxScore: Number(editGoalForm.value.maxScore) || 10 })
  editingGoalId.value = null
  message.success('已保存')
}

// ── 展开/折叠 ─────────────────────────────────────────────
const expanded = ref<Set<string>>(new Set())
function toggleExpand(id: string) {
  if (expanded.value.has(id)) expanded.value.delete(id)
  else expanded.value.add(id)
  expanded.value = new Set(expanded.value)
}

// ── 添加文章 ──────────────────────────────────────────────
const addingArticleGoalId = ref<string | null>(null)
const articleForm = ref({ title: '', url: '', score: 5, note: '' })
function openAddArticle(goalId: string) {
  addingArticleGoalId.value = goalId
  articleForm.value = { title: '', url: '', score: 5, note: '' }
}
function confirmAddArticle(goalId: string) {
  if (!articleForm.value.title.trim()) {
    message.warning('请填写文章标题')
    return
  }
  addArticle(goalId, { ...articleForm.value, score: Number(articleForm.value.score) || 0 })
  addingArticleGoalId.value = null
  message.success('文章已添加')
}
</script>

<template>
  <div class="page-tech">
    <!-- 页眉 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">知识沉淀</h1>
        <span v-if="loading" class="loading-badge">加载中...</span>
      </div>
      <NButton size="small" @click="exportData">导出 JSON</NButton>
    </div>

    <!-- detail 卡片 -->
    <div class="detail-card">
      <div v-if="!editingDetail" class="detail-text" @click="startDetailEdit">
        <span v-if="detail">{{ detail }}</span>
        <span v-else class="placeholder">点击添加整体说明...</span>
      </div>
      <div v-else class="detail-edit">
        <NInput
          v-model:value="detailDraft"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 6 }"
          placeholder="整体说明"
          @blur="saveDetail"
          @keydown.enter.ctrl="saveDetail"
        />
      </div>
    </div>

    <!-- 总进度 -->
    <div class="total-progress-card">
      <div class="total-progress-header">
        <span class="total-label">综合进度</span>
        <span class="total-pct">{{ progress.pct }}%</span>
      </div>
      <div class="progress-bar-bg">
        <div
          class="progress-bar-fill"
          :style="{ width: progress.pct + '%', background: 'linear-gradient(90deg, #E8906E, #D97757)' }"
        />
      </div>
    </div>

    <!-- 目标列表 -->
    <div class="goals-list">
      <div v-for="goal in goalList" :key="goal.id" class="goal-card">
        <!-- 目标头部 -->
        <div class="goal-header">
          <div v-if="editingGoalId !== goal.id" class="goal-header-view" @click="toggleExpand(goal.id)">
            <span class="goal-title">{{ goal.title }}</span>
            <span class="goal-maxscore-badge">满分 {{ goal.maxScore }}</span>
          </div>
          <div v-else class="goal-header-edit">
            <NInput v-model:value="editGoalForm.title" placeholder="目标名称" size="small" style="flex:1" />
            <NInput v-model:value="editGoalForm.maxScore" placeholder="满分" size="small" style="width:70px" />
          </div>
          <div class="goal-actions">
            <template v-if="editingGoalId !== goal.id">
              <button class="icon-btn" @click.stop="startEditGoal(goal)">编辑</button>
              <button class="icon-btn danger" @click.stop="removeGoal(goal.id)">删除</button>
            </template>
            <template v-else>
              <button class="icon-btn primary" @click.stop="saveEditGoal(goal.id)">保存</button>
              <button class="icon-btn" @click.stop="editingGoalId = null">取消</button>
            </template>
          </div>
        </div>

        <!-- 展开内容 -->
        <template v-if="expanded.has(goal.id) || editingGoalId === goal.id">
          <!-- detail 编辑（编辑模式） -->
          <div v-if="editingGoalId === goal.id" class="goal-detail-edit">
            <NInput
              v-model:value="editGoalForm.detail"
              type="textarea"
              :autosize="{ minRows: 2 }"
              placeholder="目标描述"
              size="small"
            />
          </div>

          <!-- detail 展示 -->
          <div v-else-if="goal.detail" class="goal-detail-text">{{ goal.detail }}</div>

          <!-- 进度条 -->
          <div class="goal-progress-row">
            <div class="progress-bar-bg">
              <div
                class="progress-bar-fill"
                :style="{ width: goalProgress(goal).pct + '%', background: 'linear-gradient(90deg, #E8906E, #D97757)' }"
              />
            </div>
            <span class="goal-progress-label">
              平均分 {{ goalProgress(goal).avgScore.toFixed(1) }} / 10
              &nbsp;·&nbsp; {{ goalProgress(goal).pct }}%
            </span>
          </div>

          <!-- 文章列表 -->
          <div class="articles-list">
            <div v-for="article in goal.articles" :key="article.id" class="article-row">
              <a
                v-if="article.url"
                :href="article.url"
                target="_blank"
                rel="noopener"
                class="article-title-link"
              >{{ article.title }} ↗</a>
              <span v-else class="article-title">{{ article.title }}</span>

              <div class="article-score-row">
                <label class="score-label">评分</label>
                <input
                  type="number"
                  :value="article.score"
                  min="0"
                  max="10"
                  step="1"
                  class="score-input"
                  @change="(e) => updateArticle(goal.id, article.id, { score: Number((e.target as HTMLInputElement).value) })"
                />
                <span class="score-max">/10</span>
              </div>

              <div v-if="article.note" class="article-note">{{ article.note }}</div>

              <button class="icon-btn danger small" @click="removeArticle(goal.id, article.id)">删除</button>
            </div>
          </div>

          <!-- 添加文章 -->
          <div v-if="addingArticleGoalId === goal.id" class="add-article-form">
            <NInput v-model:value="articleForm.title" placeholder="文章标题" size="small" />
            <NInput v-model:value="articleForm.url" placeholder="链接（可选）" size="small" />
            <div class="form-row">
              <label class="score-label">评分</label>
              <input v-model.number="articleForm.score" type="number" min="0" max="10" class="score-input" />
              <span class="score-max">/10</span>
            </div>
            <NInput v-model:value="articleForm.note" placeholder="备注（可选）" size="small" />
            <div class="form-btns">
              <NButton size="small" type="primary" @click="confirmAddArticle(goal.id)">确认</NButton>
              <NButton size="small" @click="addingArticleGoalId = null">取消</NButton>
            </div>
          </div>
          <button v-else class="add-article-btn" @click="openAddArticle(goal.id)">+ 添加文章</button>
        </template>

        <!-- 折叠时显示进度摘要 -->
        <div v-else class="goal-summary">
          <div class="progress-bar-bg slim">
            <div
              class="progress-bar-fill"
              :style="{ width: goalProgress(goal).pct + '%', background: 'linear-gradient(90deg, #E8906E, #D97757)' }"
            />
          </div>
          <span class="goal-summary-label">{{ goalProgress(goal).pct }}% · {{ goal.articles.length }} 篇</span>
        </div>
      </div>
    </div>

    <!-- 添加目标按钮 -->
    <div class="add-goal-area">
      <NButton type="primary" @click="openAddGoal">+ 添加目标</NButton>
    </div>

    <!-- 添加目标 Modal -->
    <NModal v-model:show="showAddGoal" preset="card" title="新建目标" style="max-width: 420px">
      <div class="modal-form">
        <NInput v-model:value="goalForm.title" placeholder="目标名称" />
        <NInput
          v-model:value="goalForm.detail"
          type="textarea"
          :autosize="{ minRows: 2 }"
          placeholder="目标描述（可选）"
        />
        <div class="form-row">
          <label class="form-label">满分值</label>
          <NInput v-model:value="goalForm.maxScore" placeholder="10" style="width:100px" />
        </div>
      </div>
      <template #footer>
        <div style="display:flex; gap:8px; justify-content:flex-end">
          <NButton @click="showAddGoal = false">取消</NButton>
          <NButton type="primary" @click="confirmAddGoal">确认</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.page-tech {
  max-width: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.loading-badge {
  font-size: 13px;
  color: var(--text-tertiary);
}

.detail-card {
  padding: 16px 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  margin-bottom: 20px;
  cursor: text;
}

.detail-text {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  white-space: pre-wrap;
}

.placeholder {
  color: var(--text-tertiary);
  font-style: italic;
}

.total-progress-card {
  padding: 20px 24px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  margin-bottom: 24px;
}

.total-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.total-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.total-pct {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-color);
}

.progress-bar-bg {
  height: 8px;
  background: var(--border-soft);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-bg.slim {
  height: 5px;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
}

.goals-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.goal-card {
  padding: 20px 22px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.goal-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.goal-header-view {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.goal-header-edit {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.goal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.goal-maxscore-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--primary-soft);
  color: var(--primary-color);
  font-weight: 600;
  flex-shrink: 0;
}

.goal-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.icon-btn {
  padding: 4px 10px;
  font-size: 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.icon-btn:hover {
  background: var(--primary-soft);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.icon-btn.danger:hover {
  background: rgba(239, 68, 68, 0.08);
  border-color: #ef4444;
  color: #ef4444;
}

.icon-btn.primary {
  background: var(--primary-soft);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.icon-btn.small {
  padding: 2px 8px;
  font-size: 11px;
}

.goal-detail-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  white-space: pre-wrap;
  padding: 8px 12px;
  background: var(--bg-soft);
  border-radius: var(--radius-md);
}

.goal-progress-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.goal-progress-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.article-row {
  padding: 12px 14px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.article-title-link {
  font-size: 14px;
  font-weight: 500;
  color: var(--primary-color);
  text-decoration: none;
  word-break: break-all;
}

.article-title-link:hover {
  text-decoration: underline;
}

.article-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.article-score-row,
.form-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.score-label,
.form-label {
  font-size: 12px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.score-input {
  width: 52px;
  padding: 3px 6px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-primary);
  background: transparent;
  text-align: center;
}

.score-max {
  font-size: 12px;
  color: var(--text-tertiary);
}

.article-note {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: pre-wrap;
}

.add-article-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--bg-soft);
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-color);
}

.form-btns {
  display: flex;
  gap: 8px;
}

.add-article-btn {
  padding: 8px 0;
  font-size: 13px;
  color: var(--primary-color);
  background: transparent;
  border: 1px dashed var(--primary-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s;
  width: 100%;
}

.add-article-btn:hover {
  background: var(--primary-soft);
}

.goal-summary {
  display: flex;
  align-items: center;
  gap: 10px;
}

.goal-summary .progress-bar-bg {
  flex: 1;
}

.goal-summary-label {
  font-size: 12px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.add-goal-area {
  margin-top: 8px;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
