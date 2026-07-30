import Layout from '@/layout'

// 控制台路由配置 (console平台)
export const consoleRoutes = [
  // 根路径重定向（与 admin 平台一致，避免 / 命中 catch-all → 404）
  {
    path: '/',
    redirect: '/metering/dashboard',
    hidden: true
  },
  // ==================== 首页 ====================
  // 路径保持 /metering/dashboard
  {
    path: '/metering',
    component: Layout,
    redirect: '/metering/dashboard',
    meta: { title: '首页', icon: 'icon-icon-jiankongtai', menuNo: '60000' },
    children: [
      {
        path: 'dashboard',
        name: 'MeteringDashboard',
        component: () => import('@/views/console/dashboard/index'),
        meta: { title: '首页', icon: 'icon-icon-jiankongtai', menuNo: '60000' }
      },
      // {
      //   path: 'tenant-dashboard',
      //   name: 'TenantDashboard',
      //   component: () => import('@/views/console/dataBoard/index'),
      //   meta: { title: '租户看板', icon: 'icon-icon-jiankongtai' }
      // },
      {
        path: '/device/dashboard',
        redirect: '/metering/dashboard',
        hidden: true,
        meta: { hidden: true }
      }
      // 充电桩总览 - 路径保持 /energy/char-dashboard
      // {
      //   path: '/energy/char-dashboard',
      //   name: 'CharDashboard',
      //   component: () => import('@/views/console/charDashboard/index'),
      //   meta: { title: '充电桩总览', icon: 'icon-chongdianzhuang' }
      // },
    ]
  },

  // ==================== AI ====================
  {
    path: '/ai',
    component: Layout,
    redirect: '/ai/chat',
    meta: { title: 'AI', icon: 'icon-wuguan', menuNo: '61000' },
    alwaysShow: true,
    children: [
      {
        path: 'divider-ai-assistant',
        name: 'AIDividerAssistant',
        meta: {
          isDivider: true,
          dividerLabel: 'AI助手',
          hidden: false
        }
      },
      {
        path: 'chat',
        name: 'AIChat',
        component: () => import('@/views/console/ai-assistant/chat/index'),
        meta: { title: 'AI智能对话', icon: 'icon-wuguan', menuNo: '61001' }
      },
      {
        path: 'report',
        name: 'AIReport',
        component: () => import('@/views/console/ai-assistant/report/index'),
        meta: { title: 'AI智能报表', icon: 'icon-icon-jiankongtai', menuNo: '61002' }
      },
      {
        path: 'verification',
        name: 'AIVerification',
        component: () => import('@/views/console/ai-assistant/verification/verificationIndex'),
        meta: { title: '电费核查联解析', icon: 'icon-zu', menuNo: '61003' }
      }
    ]
  },

  // ==================== 区域（保持原样）====================
  {
    path: '/console',
    component: Layout,
    redirect: '/console/test',
    meta: { title: '区域', icon: 'icon-cengji', menuNo: '62000' },
    children: [
      {
        path: 'divider-area-management',
        name: 'ConsoleDividerAreaManagement',
        meta: {
          isDivider: true,
          dividerLabel: '区域管理',
          hidden: false
        }
      },
      {
        path: 'test',
        name: 'ConsoleTest',
        component: () => import('@/views/console/test/index'),
        meta: { title: '区域配置', icon: 'icon-shezhipeizhi', menuNo: '62001' }
      },
      {
        path: 'visualization',
        name: 'ConsoleVisualization',
        component: () => import('@/views/console/test/visualization'),
        meta: { title: '区域可视化', icon: 'icon-cengji', menuNo: '62002' }
      },
      {
        path: 'parkingSpace',
        name: 'ConsoleParkingSpace',
        component: () => import('@/views/console/test/parkingSpace'),
        meta: { title: '车位管理', icon: 'icon-cengji', menuNo: '62003' }
      }
    ]
  },

  // ==================== 设备 ====================
  {
    path: '/device',
    component: Layout,
    redirect: '/device/electricity', // 🔧 修改redirect，指向第一个实际页面
    meta: { title: '设备', icon: 'icon-shebeipeizhi', menuNo: '63000' },
    children: [
      // ========== 分隔线：计量设备 ==========
      {
        path: 'divider-metering-devices',
        name: 'DeviceDividerMeteringDevices',
        meta: {
          isDivider: true,
          dividerLabel: '计量设备',
          hidden: false
        }
      },
      // 电表
      {
        path: 'electricity',
        name: 'DeviceElectricity',
        component: () => import('@/views/console/device/electricity'),
        meta: { title: '电表', icon: 'icon-dianbiao1', menuNo: '63001' }
      },
      {
        path: 'electricity/detail/:id',
        name: 'DeviceElectricityDetail',
        component: () => import('@/views/console/device/electricity/detail'),
        hidden: true,
        meta: {
          title: '电表详情',
          icon: 'icon-dianbiao1',
          hidden: true,
          activeMenu: '/device/electricity'
        }
      },
      // 水表
      {
        path: 'watermeter',
        name: 'DeviceWatermeter',
        component: () => import('@/views/console/device/watermeter'),
        meta: { title: '水表', icon: 'icon-shuibiao', menuNo: '63002' }
      },
      {
        path: 'watermeter/detail/:id',
        name: 'DeviceWatermeterDetail',
        component: () => import('@/views/console/device/watermeter/detail'),
        hidden: true,
        meta: {
          title: '水表详情',
          icon: 'icon-shuibiao',
          hidden: true,
          activeMenu: '/device/watermeter'
        }
      },
      // 空调
      {
        path: 'conditioning',
        name: 'DeviceConditioning',
        component: () => import('@/views/console/device/conditioning'),
        meta: { title: '空调', icon: 'icon-kongtiao', menuNo: '63003' }
      },
      {
        path: 'conditioning/detail/:id',
        name: 'DeviceConditioningDetail',
        component: () => import('@/views/console/device/conditioning/detail'),
        hidden: true,
        meta: {
          title: '空调详情',
          icon: 'icon-kongtiao',
          hidden: true,
          activeMenu: '/device/conditioning'
        }
      },

      // ========== 分隔线：设备公摊组 ==========
      {
        path: 'divider-sharing-groups',
        name: 'DeviceDividerSharingGroups',
        meta: {
          isDivider: true,
          dividerLabel: '设备公摊组',
          hidden: false
        }
      },
      // 电表公摊组 - 路径保持 /metering/fee/electricitySharing
      {
        path: '/metering/fee/electricitySharing',
        name: 'ElectricitySharing',
        component: () => import('@/views/console/device/publicshare/electricitySharing'),
        meta: { title: '电表公摊组', icon: 'icon-dianbiao', menuNo: '63004' }
      },
      {
        path: '/metering/fee/electricitySharing/detail',
        name: 'ElectricitySharingDetail',
        component: () => import('@/views/console/device/publicshare/components/ShareDetail'),
        hidden: true,
        meta: {
          title: '电表公摊详情',
          icon: 'icon-dianbiao',
          hidden: true,
          activeMenu: '/metering/fee/electricitySharing'
        }
      },
      // 水表公摊组 - 路径保持 /metering/fee/watermeterSharing
      {
        path: '/metering/fee/watermeterSharing',
        name: 'WatermeterSharing',
        component: () => import('@/views/console/device/publicshare/watermeterSharing'),
        meta: { title: '水表公摊组', icon: 'icon-shuibiao', menuNo: '63005' }
      },
      {
        path: '/metering/fee/watermeterSharing/detail',
        name: 'WatermeterSharingDetail',
        component: () => import('@/views/console/device/publicshare/components/watermeterDetail'),
        hidden: true,
        meta: {
          title: '水表公摊详情',
          icon: 'icon-shuibiao',
          hidden: true,
          activeMenu: '/metering/fee/watermeterSharing'
        }
      },
      // 空调公摊组 - 路径保持 /metering/fee/conditioningSharing
      {
        path: '/metering/fee/conditioningSharing',
        name: 'ConditioningSharing',
        component: () => import('@/views/console/device/publicshare/conditioningSharing'),
        meta: { title: '空调公摊组', icon: 'icon-kongtiao', menuNo: '63006' }
      },
      {
        path: '/metering/fee/conditioningSharing/detail',
        name: 'ConditioningSharingDetail',
        component: () => import('@/views/console/device/publicshare/components/conditDetail'),
        hidden: true,
        meta: {
          title: '空调公摊详情',
          icon: 'icon-dianbiao',
          hidden: true,
          activeMenu: '/metering/fee/conditioningSharing'
        }
      },

      // ========== 分隔线：其他智能设备 ==========
      {
        path: 'divider-smart-devices',
        name: 'DeviceDividerSmartDevices',
        meta: {
          isDivider: true,
          dividerLabel: '其他智能设备',
          hidden: false
        }
      },
      // 照明（iframe 嵌入 fmcs 子系统）
      {
        path: '/device/lightingControl',
        name: 'DeviceLightingControl',
        component: () => import('@/views/console/device/embed/LightingSubsystem'),
        meta: {
          title: '照明',
          icon: 'icon-zhaoming1',
          menuNo: '63007',
          // 企业切换时不再由 TagsView 触发二次“温和刷新”，避免 iframe 重载多次
          refreshOnManagerSwitch: false
        }
      },
      // 水空调（iframe 嵌入 fmcs 子系统）
      {
        path: '/project/airConditioningSubsystem',
        name: 'ProjectAirConditioningSubsystem',
        component: () => import('@/views/console/device/embed/WaterAcSubsystem'),
        meta: {
          title: '水空调',
          icon: 'icon-peizhitubiaosvg-',
          menuNo: '63008',
          refreshOnManagerSwitch: false
        }
      },
      // 落位图
      {
        path: '/configuration/quickLocation',
        name: 'ConfigurationQuickLocation',
        component: () => import('@/views/console/device/externalJump'),
        meta: { title: '落位图', icon: 'icon-fangjian', menuNo: '63009', externalPath: '/configuration/quickLocation', returnPath: '/device/electricity' }
      },
      // 环境监测（iframe 嵌入 fmcs 子系统）
      {
        path: '/project/senSorSystem',
        name: 'ProjectSenSorSystem',
        component: () => import('@/views/console/device/embed/EnvMonitorSubsystem'),
        meta: {
          title: '环境监测',
          icon: 'icon-chongdianzhuang1',
          menuNo: '63010',
          refreshOnManagerSwitch: false
        }
      },
      // 生活水
      {
        path: '/device/domesticWater',
        name: 'DeviceDomesticWater',
        component: () => import('@/views/console/device/embed/DomesticWaterSubsystem'),
        meta: {
          title: '生活水',
          icon: 'icon-shuibiao',
          menuNo: '63011',
          refreshOnManagerSwitch: false,
          managerVisibility: {
            names: ['智能视觉']
          }
        }
      },
      // 直饮水
      {
        path: '/device/directDrinkingWaterSystem',
        name: 'DeviceDirectDrinkingWaterSystem',
        component: () => import('@/views/console/device/embed/DirectDrinkingWaterSubsystem'),
        meta: {
          title: '直饮水',
          icon: 'icon-shuibiao_o',
          menuNo: '63012',
          refreshOnManagerSwitch: false,
          managerVisibility: {
            names: ['智能视觉']
          }
        }
      },
      // 停车系统（AI2Park）
      {
        path: '/project/parkingSubsystem',
        name: 'ProjectParkingSubsystem',
        component: () => import('@/views/console/device/embed/ParkingSubsystem'),
        meta: {
          title: '停车系统',
          icon: 'icon-tingchewei',
          menuNo: '63013',
          refreshOnManagerSwitch: false,
          managerVisibility: {
            names: ['智能视觉']
          }
        }
      },
      // 给排水（iframe 嵌入 fmcs 子系统，仅智能视觉）
      {
        path: '/project/waterSupplyAndDrainageSubsystem',
        name: 'ProjectWaterSupplyDrainageSubsystem',
        component: () => import('@/views/console/device/embed/WaterSupplyDrainageSubsystem'),
        meta: {
          title: '给排水',
          icon: 'icon-shuibiao_o',
          menuNo: '63015',
          refreshOnManagerSwitch: false,
          managerVisibility: {
            names: ['智能视觉']
          }
        }
      },
      // 历史数据（iframe 嵌入 fmcs 子系统，仅智能视觉）
      {
        path: '/device/historicalData',
        name: 'DeviceHistoricalData',
        component: () => import('@/views/console/device/embed/HistoricalDataSubsystem'),
        meta: {
          title: '历史数据',
          icon: 'icon-baobiao',
          menuNo: '63016',
          refreshOnManagerSwitch: false,
          managerVisibility: {
            names: ['智能视觉']
          }
        }
      },
      // 面积切分（iframe 嵌入 fmcs 子系统，仅智能视觉）
      {
        path: '/desk/areaData',
        name: 'DeskAreaData',
        component: () => import('@/views/console/device/embed/AreaDataSubsystem'),
        meta: {
          title: '面积切分',
          icon: 'icon-cengji',
          menuNo: '63017',
          refreshOnManagerSwitch: false,
          managerVisibility: {
            names: ['智能视觉']
          }
        }
      }
    ]
  },

  // ==================== 用能 ====================
  {
    path: '/energy',
    component: Layout,
    redirect: '/energy/equipmentPower',
    meta: { title: '用能', icon: 'icon-baobiao', menuNo: '64000' },
    children: [
      {
        path: 'divider-equipment-reports',
        name: 'EnergyDividerEquipmentReports',
        meta: {
          isDivider: true,
          dividerLabel: '设备用能报表',
          hidden: false
        }
      },
      // 🆕 设备用电 - 放在第一行
      {
        path: 'equipmentPower',
        name: 'EquipmentPower',
        component: () => import('@/views/console/energy/equipmentPower'),
        meta: { title: '电表用电', icon: 'icon-dianbiao', menuNo: '64001' } // 可根据需要调整icon
      },
      {
        path: 'charging-sankey',
        name: 'ChargingSankey',
        component: () => import('@/views/console/energy/chargingReport'),
        meta: { title: '空调用电', icon: 'icon-kongtiao', menuNo: '64002' }
      },
      {
        path: 'electricity-sankey',
        name: 'ElectricitySankey',
        component: () => import('@/views/console/energy/electricitySankey'),
        meta: { title: '用电桑基图', icon: 'icon-dianbiao3', menuNo: '64003' }
      },
      {
        path: 'charging-water',
        name: 'ChargingWater',
        component: () => import('@/views/console/energy/equipmentWater'),
        meta: { title: '设备用水', icon: 'icon-shuibiao', menuNo: '64004' }
      },
      {
        path: 'water-sankey',
        name: 'WaterSankey',
        component: () => import('@/views/console/energy/waterSankey'),
        meta: { title: '用水桑基图', icon: 'icon-shuibiao_o', menuNo: '64005' }
      },
      // ========== 分隔线：租户用能报表 ==========
      {
        path: 'divider-tenant-reports',
        name: 'EnergyDividerTenantReports',
        meta: {
          isDivider: true,
          dividerLabel: '租户用能报表',
          hidden: false
        }
      },
      // 租户用电
      {
        path: 'electricity-report',
        name: 'ElectricityReport',
        component: () => import('@/views/console/energy/electricityReport'),
        meta: { title: '租户用电', icon: 'icon-dianbiao', menuNo: '64006' }
      },
      // 租户用水
      {
        path: 'water-report',
        name: 'WaterReport',
        component: () => import('@/views/console/energy/waterReport'),
        meta: { title: '租户用水', icon: 'icon-shuibiao', menuNo: '64007' }
      },
      // ========== 分隔线：分项计量 ==========
      {
        path: 'divider-sub-metering',
        name: 'EnergyDividerSubMetering',
        meta: {
          isDivider: true,
          dividerLabel: '分项计量',
          hidden: false
        }
      },
      // 分项计量
      {
        path: 'sub-metering',
        name: 'ConsolesubMetering',
        component: () => import('@/views/console/ai-assistant/cost/subMetering'),
        meta: { title: '用电分项计量', icon: 'icon-daikaipiao', menuNo: '64008' }
      },
      // 配电图
      {
        path: 'distribution-diagram',
        name: 'EnergyDistributionDiagram',
        component: () => import('@/views/console/test/distributionDiagram'),
        meta: {
          title: '配电图',
          icon: 'icon-daikaipiao',
          menuNo: '60002',
          managerVisibility: { names: ['智能视觉'] }
        }
      },
      {
        path: 'photovoltaic',
        name: 'EnergyPhotovoltaic',
        component: () => import('@/views/console/energy/photovoltaic'),
        meta: {
          title: '光伏',
          icon: 'icon-dianbiao',
          menuNo: '64009',
          managerVisibility: { ids: [1000165, 1000107] }
        }
      },
      {
        path: 'sub-metering/detail/:id',
        name: 'ConsolesubMeteringDetail',
        component: () => import('@/views/console/ai-assistant/cost/subMetering'),
        hidden: true,
        meta: {
          title: '分项计量设置',
          icon: 'icon-daikaipiao',
          hidden: true,
          activeMenu: '/energy/sub-metering'
        }
      }
    ]
  },

  // ==================== 账单 ====================
  // 创建新的一级菜单，但路径保持 /metering/bill
  {
    path: '/metering/bill',
    component: Layout,
    redirect: '/metering/bill/consumption-bill',
    meta: { title: '账单', icon: 'icon-zhangdan', menuNo: '65000' },
    children: [
      // ========== 分隔线：账单管理 ==========
      {
        path: 'divider-bill-management',
        name: 'BillDividerManagement',
        meta: {
          isDivider: true,
          dividerLabel: '账单管理',
          hidden: false
        }
      },
      // 🆕 用能账单
      {
        path: 'consumption-bill',
        name: 'ConsumptionBill',
        component: () => import('@/views/console/bill/newBill/consumptionBill'),
        meta: { title: '用能账单', icon: 'icon-dianbiao', menuNo: '65001' }
      },
      // 🆕 手动账单
      {
        path: 'new-manual-bill',
        name: 'NewManualBill',
        component: () => import('@/views/console/bill/newBill/manualBill'),
        meta: { title: '手动账单', icon: 'icon-zhangdan', menuNo: '65002' }
      },
      // 🆕 浮动电价(新)
      {
        path: 'float-price',
        name: 'FloatPrice',
        component: () => import('@/views/console/bill/newBill/floatPrice'),
        meta: { title: '浮动电价', icon: 'icon-changyongtubiao_jifei', menuNo: '65003' }
      },
      // 🆕 分摊账单
      {
        path: 'split-bill',
        name: 'SplitBill',
        component: () => import('@/views/console/bill/newBill/splittheBill'),
        meta: { title: '分摊账单', icon: 'icon-fenxiangyongneng', menuNo: '65004' }
      }
    ]
  },

  // ==================== 租户 ====================
  // 创建新的一级菜单，但路径保持 /metering/tenant
  {
    path: '/metering/tenant',
    component: Layout,
    redirect: '/metering/tenant/list',
    meta: { title: '租户', icon: 'icon-zuhupeizhi', menuNo: '66000' },
    children: [
      // ========== 分隔线：租户管理 ==========
      {
        path: 'divider-tenant-management',
        name: 'TenantDividerManagement',
        meta: {
          isDivider: true,
          dividerLabel: '租户管理',
          hidden: false
        }
      },
      // 租户卡片
      {
        path: 'list',
        name: 'TenantList',
        component: () => import('@/views/console/tenant/list'),
        meta: { title: '租户卡片', icon: 'icon-zuhupeizhi', menuNo: '66001' }
      },
      {
        path: 'detail/:id',
        name: 'TenantDetail',
        component: () => import('@/views/console/tenant/detail'),
        hidden: true,
        meta: {
          title: '租户详情',
          icon: 'icon-zuhupeizhi',
          hidden: true,
          activeMenu: '/metering/tenant/list'
        }
      },
      // 租户账单 - 路径保持 /metering/bill/energy-bill，但在租户菜单下也显示
      {
        path: '/metering/bill/energy-bill-tenant',
        name: 'TenantEnergyBill',
        component: () => import('@/views/console/bill/energyBill'),
        meta: { title: '租户账单', icon: 'icon-zuhupeizhi', menuNo: '66002' }
      },
      // 账单统计 - 路径保持 /metering/bill/floating-price，但在租户菜单下也显示
      {
        path: '/metering/bill/floating-price-tenant',
        name: 'TenantFloatingPrice',
        component: () => import('@/views/console/bill/floatingPrice'),
        meta: { title: '账单统计', icon: 'icon-fenxiangyongneng', menuNo: '66003' }
      },
      {
        path: 'label-manage',
        name: 'TenantLabelManage',
        component: () => import('@/views/console/labelManage/index.vue'),
        meta: { title: '标签管理', icon: 'icon-shezhipeizhi', menuNo: '66004' }
      },
      {
        path: 'level',
        name: 'TenantLevel',
        component: () => import('@/views/console/tenantLevel/index.vue'),
        meta: { title: '租户层级', icon: 'icon-cengji', menuNo: '66009' }
      },

      // ========== 分隔线：租户计费方案 ==========
      {
        path: 'divider-billing-plans',
        name: 'TenantDividerBillingPlans',
        meta: {
          isDivider: true,
          dividerLabel: '租户计费方案',
          hidden: false
        }
      },
      // 电费方案 - 路径保持 /metering/fee/electricity-plan
      {
        path: '/metering/fee/electricity-plan',
        name: 'ElectricityPlan',
        component: () => import('@/views/console/fee/electricityPlan'),
        meta: { title: '电费方案', icon: 'icon-dianbiao', menuNo: '66005' }
      },
      // 水费方案 - 路径保持 /metering/fee/water-plan
      {
        path: '/metering/fee/water-plan',
        name: 'WaterPlan',
        component: () => import('@/views/console/fee/waterPlan'),
        meta: { title: '水费方案', icon: 'icon-shuibiao', menuNo: '66006' }
      },
      // 服务费方案 - 路径保持 /metering/fee/service-plan
      {
        path: '/metering/fee/service-plan',
        name: 'ServicePlan',
        component: () => import('@/views/console/fee/servicePlan'),
        meta: { title: '服务费方案', icon: 'icon-zhangdan', menuNo: '66007' }
      },
      // 电费调价记录 - 路径保持 /metering/fee/electricity-adjustment
      {
        path: '/metering/fee/electricity-adjustment',
        name: 'ElectricityAdjustment',
        component: () => import('@/views/console/fee/electricityAdjustment'),
        meta: { title: '电费调价记录', icon: 'icon-daikaipiao', menuNo: '66008' }
      }
    ]
  },

  // ==================== 财务 ====================
  // 创建新的一级菜单，但路径保持 /metering/finance 和 /metering/invoice
  {
    path: '/metering/finance',
    component: Layout,
    redirect: '/metering/finance/corporate-recharge',
    meta: { title: '财务', icon: 'icon-caiwu', menuNo: '67000' },
    children: [
      // ========== 分隔线：财务管理 ==========
      {
        path: 'divider-finance-management',
        name: 'FinanceDividerFinanceManagement',
        meta: {
          isDivider: true,
          dividerLabel: '代收款管理',
          hidden: false
        }
      },
      // 🆕 对公充值
      {
        path: 'corporate-recharge',
        name: 'CorporateRecharge',
        component: () => import('@/views/console/newFinance/corporateRecharge'),
        meta: { title: '对公充值', icon: 'icon-changyongtubiao_jifei', menuNo: '67001' }
      },
      // 🆕 微信充值
      {
        path: 'wechat-recharge',
        name: 'WechatRecharge',
        component: () => import('@/views/console/newFinance/weChat'),
        meta: { title: '微信充值', icon: 'icon-caiwu', menuNo: '67002' }
      },
      // 🆕 手动充值
      {
        path: 'manual-recharge',
        name: 'ManualRecharge',
        component: () => import('@/views/console/newFinance/manualRecharge'),
        meta: { title: '手动充值', icon: 'icon-zhangdan', menuNo: '67003' }
      },
      // 🆕 租户退款
      {
        path: 'new-tenant-refund',
        name: 'NewTenantRefund',
        component: () => import('@/views/console/newFinance/tenantRefund'),
        meta: { title: '租户退款', icon: 'icon-zuhupeizhi', menuNo: '67004' }
      },
      // 租户流水
      {
        path: 'new-fundFlow',
        name: 'NewFundFlow',
        component: () => import('@/views/console/bill/newBill/fundFlow'),
        meta: { title: '租户流水', icon: 'icon-zuhupeizhi', menuNo: '67007' }
      },
      {
        path: 'divider-finance-cost',
        name: 'FinanceDividerCostManagement',
        meta: {
          isDivider: true,
          dividerLabel: '成本管理',
          hidden: false
        }
      },
      {
        path: 'cost-management',
        name: 'FinanceCostManagement',
        component: () => import('@/views/console/ai-assistant/cost/index'),
        meta: { title: '电费成本管理', icon: 'icon-daikaipiao', menuNo: '67005' }
      },
      {
        path: 'divider-finance-invoice',
        name: 'FinanceDividerInvoiceManagement',
        meta: {
          isDivider: true,
          dividerLabel: '票务管理',
          hidden: false
        }
      },
      {
        path: 'tenant-invoicing',
        name: 'TenantInvoicing',
        component: () => import('@/views/console/newFinance/tenantInvoicing'),
        meta: { title: '租户开票', icon: 'icon-daikaipiao', menuNo: '67006' }
      },
      {
        path: 'divider-finance-power-insight',
        name: 'FinanceDividerPowerInsight',
        meta: {
          isDivider: true,
          dividerLabel: '电力分析',
          hidden: false
        }
      },
      {
        path: 'power-insight',
        name: 'FinancePowerInsight',
        component: { render: (h) => h('router-view') },
        redirect: '/metering/finance/power-insight/energy-overview',
        meta: {
          title: '电力分析',
          icon: 'icon-baobiao',
          menuNo: '67012',
          alwaysShow: true
        },
        children: [
          {
            path: 'energy-overview',
            name: 'FinancePowerInsightEnergyOverview',
            component: () => import('@/views/console/finance/embed/EmsTokenIframeEmbed.vue'),
            meta: {
              title: '能耗概览',
              icon: 'icon-baobiao',
              menuNo: '67013',
              refreshOnManagerSwitch: false,
              emsEmbedPath: 'energy-analysis/energy-overview'
            }
          },
          {
            path: 'loss-analysis',
            name: 'FinancePowerInsightLossAnalysis',
            component: () => import('@/views/console/finance/embed/EmsTokenIframeEmbed.vue'),
            meta: {
              title: '损耗分析',
              icon: 'icon-baobiao',
              menuNo: '67014',
              refreshOnManagerSwitch: false,
              emsEmbedPath: 'energy-analysis/loss-analysis'
            }
          },
          {
            path: 'item-topology',
            name: 'FinancePowerInsightItemTopology',
            component: () => import('@/views/console/finance/embed/EmsTokenIframeEmbed.vue'),
            meta: {
              title: '用电拓扑',
              icon: 'icon-dianbiao',
              menuNo: '67015',
              refreshOnManagerSwitch: false,
              emsEmbedPath: 'equipment-manage/item-topology'
            }
          },
          {
            path: 'electric-params',
            name: 'FinancePowerInsightElectricParams',
            component: () => import('@/views/console/finance/embed/EmsTokenIframeEmbed.vue'),
            meta: {
              title: '回路监测',
              icon: 'icon-dianbiao1',
              menuNo: '67016',
              refreshOnManagerSwitch: false,
              emsEmbedPath: 'data-query/electric-params'
            }
          }
        ]
      }
    ]
  },

  // ==================== 监测（EMS 子系统 iframe，menuNo 与后台菜单一致）====================
  {
    path: '/ym/monitoring',
    component: Layout,
    redirect: '/power-analysis/energy-overview',
    meta: { title: '监测', icon: 'icon-icon-jiankongtai', menuNo: '68000' },
    children: [
      {
        path: 'divider-power-room-monitoring',
        name: 'MonitoringDividerPowerRoom',
        meta: {
          isDivider: true,
          dividerLabel: '监测',
          hidden: false
        }
      },
      {
        path: '/power-analysis/energy-overview',
        name: 'PowerAnalysisEnergyOverview',
        component: () => import('@/views/console/finance/embed/EmsTokenIframeEmbed.vue'),
        meta: {
          title: '能耗概览',
          icon: 'icon-baobiao',
          menuNo: '63014',
          refreshOnManagerSwitch: false,
          emsEmbedPath: 'energy-analysis/energy-overview'
        }
      },
      {
        path: '/energy-analysis/loss-analysis',
        name: 'PowerAnalysisLossAnalysis',
        component: () => import('@/views/console/finance/embed/EmsTokenIframeEmbed.vue'),
        meta: {
          title: '损耗分析',
          icon: 'icon-baobiao',
          menuNo: '68001',
          refreshOnManagerSwitch: false,
          emsEmbedPath: 'energy-analysis/loss-analysis'
        }
      },
      {
        path: '/equipment-manage/item-topology',
        name: 'EquipmentItemTopology',
        component: () => import('@/views/console/finance/embed/EmsTokenIframeEmbed.vue'),
        meta: {
          title: '用电拓扑',
          icon: 'icon-dianbiao',
          menuNo: '68002',
          refreshOnManagerSwitch: false,
          emsEmbedPath: 'equipment-manage/item-topology'
        }
      },
      {
        path: '/data-query/electric-params',
        name: 'DataManagementElectricParams',
        component: () => import('@/views/console/finance/embed/EmsTokenIframeEmbed.vue'),
        meta: {
          title: '回路监测',
          icon: 'icon-dianbiao1',
          menuNo: '68003',
          refreshOnManagerSwitch: false,
          emsEmbedPath: 'data-query/electric-params'
        }
      }
    ]
  },
  {
    path: '/divider-finance-application',
    component: Layout,
    meta: {
      isDivider: true,
      dividerLabel: '',
      hidden: false,
      customClass: 'large-divider' // 🆕 添加自定义class
    }
  },
  // ==================== 应用（保持原样）====================
  {
    path: '/application',
    component: Layout,
    redirect: '/application/conditioning-control/conditioning-management',
    meta: { title: '应用', icon: 'icon-fenxiangyongneng' },
    children: [

      {
        path: 'divider-app-management',
        name: 'ApplicationDividerManagement',
        meta: {
          isDivider: true,
          dividerLabel: '应用管理',
          hidden: false
        }
      },
      // ==================== 空调智控分组 ====================
      {
        path: 'conditioning-control',
        name: 'ApplicationConditioningControl',
        component: { render: (h) => h('router-view') },
        redirect: '/application/conditioning-control/conditioning-management',
        meta: {
          title: '集中控制',
          icon: 'icon-shezhipeizhi',
          parentGroup: '空调智控'
        },
        children: [
          {
            path: 'conditioning-management',
            name: 'ConditioningManagement',
            component: () => import('@/views/console/conditioning/conditioning'),
            meta: { title: '空调控制', icon: 'icon-kongdiao' }
          },
          {
            path: 'translation',
            name: 'ConditioningTranslation',
            component: () => import('@/views/console/conditioning/translation'),
            meta: { title: '群组控制', icon: 'icon-shezhipeizhi' }
          },
          {
            path: 'scheduler',
            name: 'ConditioningScheduler',
            component: () => import('@/views/console/conditioning/scheduler'),
            meta: { title: '定时任务', icon: 'icon-shebeipeizhi' }
          }
        ]
      },
      {
        path: 'conditioning-records',
        name: 'ApplicationConditioningRecords',
        component: { render: (h) => h('router-view') },
        redirect: '/application/conditioning-records/reading',
        meta: {
          title: '记录查询',
          icon: 'icon-daikaipiao',
          parentGroup: '空调智控'
        },
        children: [
          {
            path: 'reading',
            name: 'ConditioningReading',
            component: () => import('@/views/console/conditioning/reading'),
            meta: { title: '抄表记录', icon: 'icon-daikaipiao' }
          },
          {
            path: 'runtimeLogger',
            name: 'ConditioningRuntimeLogger',
            component: () => import('@/views/console/conditioning/runtimeLogger'),
            meta: { title: '运行时间记录', icon: 'icon-daikaipiao' }
          }
        ]
      },

      // ==================== 充电服务分组 ====================
      {
        path: 'charging-management',
        name: 'ApplicationChargingManagement',
        component: { render: (h) => h('router-view') },
        redirect: '/application/charging-management/order',
        meta: {
          title: '管理',
          icon: 'icon-chongdianzhuang1',
          parentGroup: '充电服务'
        },
        children: [
          {
            path: 'order',
            name: 'ChargingOrder',
            component: () => import('@/views/console/chargingManager/order'),
            meta: { title: '订单管理', icon: 'icon-daikaipiao' }
          },
          {
            path: 'encoder',
            name: 'ChargingEncoder',
            component: () => import('@/views/console/chargingManager/encoder'),
            meta: { title: '编码管理', icon: 'icon-daikaipiao' }
          }
        ]
      },
      {
        path: 'charging-billing',
        name: 'ApplicationChargingBilling',
        component: { render: (h) => h('router-view') },
        redirect: '/application/charging-billing/billing',
        meta: {
          title: '计费',
          icon: 'icon-changyongtubiao_jifei',
          parentGroup: '充电服务'
        },
        children: [
          {
            path: 'billing',
            name: 'ChargingBilling',
            component: () => import('@/views/console/chargingManager/billing'),
            meta: { title: '充电卡流水', icon: 'icon-daikaipiao' }
          }
        ]
      },

      // ==================== 停车收费分组 ====================
      {
        path: 'parking-management',
        name: 'ApplicationParkingManagement',
        component: { render: (h) => h('router-view') },
        redirect: '/application/parking-management/parking-list',
        meta: {
          title: '落位展示',
          icon: 'icon-tingchewei',
          parentGroup: '停车收费'
        },
        children: [
          {
            path: 'parking-list',
            name: 'ParkingList',
            component: () => import('@/views/console/parking/billing/index'),
            meta: { title: '落位', icon: 'icon-chewei-01' }
          }
        ]
      },
      {
        path: 'parking-billing',
        name: 'ApplicationParkingBilling',
        component: { render: (h) => h('router-view') },
        redirect: '/application/parking-billing/parking-fee',
        meta: {
          title: '管理',
          icon: 'icon-changyongtubiao_jifei',
          parentGroup: '停车收费'
        },
        children: [
          {
            path: 'parking-fee',
            name: 'ParkingFee',
            component: () => import('@/views/console/parking/rule/index'),
            meta: { title: '车辆管理', icon: 'icon-changyongtubiao_jifei' }
          }
        ]
      },

      // ==================== 智慧照明分组 ====================
      {
        path: 'lighting-management',
        name: 'ApplicationLightingManagement',
        component: { render: (h) => h('router-view') },
        redirect: '/application/lighting-management/lighting',
        meta: {
          title: '照明管理',
          icon: 'icon-zhaoming1',
          parentGroup: '智慧照明'
        },
        children: [
          {
            path: 'lighting',
            name: 'LightingManagement',
            component: () => import('@/views/console/lighting/index'),
            meta: { title: '照明控制', icon: 'icon-zhaoming1' }
          }
        ]
      },
      {
        path: 'ai-assistant',
        name: 'ApplicationAIAssistant',
        component: { render: (h) => h('router-view') },
        redirect: '/application/ai-assistant/chat',
        hidden: true,
        meta: {
          title: 'AI 助手',
          icon: 'icon-zhaoming1', // 改成您项目中的AI图标
          parentGroup: 'AI 助手',
          hidden: true
        },
        children: [
          {
            path: 'chat',
            name: 'AIAssistantChat',
            component: () => import('@/views/console/ai-assistant/chat/index'),
            hidden: true,
            meta: { title: '智能对话', icon: 'icon-zhaoming1', hidden: true }
          },
          // 🔥 可以继续添加其他 AI 功能
          {
            path: 'verification',
            name: 'AIAssistantVerification',
            component: () => import('@/views/console/ai-assistant/verification/verificationIndex'),
            hidden: true,
            meta: { title: '电费核查联', icon: 'icon-daikaipiao', hidden: true }
          },
          {
            path: 'cost',
            name: 'AIAssistantCost',
            redirect: '/metering/finance/cost-management',
            hidden: true,
            meta: { title: '成本管理', icon: 'icon-daikaipiao', hidden: true }
          },
          {
            path: 'sub-metering',
            name: 'AIAssistantSubMetering',
            redirect: '/energy/sub-metering',
            hidden: true,
            meta: { title: '分项计量', icon: 'icon-daikaipiao', hidden: true }
          }
        ]
      }
    ]
  },

  // API文档
  {
    path: '/api-docs',
    name: 'ApiDocs',
    component: () => import('@/views/ApiDocs.vue'),
    meta: {
      title: '智能视觉-物联中台API文档',
      hidden: true
    }
  }
]

