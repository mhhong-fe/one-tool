import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue'), meta: { title: '总览' } },
  { path: '/checkin', name: 'CheckIn', component: () => import('../views/CheckIn.vue'), meta: { title: '打卡' } },
  { path: '/stats', name: 'Stats', component: () => import('../views/Stats.vue'), meta: { title: '统计' } },
  { path: '/settings', name: 'Settings', component: () => import('../views/Settings.vue'), meta: { title: '设置' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 每日打卡`
  }
})

export default router
