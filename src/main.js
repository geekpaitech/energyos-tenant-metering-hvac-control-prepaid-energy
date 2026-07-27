import Vue from 'vue'
import App from './App.vue'
import i18n from './i18n'
import router from './router'
import store from './store'
// main.js
import * as echarts from 'echarts'
import VueKonva from 'vue-konva'

import 'element-ui/lib/theme-chalk/index.css'

// icon
import '@/assets/iconfont/iconfont.css'

// 引入样式重置
import 'normalize.css/normalize.css'

// 引入进度条样式
import 'nprogress/nprogress.css'

// 引入全局样式
import '@/assets/styles/index.scss'
import '@/assets/styles/locale-en-global.scss'

// 引入HTTP请求封装
import '@/utils/request'
import { getApiErrorMessage, notifyApiError } from '@/utils/apiError'

// 引入权限控制
import '@/permission'

import './assets/iconfont/iconfont.css'

Vue.prototype.$apiError = {
  message: getApiErrorMessage,
  notify: notifyApiError
}

if (process.env.NODE_ENV === 'development' && process.env.VUE_APP_USE_MOCK === 'true') {
  require('./mock')
}
// 创建事件总线
Vue.prototype.$bus = new Vue()
// 将 echarts 挂载到 Vue 原型上，方便全局使用
Vue.prototype.$echarts = echarts
// 捕获路由错误，避免控制台报错
router.onError(error => {
  console.warn('路由错误已被捕获:', error.message)
})

Vue.use(VueKonva)

Vue.config.productionTip = false

new Vue({
  i18n,
  router,
  store,
  render: h => h(App)
}).$mount('#app')
