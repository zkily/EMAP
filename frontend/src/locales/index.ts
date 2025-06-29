import { createI18n } from 'vue-i18n'
import ja from './ja'
import zh from './zh'

const i18n = createI18n({
  locale: 'ja',
  fallbackLocale: 'ja',
  legacy: false,
  globalInjection: true,
  messages: {
    ja,
    zh,
  },
})

export default i18n
