import Layout from '@/layout'

// 控制台路由配置 (console平台)
export const consoleRoutes = [
  {
    path: '/',
    component: Layout,
    redirect: '/console/dashboard',
    meta: { title: '首页', icon: 'el-icon-monitor' },
    children: [
      {
        path: 'console/dashboard',
        name: 'ConsoleDashboard',
        component: () => import('@/views/console/dashboard/index'),
        meta: { title: '首页', icon: 'el-icon-data-analysis', affix: true }
      }
    ]
  },
  {
    path: '/console',
    component: Layout,
    redirect: '/console/test',
    meta: { title: '区域', icon: 'el-icon-cpu' },
    children: [
      {
        path: 'test',
        name: 'ConsoleTest',
        component: () => import('@/views/console/test/index'),
        meta: { title: '区域配置', icon: 'el-icon-cpu' }
      },
      {
        path: 'visualization',
        name: 'ConsoleVisualization',
        component: () => import('@/views/console/test/visualization'),
        meta: { title: '区域可视化', icon: 'el-icon-cpu' }
      }
    ]
  },
  {
    path: '/device',
    component: Layout,
    redirect: '/device/electricity',
    meta: { title: '设备', icon: 'el-icon-cpu' },
    children: [
      // 基础设备管理
      {
        path: 'electricity',
        name: 'DeviceElectricity',
        component: () => import('@/views/console/device/electricity'),
        meta: { title: '电表', icon: 'el-icon-lightning' }
      },
      {
        path: 'conditioning',
        name: 'DeviceConditioning',
        component: () => import('@/views/console/device/conditioning'),
        meta: { title: '空调', icon: 'el-icon-wind-power' }
      },
      {
        path: 'lighting',
        name: 'DeviceLighting',
        component: () => import('@/views/console/device/lighting'),
        meta: { title: '照明', icon: 'el-icon-sunny' }
      },
      {
        path: 'doorlock',
        name: 'DeviceDoorlock',
        component: () => import('@/views/console/device/doorlock'),
        meta: { title: '门锁', icon: 'el-icon-lock' }
      },
      {
        path: 'watermeter',
        name: 'DeviceWatermeter',
        component: () => import('@/views/console/device/watermeter'),
        meta: { title: '水表', icon: 'el-icon-coffee-cup' }
      },
      // 带标签的分隔线
      {
        path: 'divider-sharing',
        name: 'DeviceDividerSharing',
        meta: { 
          isDivider: true,
          dividerLabel: '公摊管理',  // 分组标签
          hidden: false
        }
      },
      // 公摊管理
      {
        path: 'electricitySharing',
        name: 'ElectricitySharing',
        component: () => import('@/views/console/device/publicshare/electricitySharing'),
        meta: { title: '电表公摊', icon: 'el-icon-share' }
      },
      {
        path: 'watermeterSharing',
        name: 'WatermeterSharing',
        component: () => import('@/views/console/device/publicshare/watermeterSharing'),
        meta: { title: '水表公摊', icon: 'el-icon-share' }
      },
      {
        path: 'conditioningSharing',
        name: 'ConditioningSharing',
        component: () => import('@/views/console/device/publicshare/conditioningSharing'),
        meta: { title: '空调公摊', icon: 'el-icon-share' }
      }
    ]
  },
  // 应用模块
  {
    path: '/application',
    component: Layout,
    redirect: '/application/energy',
    meta: { title: '应用', icon: 'el-icon-s-grid' },
    children: [
      // 分户计量 - 分隔线标签
      {
        path: 'divider-metering',
        name: 'ApplicationDividerMetering',
        meta: { 
          isDivider: true,
          dividerLabel: '分户计量',  // 分组标签
          hidden: false
        }
      },
      // 用能管理
      {
        path: 'energy',
        name: 'ApplicationEnergy',
        redirect: '/application/energy/electricity-report',
        meta: { title: '用能', icon: 'el-icon-data-line' },
        children: [
          // 用电分析部分
          {
            path: 'electricity-report',
            name: 'ElectricityReport',
            component: () => import('@/views/console/energy/electricityReport'),
            meta: { title: '用电报表', icon: 'el-icon-document' }
          },
          {
            path: 'electricity-sankey',
            name: 'ElectricitySankey',
            component: () => import('@/views/console/energy/electricitySankey'),
            meta: { title: '用电桑基图', icon: 'el-icon-connection' }
          },
          // 分隔线
          {
            path: 'divider-water',
            name: 'EnergyDividerWater',
            meta: { 
              isDivider: true,
              hidden: false
            }
          },
          // 用水分析部分
          {
            path: 'water-report',
            name: 'WaterReport',
            component: () => import('@/views/console/energy/waterReport'),
            meta: { title: '用水报表', icon: 'el-icon-document-checked' }
          },
          {
            path: 'water-sankey',
            name: 'WaterSankey',
            component: () => import('@/views/console/energy/waterSankey'),
            meta: { title: '用水桑基图', icon: 'el-icon-grape' }
          }
        ]
      },
      // 租户管理
      {
        path: 'tenant',
        name: 'ApplicationTenant',
        redirect: '/application/tenant/list',
        meta: { title: '租户', icon: 'el-icon-user' },
        children: [
          {
            path: 'list',
            name: 'TenantList',
            component: () => import('@/views/console/tenant/list'),
            meta: { title: '租户列表', icon: 'el-icon-s-custom' }
          },
          {
            path: 'account',
            name: 'TenantAccount',
            component: () => import('@/views/console/tenant/account'),
            meta: { title: '租户账号', icon: 'el-icon-user-solid' }
          },
          {
            path: 'bill-statistics',
            name: 'BillStatistics',
            component: () => import('@/views/console/tenant/billStatistics'),
            meta: { title: '账单统计', icon: 'el-icon-s-data' }
          },
          {
            path: 'transaction',
            name: 'TenantTransaction',
            component: () => import('@/views/console/tenant/transaction'),
            meta: { title: '租户流水', icon: 'el-icon-tickets' }
          },
          {
            path: 'payment-list',
            name: 'PaymentList',
            component: () => import('@/views/console/tenant/paymentList'),
            meta: { title: '缴费清单', icon: 'el-icon-wallet' }
          }
        ]
      },
      // 计费管理
      {
        path: 'fee',
        name: 'ApplicationFee',
        redirect: '/application/fee/electricity-plan',
        meta: { title: '计费', icon: 'el-icon-price-tag' },
        children: [
          {
            path: 'electricity-plan',
            name: 'ElectricityPlan',
            component: () => import('@/views/console/fee/electricityPlan'),
            meta: { title: '电费方案', icon: 'el-icon-lightning' }
          },
          {
            path: 'water-plan',
            name: 'WaterPlan',
            component: () => import('@/views/console/fee/waterPlan'),
            meta: { title: '水费方案', icon: 'el-icon-coffee-cup' }
          },
          {
            path: 'service-plan',
            name: 'ServicePlan',
            component: () => import('@/views/console/fee/servicePlan'),
            meta: { title: '服务费方案', icon: 'el-icon-s-cooperation' }
          },
          // 带标签的分隔线
          {
            path: 'divider-adjustment',
            name: 'FeeDividerAdjustment',
            meta: { 
              isDivider: true,
              dividerLabel: '调价记录',
              hidden: false
            }
          },
          {
            path: 'electricity-adjustment',
            name: 'ElectricityAdjustment',
            component: () => import('@/views/console/fee/electricityAdjustment'),
            meta: { title: '电费调价记录', icon: 'el-icon-document-copy' }
          }
        ]
      },
      // 账单管理
      {
        path: 'bill',
        name: 'ApplicationBill',
        redirect: '/application/bill/energy-bill',
        meta: { title: '账单', icon: 'el-icon-document' },
        children: [
          {
            path: 'energy-bill',
            name: 'EnergyBill',
            component: () => import('@/views/console/bill/energyBill'),
            meta: { title: '用能账单', icon: 'el-icon-s-order' }
          },
          {
            path: 'floating-price',
            name: 'FloatingPrice',
            component: () => import('@/views/console/bill/floatingPrice'),
            meta: { title: '浮动电价', icon: 'el-icon-s-marketing' }
          },
          {
            path: 'manual-bill',
            name: 'ManualBill',
            component: () => import('@/views/console/bill/manualBill'),
            meta: { title: '手动账单', icon: 'el-icon-edit' }
          }
        ]
      },
      // 财务管理
      {
        path: 'finance',
        name: 'ApplicationFinance',
        redirect: '/application/finance/tenant-refund',
        meta: { title: '财务', icon: 'el-icon-coin' },
        children: [
          {
            path: 'tenant-refund',
            name: 'TenantRefund',
            component: () => import('@/views/console/finance/tenantRefund'),
            meta: { title: '租户退款', icon: 'el-icon-notebook-2' }
          },
          {
            path: 'withdrawal',
            name: 'Withdrawal',
            component: () => import('@/views/console/finance/withdrawal'),
            meta: { title: '资金提现', icon: 'el-icon-bank-card' }
          },
          {
            path: 'withdrawal-record',
            name: 'WithdrawalRecord',
            component: () => import('@/views/console/finance/withdrawalRecord'),
            meta: { title: '提现记录', icon: 'el-icon-notebook-2' }
          },
          {
            path: 'fund-flow',
            name: 'FundFlow',
            component: () => import('@/views/console/finance/fundFlow'),
            meta: { title: '资金流水', icon: 'el-icon-money' }
          }
        ]
      },
      // 开票管理
      {
        path: 'invoice',
        name: 'ApplicationInvoice',
        redirect: '/application/invoice/tenant-invoice',
        meta: { title: '开票', icon: 'el-icon-postcard' },
        children: [
          {
            path: 'tenant-invoice',
            name: 'TenantInvoice',
            component: () => import('@/views/console/invoice/tenantInvoice'),
            meta: { title: '租户开票', icon: 'el-icon-tickets' }
          },
          {
            path: 'invoice-quota',
            name: 'InvoiceQuota',
            component: () => import('@/views/console/invoice/invoiceQuota'),
            meta: { title: '发票额度', icon: 'el-icon-notebook-1' }
          },
          {
            path: 'quota-flow',
            name: 'InvoiceQuotaFlow',
            component: () => import('@/views/console/invoice/quotaFlow'),
            meta: { title: '发票额度流水', icon: 'el-icon-notebook-1' }
          }
        ]
      }
    ]
  }
]