// 管理后台路由配置 (admin平台)
export const adminRoutes = [
  {
    path: '/',
    component: Layout,
    redirect: '/admin/dashboard',
    alwaysShow: true, // 强制显示为多级菜单
    meta: { title: '首页', icon: 'icon-icon-jiankongtai' },
    children: [
      {
        path: 'divider-admin-dashboard',
        name: 'AdminDividerDashboard',
        meta: {
          isDivider: true,
          dividerLabel: '后台模块',
          hidden: false
        }
      },
      {
        path: 'admin/dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/dashboard/index'),
        meta: {
          title: '后台',
          icon: 'icon-icon-jiankongtai',
          affix: true
        }
      }
    ]
  },
  {
    path: '/admin/permission',
    component: Layout,
    redirect: '/admin/permission/account',
    alwaysShow: true, // 强制显示为多级菜单
    meta: { title: '权限', icon: 'icon-shezhipeizhi' },
    children: [
      {
        path: 'divider-admin-permission',
        name: 'AdminDividerPermission',
        meta: {
          isDivider: true,
          dividerLabel: '权限信息',
          hidden: false
        }
      },
      {
        path: 'account',
        name: 'AdminPermissionAccount',
        component: () => import('@/views/admin/permission/account/index'),
        meta: { title: '账号', icon: 'icon-zuhupeizhi' }
      },
      {
        path: 'role',
        name: 'AdminPermissionRole',
        component: () => import('@/views/admin/permission/role/index'),
        meta: { title: '角色管理', icon: 'icon-cengji' }
      },
      {
        path: 'menu',
        name: 'AdminPermissionMenu',
        component: () => import('@/views/admin/permission/menu/index'),
        meta: { title: '菜单管理', icon: 'icon-shebeipeizhi' }
      }
    ]
  },
  {
    path: '/admin/device',
    component: Layout,
    redirect: '/admin/device/air',
    alwaysShow: true,
    meta: { title: '设备', icon: 'icon-shebeipeizhi' },
    children: [
      {
        path: 'divider-admin-device',
        name: 'AdminDividerDevice',
        meta: {
          isDivider: true,
          dividerLabel: '设备信息',
          hidden: false
        }
      },
      {
        path: 'air',
        name: 'AdminDeviceAir',
        component: () => import('@/views/admin/device/air/index'),
        meta: { title: '空调', icon: 'icon-kongtiao' }
      },
      {
        path: 'meter',
        name: 'AdminDeviceMeter',
        component: () => import('@/views/admin/device/meter/index'),
        meta: { title: '电表', icon: 'icon-dianbiao' }
      },
      {
        path: 'water',
        name: 'AdminDeviceWater',
        component: () => import('@/views/admin/device/water/index'),
        meta: { title: '水表', icon: 'icon-shuibiao' }
      },
      {
        path: 'meter/monitor',
        name: 'AdminDeviceMeterMonitor',
        component: () => import('@/views/admin/device/meter/monitor/index'),
        meta: { title: '电表监控', activeMenu: '/admin/device/meter' },
        hidden: true
      }
    ]
  },
  {
    path: '/admin/region',
    component: Layout,
    redirect: '/admin/region/region',
    alwaysShow: true,
    meta: { title: '区域', icon: 'icon-shebeipeizhi' },
    children: [
      {
        path: 'region-admin-region',
        name: 'AdmindRegion',
        meta: {
          isDivider: true,
          dividerLabel: '区域信息',
          hidden: false
        }
      },
      {
        path: 'region',
        name: 'AdminDeviceRegion',
        component: () => import('@/views/admin/region/region'),
        meta: { title: '区域', icon: 'icon-shebeipeizhi' }
      }
    ]
  },
  {
    path: '/admin/operation',
    component: Layout,
    redirect: '/admin/operation/orderTool',
    alwaysShow: true,
    meta: { title: '运维', icon: 'icon-yunwei' },
    children: [
      {
        path: 'divider-admin-operation',
        name: 'AdminDividerOperation',
        meta: {
          isDivider: true,
          dividerLabel: '运维工具',
          hidden: false
        }
      },
      {
        path: 'orderTool',
        name: 'AdminOperationOrderTool',
        component: () => import('@/views/admin/operation/orderTool/index'),
        meta: { title: '补单工具', icon: 'icon-budangongju' }
      },
      {
        path: 'openApi',
        name: 'AdminOperationOpenApi',
        component: () => import('@/views/admin/operation/openApi/index'),
        meta: { title: '开放权限', icon: 'icon-kaifangquanxian' }
      },
      {
        path: 'delivery',
        name: 'AdminOperationDelivery',
        component: () => import('@/views/admin/operation/delivery/index'),
        meta: { title: '交付监测', icon: 'icon-jiaofujiance' }
      },
      {
        path: 'orderTool/detail',
        name: 'AdminOperationOrderToolDetail',
        component: () => import('@/views/admin/operation/batchCreate/detail/index'),
        meta: { title: '批量补单详情', activeMenu: '/admin/operation/orderTool' },
        hidden: true
      }
    ]
  }
]

