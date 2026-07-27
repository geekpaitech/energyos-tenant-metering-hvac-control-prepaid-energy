import Layout from '@/layout'

// menuNo 到路由的映射配置 - 根据真实数据结构
export const menuRouteMap = {
  // 一级菜单
  60000: {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    meta: { title: '首页', icon: 'el-icon-data-analysis' },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index'),
        meta: { title: '首页', icon: 'el-icon-data-analysis', affix: true }
      }
    ]
  },

  61000: {
    path: '/operator',
    component: Layout,
    redirect: '/operator/manage',
    meta: { title: '测试', icon: 'el-icon-office-building' },
    children: []
  },

  64000: {
    path: '/order',
    component: Layout,
    redirect: '/order/index',
    meta: { title: '订单', icon: 'el-icon-shopping-cart-2' },
    children: [
      {
        path: 'index',
        name: 'OrderIndex',
        component: () => import('@/views/order/index'),
        meta: { title: '订单', icon: 'el-icon-shopping-cart-2' }
      }
    ]
  },

  65000: {
    path: '/finance',
    component: Layout,
    redirect: '/finance/index',
    meta: { title: '财务', icon: 'el-icon-money' },
    children: [
      {
        path: 'index',
        name: 'FinanceIndex',
        component: () => import('@/views/finance/index'),
        meta: { title: '财务', icon: 'el-icon-money' }
      }
    ]
  },

  68000: {
    path: '/system',
    component: Layout,
    redirect: '/system/menu',
    meta: { title: '系统', icon: 'el-icon-setting' },
    children: []
  },

  // 二级菜单 - 运营商管理
  61001: {
    path: 'manage',
    name: 'OperatorManage61001',
    component: () => import('@/views/operator/manage/index'),
    meta: { title: '测试1', icon: 'el-icon-office-building' },
    parent: '61000'
  },

  61002: {
    path: 'change-log',
    name: 'OperatorChangeLog61002',
    component: () => import('@/views/operator/change-log/index'),
    meta: { title: '测试2', icon: 'el-icon-document' },
    parent: '61000'
  },

  // 二级菜单 - 系统管理
  68001: {
    path: 'menu',
    name: 'SystemMenu68001',
    component: () => import('@/views/system/menu/index'),
    meta: { title: '菜单', icon: 'el-icon-menu' },
    parent: '68000'
  },

  68002: {
    path: 'role',
    name: 'SystemRole68002',
    component: () => import('@/views/system/role/index'),
    meta: { title: '角色', icon: 'el-icon-s-custom' },
    parent: '68000'
  },

  68003: {
    path: 'user',
    name: 'SystemUser68003',
    component: () => import('@/views/system/user/index'),
    meta: { title: '账号', icon: 'el-icon-user' },
    parent: '68000'
  }
}

// 根据权限数据生成路由
export function generateRoutesFromPermissions (permissions) {
  console.log('开始生成路由，权限数据:', permissions)

  const routes = []
  const routeMap = new Map()
  const usedPaths = new Set() // 用于跟踪已使用的路径

  // 先处理所有权限，收集menuNo
  const menuNos = permissions.map(item => item.menuNo)
  console.log('提取到的menuNo列表:', menuNos)

  // 构建路由树
  menuNos.forEach(menuNo => {
    const routeConfig = menuRouteMap[menuNo]
    if (!routeConfig) {
      console.warn(`未找到 menuNo ${menuNo} 对应的路由配置`)
      return
    }

    console.log(`处理 menuNo ${menuNo}:`, routeConfig.meta?.title)

    if (routeConfig.parent) {
      // 这是子路由，添加到父路由的children中
      const parentMenuNo = routeConfig.parent
      if (!routeMap.has(parentMenuNo)) {
        // 如果父路由还不存在，先创建父路由
        const parentConfig = menuRouteMap[parentMenuNo]
        if (parentConfig && !usedPaths.has(parentConfig.path)) {
          const parentRoute = { ...parentConfig, children: [] }
          routeMap.set(parentMenuNo, parentRoute)
          routes.push(parentRoute)
          usedPaths.add(parentConfig.path)
          console.log(`创建父路由 ${parentMenuNo}: ${parentConfig.meta?.title}`)
        }
      }

      const parentRoute = routeMap.get(parentMenuNo)
      if (parentRoute) {
        parentRoute.children.push({ ...routeConfig })
        console.log(`添加子路由到 ${parentMenuNo}: ${routeConfig.meta?.title}`)
      }
    } else {
      // 这是父路由
      if (!routeMap.has(menuNo) && !usedPaths.has(routeConfig.path)) {
        const route = { ...routeConfig, children: routeConfig.children || [] }
        routeMap.set(menuNo, route)
        routes.push(route)
        usedPaths.add(routeConfig.path)
        console.log(`创建独立路由 ${menuNo}: ${routeConfig.meta?.title}`)
      }
    }
  })

  // 添加404路由
  routes.push({ path: '*', redirect: '/404', hidden: true })

  console.log('最终生成的路由结构:', routes)
  return routes
}
