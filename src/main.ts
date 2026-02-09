import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles/variables.css'
import './assets/styles/global.css'
import { initCategories } from './composables/useCategories'
import { initRecords } from './composables/useRecords'

// 异步初始化数据
async function initApp(): Promise<void> {
  await Promise.all([initCategories(), initRecords()])
  
  const app = createApp(App)
  app.use(router)
  app.mount('#app')
}

initApp()
