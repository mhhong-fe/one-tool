import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles/variables.css'
import './assets/styles/global.css'
import { initCategories } from './composables/useCategories'
import { initRecords } from './composables/useRecords'

initCategories()
initRecords()

const app = createApp(App)
app.use(router)
app.mount('#app')
