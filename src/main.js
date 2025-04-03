import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './main.css'

// 引入服务适配层，确保环境兼容性
import './utils/services-adapter'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')