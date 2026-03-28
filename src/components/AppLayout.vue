<script setup lang="ts">
import { computed } from 'vue'
import { NLayout, NLayoutSider } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import { useBreakpoint } from '../composables/useBreakpoint'
import IconFont from './IconFont.vue'

const route = useRoute()
const router = useRouter()
const { isDesktop } = useBreakpoint()

const menuOptions = [
  { label: '首页', key: '/', icon: 'Dashboard' },
  { label: 'LeetCode', key: '/leetcode', icon: 'Code' },
  { label: '知识沉淀', key: '/tech', icon: 'Book' },
]

function handleMenuSelect(key: string): void {
  router.push(key)
}

const activeKey = computed(() => route.path || '/')
</script>

<template>
  <NLayout has-sider class="app-layout" style="height: 100dvh; width: 100vw;">
    <NLayoutSider
      v-if="isDesktop"
      bordered
      collapse-mode="width"
      :width="220"
      :collapsed-width="0"
      :show-trigger="false"
      class="layout-sider"
    >
      <!-- Logo -->
      <div class="layout-logo">
        <div class="logo-mark">✳</div>
        <span class="logo-text">目标中心</span>
      </div>

      <!-- 导航 -->
      <nav class="layout-nav">
        <a
          v-for="opt in menuOptions"
          :key="opt.key"
          href="javascript:;"
          class="nav-item"
          :class="{ active: activeKey === opt.key }"
          @click.prevent="handleMenuSelect(opt.key)"
        >
          <IconFont :name="opt.icon" class="nav-icon" :size="18" />
          <span class="nav-label">{{ opt.label }}</span>
        </a>
      </nav>
    </NLayoutSider>

    <div class="layout-main">
      <header v-if="!isDesktop" class="mobile-header">
        <span class="mobile-title">{{ $route.meta?.title || '目标中心' }}</span>
      </header>

      <div class="layout-scroll">
        <main class="main-wrapper">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </main>
      </div>

      <nav v-if="!isDesktop" class="mobile-tab">
        <button
          v-for="opt in menuOptions"
          :key="opt.key"
          type="button"
          class="tab-item"
          :class="{ active: activeKey === opt.key }"
          @click="handleMenuSelect(opt.key)"
        >
          <IconFont :name="opt.icon" class="tab-icon" :size="22" />
          <span class="tab-label">{{ opt.label }}</span>
        </button>
      </nav>
    </div>
  </NLayout>
</template>

<style scoped>
.app-layout {
  height: 100dvh !important;
  width: 100vw !important;
  background: transparent;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── 侧边栏 ─────────────────────────── */
.layout-sider {
  background: var(--sidebar-bg) !important;
  border-right: 1px solid var(--border-soft) !important;
  height: 100dvh !important;
  flex-shrink: 0;
}

.layout-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px 20px 20px;
  border-bottom: 1px solid var(--border-soft);
  margin-bottom: 8px;
}

.logo-mark {
  font-size: 22px;
  color: var(--primary-color);
  line-height: 1;
  flex-shrink: 0;
}

.logo-text {
  font-family: 'Lora', Georgia, serif;
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.2px;
}

.layout-nav {
  padding: 4px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 400;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: var(--bg-soft);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--bg-soft);
  color: var(--text-primary);
  font-weight: 500;
}

.nav-item.active .nav-icon {
  color: var(--primary-color);
}

.nav-icon {
  flex-shrink: 0;
  color: inherit;
  opacity: 0.7;
  transition: opacity 0.15s;
}

.nav-item:hover .nav-icon,
.nav-item.active .nav-icon {
  opacity: 1;
}

/* ── 主内容区 ───────────────────────── */
.layout-main {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.layout-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.main-wrapper {
  max-width: 760px;
  margin: 0 auto;
  padding: 32px 24px;
  width: 100%;
  min-height: 100%;
}

@media (min-width: 1000px) {
  .main-wrapper {
    padding: 48px 56px;
    max-width: 860px;
  }
}

/* ── 移动端 ─────────────────────────── */
.mobile-header {
  flex-shrink: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 52px;
  background: var(--sidebar-bg);
  border-bottom: 1px solid var(--border-soft);
}

.mobile-title {
  font-family: 'Lora', Georgia, serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.mobile-tab {
  flex-shrink: 0;
  z-index: 10;
  display: flex;
  justify-content: space-around;
  padding: 8px 0;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
  background: var(--sidebar-bg);
  border-top: 1px solid var(--border-soft);
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex: 1;
  padding: 6px 8px;
  font-size: 11px;
  color: var(--text-tertiary);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s;
}

.tab-item:hover {
  color: var(--text-secondary);
}

.tab-item.active {
  color: var(--primary-color);
  font-weight: 600;
}

.tab-icon {
  flex-shrink: 0;
  color: inherit;
}

/* ── 页面过渡 ───────────────────────── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
