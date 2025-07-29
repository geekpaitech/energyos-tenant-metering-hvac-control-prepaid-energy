import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// 引入Element UI
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
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
// 开发环境启用mock
// if (process.env.NODE_ENV === 'development') {
//   require('./mock')
// }
// 创建事件总线
Vue.prototype.$bus = new Vue()

// 捕获路由错误，避免控制台报错
router.onError(error => {
  console.warn('路由错误已被捕获:', error.message)
})

// 使用Element UI
Vue.use(ElementUI)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