// 管理后台路由配置 (admin平台)
export const adminRoutes = [
  {
    path: '/',
    component: Layout,
    redirect: '/admin/dashboard',
    meta: { title: '管理后台首页', icon: 'el-icon-monitor' },
    children: [
      {
        path: 'admin/dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/dashboard/index'),
        meta: { title: '管理后台大屏', icon: 'el-icon-data-board', affix: true }
      }
    ]
  },
  {
    path: '/admin',
    component: Layout,
    redirect: '/admin/test',
    meta: { title: '管理后台测试', icon: 'el-icon-setting' },
    children: [
      {
        path: 'test',
        name: 'AdminTest',
        component: () => import('@/views/admin/test/index'),
        meta: { title: '管理后台测试', icon: 'el-icon-setting' }
      },
      {
        path: 'test1',
        name: 'AdminTest1',
        component: () => import('@/views/admin/test/test1/index'),
        meta: { title: '测试1', icon: 'el-icon-cpu' }
      }
    ]
  }
]

// 根据用户角色获取可访问的平台列表
export function getAvailablePlatforms(role) {
  console.log('获取用户可用平台:', role)
  
  switch (role) {
    case 'TESTER':
      // 测试员：只有控制台
      return ['console']
      
    case 'SYS_ADMIN':
      // 系统管理员：控制台 + 管理后台（可切换）
      return ['console', 'admin']
      
    case 'SYS_FINANCE':
    case 'SUPER_MANAGER':
      // 财务和管理方：只有管理后台
      return ['admin']
      
    default:
      console.warn(`未知角色: ${role}`)
      return []
  }
}

