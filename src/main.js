import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
// main.js
import * as echarts from 'echarts'
import VueKonva from 'vue-konva'

// 引入Element UI
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import moment from 'moment'

// icon
import '@/assets/iconfont/iconfont.css'

// 设置 moment 中文语言
import 'moment/locale/zh-cn'
// 引入样式重置
import 'normalize.css/normalize.css'

// 引入进度条样式
import 'nprogress/nprogress.css'

// 引入全局样式
import '@/assets/styles/index.scss'

// 引入HTTP请求封装
import '@/utils/request'

// 引入Mock数据
import '@/mock'

// 引入权限控制
import '@/permission'

import './assets/iconfont/iconfont.css'
moment.locale('zh-cn')
// 开发环境启用mock
// if (process.env.NODE_ENV === 'development') {
//   require('./mock')
// }
// 创建事件总线
Vue.prototype.$bus = new Vue()
// 将 echarts 挂载到 Vue 原型上，方便全局使用
Vue.prototype.$echarts = echarts
// 捕获路由错误，避免控制台报错
router.onError(error => {
  console.warn('路由错误已被捕获:', error.message)
})

// 使用Element UI
Vue.use(ElementUI)
Vue.use(VueKonva)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
