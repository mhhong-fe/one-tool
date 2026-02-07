<script setup>
import { computed } from 'vue'
import { NLayout, NLayoutSider, NLayoutContent } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import { useBreakpoint } from '../composables/useBreakpoint'
import { getIcon } from './icons'

const route = useRoute()
const router = useRouter()
const { isDesktop } = useBreakpoint()

const menuOptions = [
  { label: '总览', key: '/', icon: getIcon('Dashboard') },
  { label: '打卡', key: '/checkin', icon: getIcon('Write') },
  { label: '统计', key: '/stats', icon: getIcon('ChartLine') },
  { label: '设置', key: '/settings', icon: getIcon('Setting') },
]

function handleMenuSelect(key) {
  router.push(key)
}

const activeKey = computed(() => route.path || '/')
</script>

<template>
  <NLayout has-sider class="app-layout">
    <NLayoutSider
      v-if="isDesktop"
      bordered
      collapse-mode="width"
      :width="240"
      :collapsed-width="0"
      :show-trigger="false"
      class="layout-sider"
    >
      <div class="layout-logo">
        <span class="logo-icon" />
        <span class="logo-text">每日打卡</span>
      </div>
      <nav class="layout-nav">
        <a
          v-for="opt in menuOptions"
          :key="opt.key"
          href="javascript:;"
          class="nav-item"
          :class="{ active: activeKey === opt.key }"
          @click.prevent="handleMenuSelect(opt.key)"
        >
          <span class="nav-icon">{{ opt.icon }}</span>
          <span class="nav-label">{{ opt.label }}</span>
        </a>
      </nav>
    </NLayoutSider>

    <NLayout class="layout-main">
      <header v-if="!isDesktop" class="mobile-header">
        <span class="mobile-title">{{ $route.meta?.title || '每日打卡' }}</span>
      </header>

      <NLayoutContent class="layout-content" :native-scrollbar="false">
        <main class="main-wrapper">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </main>
      </NLayoutContent>

      <nav v-if="!isDesktop" class="mobile-tab">
        <button
          v-for="opt in menuOptions"
          :key="opt.key"
          type="button"
          class="tab-item"
          :class="{ active: activeKey === opt.key }"
          @click="handleMenuSelect(opt.key)"
        >
          <span class="tab-icon">{{ opt.icon }}</span>
          <span class="tab-label">{{ opt.label }}</span>
        </button>
      </nav>
    </NLayout>
  </NLayout>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: transparent;
}

.layout-sider {
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(12px);
  border-right: 1px solid var(--border-soft);
}

.layout-logo {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 28px 24px;
}

.logo-icon {
  width: 42px;
  height: 42px;
  background: var(--primary-gradient);
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.35);
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.layout-nav {
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: var(--primary-soft);
  color: var(--primary-color);
}

.nav-item:hover .nav-icon {
  transform: scale(1.08);
}

.nav-item.active {
  background: var(--primary-soft);
  color: var(--primary-color);
  font-weight: 600;
}

.nav-icon {
  flex-shrink: 0;
  font-size: 22px;
  line-height: 1;
  transition: transform 0.2s;
}

.nav-label {
  font-size: 15px;
}

.layout-main {
  position: relative;
  z-index: 1;
}

.main-wrapper {
  max-width: 800px;
  margin: 0 auto;
  padding: 28px 20px;
  padding-bottom: 100px;
}

@media (min-width: 1000px) {
  .main-wrapper {
    padding: 40px 48px;
    padding-bottom: 48px;
    max-width: 880px;
  }
}

.mobile-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 56px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-soft);
}

.mobile-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}

.mobile-tab {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  display: flex;
  justify-content: space-around;
  padding: 12px 8px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--border-soft);
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  padding: 6px 8px;
  font-size: 11px;
  color: var(--text-tertiary);
  background: none;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  min-height: 52px;
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
  font-size: 24px;
  line-height: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