// 根据平台和角色获取对应的路由配置
export function getRoutesByPlatform(platform, role) {
  console.log('获取平台路由:', platform, '角色:', role)
  
  // 首先检查用户是否有该平台的权限
  const availablePlatforms = getAvailablePlatforms(role)
  if (!availablePlatforms.includes(platform)) {
    console.warn(`用户 ${role} 无权限访问平台 ${platform}`)
    return []
  }
  
  let routes = []
  
  switch (platform) {
    case 'console':
      routes = [...consoleRoutes]
      console.log('返回控制台路由')
      break
      
    case 'admin':
      routes = [...adminRoutes]
      console.log('返回管理后台路由')
      break
      
    default:
      console.warn(`未知平台: ${platform}`)
      routes = []
  }
  
  // 统一添加404路由
  if (routes.length > 0) {
    routes.push({ path: '*', redirect: '/404', hidden: true })
  }
  
  console.log(`平台 ${platform} 的路由配置:`, routes)
  return routes
}

// 获取用户默认平台
export function getDefaultPlatform(role) {
  const availablePlatforms = getAvailablePlatforms(role)
  
  if (availablePlatforms.length === 0) {
    return null
  }
  
  // 如果用户有控制台权限，默认进入控制台
  if (availablePlatforms.includes('console')) {
    return 'console'
  }
  
  // 否则返回第一个可用平台
  return availablePlatforms[0]
}