// 根据用户角色获取可访问的平台列表
export function getAvailablePlatforms (role) {
  console.log('获取用户可用平台:', role)

  switch (role) {
    case 'TESTER':
      return ['console']

    case 'MANAGER_TRIAL':
      return ['console']

    case 'SYS_ADMIN':
      return ['console', 'admin']

    case 'MANAGER':
    case 'MANAGER_FINANCE':
    case 'CONSTRUCT_DEBUG':
    case 'BUSINESS':
    case 'MA_ADMIN':
    case 'SYS_FINANCE':
    case 'SUPER_MANAGER':
      return ['console']

    default:
      console.warn(`未知角色: ${role}`)
      return []
  }
}

function filterConsoleRoutesByRole (routes, role) {
  const isSysAdmin = role === 'SYS_ADMIN'
  const denyPaths = isSysAdmin
    ? new Set()
    : new Set(['/application', '/divider-finance-application'])

  const walk = (list) => {
    const src = Array.isArray(list) ? list : []
    const out = []
    src.forEach((r) => {
      if (!r) return
      if (denyPaths.has(r.path)) return
      const next = { ...r }
      if (Array.isArray(r.children)) {
        next.children = walk(r.children)
      }
      out.push(next)
    })
    return out
  }

  return walk(routes)
}

