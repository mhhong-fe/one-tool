import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue'), meta: { title: '首页' } },
  { path: '/leetcode', name: 'LeetCode', component: () => import('../views/LeetCode.vue'), meta: { title: 'LeetCode' } },
  { path: '/tech', name: 'TechGoals', component: () => import('../views/TechGoals.vue'), meta: { title: '知识沉淀' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 目标中心`
  }
})

export default router
