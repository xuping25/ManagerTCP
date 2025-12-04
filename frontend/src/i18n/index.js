import { createI18n } from 'vue-i18n'
import zhCN from '../locales/zh-CN'
import enUS from '../locales/en-US'
import zhTW from '../locales/zh-TW'

// 从localStorage获取语言设置，默认为中文
const getDefaultLocale = () => {
  const savedLocale = localStorage.getItem('locale')
  if (savedLocale) {
    return savedLocale
  }

  // 根据浏览器语言自动选择
  const browserLang = navigator.language || navigator.userLanguage
  if (browserLang.startsWith('zh')) {
    if (browserLang === 'zh-TW' || browserLang === 'zh-HK') {
      return 'zh-TW'
    }
    return 'zh-CN'
  } else if (browserLang.startsWith('en')) {
    return 'en-US'
  }

  return 'zh-CN'
}

const i18n = createI18n({
  legacy: false,
  locale: getDefaultLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
    'zh-TW': zhTW
  }
})

export default i18n