function pruneDividerEntries (routes) {
  const src = Array.isArray(routes) ? routes : []
  const kept = []
  let hasVisibleItemAfter = false

  for (let i = src.length - 1; i >= 0; i--) {
    const r = src[i]
    if (!r) continue

    const isDivider = !!r.meta?.isDivider
    const isVisibleItem = !isDivider && !r.hidden && !r.meta?.hidden

    if (isDivider) {
      if (hasVisibleItemAfter) {
        kept.push(r)
        hasVisibleItemAfter = false
      }
      continue
    }

    kept.push(r)
    if (isVisibleItem) hasVisibleItemAfter = true
  }

  return kept.reverse()
}

function filterConsoleRoutesByMenuNos (routes, role, menuNos) {
  const isSysAdmin = role === 'SYS_ADMIN'
  const denyPaths = isSysAdmin
    ? new Set()
    : new Set(['/application', '/divider-finance-application'])

  const allowMenuNos = new Set(
    (Array.isArray(menuNos) ? menuNos : []).map((v) => String(v))
  )

  const cloneRoute = (route) => {
    const next = { ...route }
    if (Array.isArray(route.children)) {
      next.children = route.children.map(cloneRoute)
    }
    return next
  }

  const walk = (list, parentKept) => {
    const src = Array.isArray(list) ? list : []
    const out = []

    src.forEach((r) => {
      if (!r) return
      if (denyPaths.has(r.path)) return

      const isDivider = !!r.meta?.isDivider
      const selfAllowed =
        r.meta && r.meta.menuNo && allowMenuNos.has(String(r.meta.menuNo))

      const next = { ...r }

      if (Array.isArray(r.children)) {
        next.children = walk(r.children, parentKept || selfAllowed)
        next.children = pruneDividerEntries(next.children)
      }

      const hasChildren =
        Array.isArray(next.children) && next.children.length > 0

      const isHiddenRoute = r.hidden || r.meta?.hidden
      const isStandaloneHidden = isHiddenRoute && !r.meta?.activeMenu

      const keep =
        isDivider ||
        selfAllowed ||
        hasChildren ||
        ((parentKept || selfAllowed) && isHiddenRoute) ||
        isStandaloneHidden

      if (keep) out.push(next)
    })

    return out
  }

  let filtered = walk(routes, false)
  filtered = pruneDividerEntries(filtered)

  if (isSysAdmin) {
    const sourceDivider = consoleRoutes.find(
      (r) => r && r.path === '/divider-finance-application'
    )
    const sourceApplication = consoleRoutes.find(
      (r) => r && r.path === '/application'
    )

    if (sourceApplication) {
      const stripped = filtered.filter(
        (r) =>
          r &&
          r.path !== '/divider-finance-application' &&
          r.path !== '/application'
      )

      const financeIndex = stripped.findIndex(
        (r) => r && r.path === '/metering/finance'
      )
      const ymIdx = stripped.findIndex((r) => r && r.path === '/ym/monitoring')
      const insertIndex =
        ymIdx >= 0 ? ymIdx + 1 : financeIndex >= 0 ? financeIndex + 1 : stripped.length

      const additions = []
      if (sourceDivider) additions.push(cloneRoute(sourceDivider))
      additions.push(cloneRoute(sourceApplication))

      filtered = [
        ...stripped.slice(0, insertIndex),
        ...additions,
        ...stripped.slice(insertIndex)
      ]
    }
  }

  filtered = pruneDividerEntries(filtered)
  return filtered
}

