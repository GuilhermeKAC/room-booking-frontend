import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

const pinia = createPinia()
const app = createApp(App)
app.use(pinia).use(router)

import { useAuthStore } from './stores/auth'
const auth = useAuthStore()
auth.loadUser().finally(() => app.mount('#app'))
