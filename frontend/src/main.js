import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import en from 'element-plus/dist/locale/en.mjs'
import zhTw from 'element-plus/dist/locale/zh-tw.mjs'
import App from './App.vue'
import router from './router'
import i18n from './i18n'

const app = createApp(App)
const pinia = createPinia()

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// Element Plus语言包映射
const elementLocales = {
  'zh-CN': zhCn,
  'en-US': en,
  'zh-TW': zhTw
}

app.use(pinia)
app.use(router)
app.use(i18n)
app.use(ElementPlus, {
  locale: elementLocales[i18n.global.locale.value]
})

app.mount('#app')