function reorderConsoleTopLevelRoutes (routes) {
  const list = Array.isArray(routes) ? routes : []
  if (list.length === 0) return []

  const desiredOrder = [
    '/metering',
    '/device',
    '/energy',
    '/metering/tenant',
    '/metering/bill',
    '/metering/finance',
    '/ym/monitoring',
    '/console',
    '/ai',
    '/divider-finance-application',
    '/application'
  ]
  const rank = new Map(desiredOrder.map((p, i) => [p, i]))

  const indexed = list.map((r, idx) => ({ r, idx }))
  indexed.sort((a, b) => {
    const ra = rank.has(a.r?.path) ? rank.get(a.r?.path) : Number.MAX_SAFE_INTEGER
    const rb = rank.has(b.r?.path) ? rank.get(b.r?.path) : Number.MAX_SAFE_INTEGER
    if (ra !== rb) return ra - rb
    return a.idx - b.idx
  })
  return indexed.map((x) => x.r)
}

// 根据平台和角色获取对应的路由配置
export function getRoutesByPlatform (platform, role, options = {}) {
  console.log('获取平台路由:', platform, '角色:', role)

  const availablePlatforms = getAvailablePlatforms(role)
  if (!availablePlatforms.includes(platform)) {
    console.warn(`用户 ${role} 无权限访问平台 ${platform}`)
    return []
  }

  let routes = []

  switch (platform) {
    case 'console':
      routes =
        options && Object.prototype.hasOwnProperty.call(options, 'menuNos')
          ? filterConsoleRoutesByMenuNos(consoleRoutes, role, options.menuNos)
          : filterConsoleRoutesByRole(consoleRoutes, role)
      routes = reorderConsoleTopLevelRoutes(routes)
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

  if (routes.length > 0) {
    routes.push({ path: '*', redirect: '/404', hidden: true })
  }

  console.log(`平台 ${platform} 的路由配置:`, routes)
  return routes
}

// 获取用户默认平台
export function getDefaultPlatform (role) {
  const availablePlatforms = getAvailablePlatforms(role)

  if (availablePlatforms.length === 0) {
    return null
  }

  if (availablePlatforms.includes('console')) {
    return 'console'
  }

  return availablePlatforms[0]
}
