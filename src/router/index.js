import Vue from 'vue'
import Router from 'vue-router'

/* Layout */
import Layout from '@/layout'

Vue.use(Router)

/**
 * constantRoutes
 * 不需要权限判断的路由 - 只保留登录、404等基础路由
 * 移除根路径，完全由动态路由接管
 */
export const constantRoutes = [
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },
  {
    path: '/404',
    component: () => import('@/views/404'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/401'),
    hidden: true
  },
  // 移除根路径重定向，避免与动态路由冲突
   // 加载页面
   {
    path: '/switching',
    component: () => import('@/views/switching/index'), // 需要创建这个组件
    hidden: true
  },
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect/index'),
        name: 'Redirect',
        meta: {
          title: '页面跳转中',
          noCache: true,
          noTagsView: true, // 👈 添加这个标记
          hidden: true
        }
      }
    ]
  },
  {
    path: '/metering/tenant/detail/:id',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '',  // 注意这里是空字符串
        name: 'TenantDetail',
        component: () => import('@/views/console/tenant/detail'),
        meta: { 
          title: '租户详情',
        }
      }
    ]
  },
]

/**
 * asyncRoutes
 * 现在完全动态生成，这里留空
 */
export const asyncRoutes = []

const createRouter = () => new Router({
  // mode: 'history', // require service support
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})

const router = createRouter()

// 捕获重复导航错误
const originalPush = Router.prototype.push
const originalReplace = Router.prototype.replace

Router.prototype.push = function push(location, onResolve, onReject) {
  if (onResolve || onReject) {
    return originalPush.call(this, location, onResolve, onReject)
  }
  return originalPush.call(this, location).catch(err => {
    if (err.name !== 'NavigationDuplicated' && err.name !== 'NavigationCancelled') {
      throw err
    }
  })
}

Router.prototype.replace = function replace(location, onResolve, onReject) {
  if (onResolve || onReject) {
    return originalReplace.call(this, location, onResolve, onReject)
  }
  return originalReplace.call(this, location).catch(err => {
    if (err.name !== 'NavigationDuplicated' && err.name !== 'NavigationCancelled') {
      throw err
    }
  })
}

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
// 改进路由重置函数
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
  
  // 清除路由缓存
  if (router.history) {
    router.history.current = router.history.current
  }
}

export default router