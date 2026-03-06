import Layout from "@/layout";

// 控制台路由配置 (console平台)
export const consoleRoutes = [
  // ==================== 首页 ====================
  // 路径保持 /metering/dashboard
  {
    path: "/metering",
    component: Layout,
    redirect: "/metering/dashboard",
    meta: { title: "首页", icon: "icon-icon-jiankongtai" },
    alwaysShow: true,
    children: [
      {
        path: "divider-system-home",
        name: "MeteringDividerSystemHome",
        meta: {
          isDivider: true,
          dividerLabel: "系统首页",
          hidden: false,
        },
      },
      {
        path: "dashboard",
        name: "MeteringDashboard",
        component: () => import("@/views/console/dataBoard/index"),
        meta: { title: "租户看板", icon: "icon-icon-jiankongtai" },
      },
      // 🆕 从设备模块移动过来的三个页面
      {
        path: "/device/dashboard",
        name: "DeviceDashboard",
        component: () => import("@/views/console/dashboard/index"),
        meta: { title: "设备看板", icon: "icon-icon-jiankongtai" },
      },
      // 配电图 - 路径保持 /console/distributionDiagram
      {
        path: "/console/distributionDiagram",
        name: "ConsoleDistributionDiagram",
        component: () => import("@/views/console/test/distributionDiagram"),
        meta: { title: "配电图", icon: "icon-cengji" },
      },
      // 充电桩总览 - 路径保持 /energy/char-dashboard
      {
        path: "/energy/char-dashboard",
        name: "CharDashboard",
        component: () => import("@/views/console/charDashboard/index"),
        meta: { title: "充电桩总览", icon: "icon-chongdianzhuang" },
      },
    ],
  },

  // ==================== 区域（保持原样）====================
  {
    path: "/console",
    component: Layout,
    redirect: "/console/test",
    meta: { title: "区域", icon: "icon-cengji" },
    children: [
      {
        path: "divider-area-management",
        name: "ConsoleDividerAreaManagement",
        meta: {
          isDivider: true,
          dividerLabel: "区域管理",
          hidden: false,
        },
      },
      {
        path: "test",
        name: "ConsoleTest",
        component: () => import("@/views/console/test/index"),
        meta: { title: "区域配置", icon: "icon-shezhipeizhi" },
      },
      {
        path: "visualization",
        name: "ConsoleVisualization",
        component: () => import("@/views/console/test/visualization"),
        meta: { title: "区域可视化", icon: "icon-cengji" },
      },
      {
        path: "parkingSpace",
        name: "ConsoleParkingSpace",
        component: () => import("@/views/console/test/parkingSpace"),
        meta: { title: "车位管理", icon: "icon-cengji" },
      },
    ],
  },

  // ==================== 设备 ====================
  {
    path: "/device",
    component: Layout,
    redirect: "/device/electricity", // 🔧 修改redirect，指向第一个实际页面
    meta: { title: "设备", icon: "icon-shebeipeizhi" },
    children: [
      // ========== 分隔线：计量设备 ==========
      {
        path: "divider-metering-devices",
        name: "DeviceDividerMeteringDevices",
        meta: {
          isDivider: true,
          dividerLabel: "计量设备",
          hidden: false,
        },
      },
      // 电表
      {
        path: "electricity",
        name: "DeviceElectricity",
        component: () => import("@/views/console/device/electricity"),
        meta: { title: "电表", icon: "icon-dianbiao1" },
      },
      {
        path: "electricity/detail/:id",
        name: "DeviceElectricityDetail",
        component: () => import("@/views/console/device/electricity/detail"),
        hidden: true,
        meta: {
          title: "电表详情",
          icon: "icon-dianbiao1",
          hidden: true,
          activeMenu: "/device/electricity",
        },
      },
      // 水表
      {
        path: "watermeter",
        name: "DeviceWatermeter",
        component: () => import("@/views/console/device/watermeter"),
        meta: { title: "水表", icon: "icon-shuibiao" },
      },
      {
        path: "watermeter/detail/:id",
        name: "DeviceWatermeterDetail",
        component: () => import("@/views/console/device/watermeter/detail"),
        hidden: true,
        meta: {
          title: "水表详情",
          icon: "icon-shuibiao",
          hidden: true,
          activeMenu: "/device/watermeter",
        },
      },
      // 空调
      {
        path: "conditioning",
        name: "DeviceConditioning",
        component: () => import("@/views/console/device/conditioning"),
        meta: { title: "空调", icon: "icon-kongtiao" },
      },
      {
        path: "conditioning/detail/:id",
        name: "DeviceConditioningDetail",
        component: () => import("@/views/console/device/conditioning/detail"),
        hidden: true,
        meta: {
          title: "空调详情",
          icon: "icon-kongtiao",
          hidden: true,
          activeMenu: "/device/conditioning",
        },
      },

      // ========== 分隔线：设备公摊组 ==========
      {
        path: "divider-sharing-groups",
        name: "DeviceDividerSharingGroups",
        meta: {
          isDivider: true,
          dividerLabel: "设备公摊组",
          hidden: false,
        },
      },
      // 电表公摊组 - 路径保持 /metering/fee/electricitySharing
      {
        path: "/metering/fee/electricitySharing",
        name: "ElectricitySharing",
        component: () => import("@/views/console/device/publicshare/electricitySharing"),
        meta: { title: "电表公摊组", icon: "icon-dianbiao" },
      },
      {
        path: "/metering/fee/electricitySharing/detail",
        name: "ElectricitySharingDetail",
        component: () => import("@/views/console/device/publicshare/components/ShareDetail"),
        hidden: true,
        meta: {
          title: "电表公摊详情",
          icon: "icon-dianbiao",
          hidden: true,
          activeMenu: "/metering/fee/electricitySharing",
        },
      },
      // 水表公摊组 - 路径保持 /metering/fee/watermeterSharing
      {
        path: "/metering/fee/watermeterSharing",
        name: "WatermeterSharing",
        component: () => import("@/views/console/device/publicshare/watermeterSharing"),
        meta: { title: "水表公摊组", icon: "icon-shuibiao" },
      },
         {
        path: "/metering/fee/watermeterSharing/detail",
        name: "WatermeterSharingDetail",
        component: () => import("@/views/console/device/publicshare/components/watermeterDetail"),
        hidden: true,
        meta: {
          title: "水表公摊详情",
          icon: "icon-shuibiao",
          hidden: true,
          activeMenu: "/metering/fee/watermeterSharing",
        },
      },
      // 空调公摊组 - 路径保持 /metering/fee/conditioningSharing
      {
        path: "/metering/fee/conditioningSharing",
        name: "ConditioningSharing",
        component: () => import("@/views/console/device/publicshare/conditioningSharing"),
        meta: { title: "空调公摊组", icon: "icon-kongtiao" },
      },
         {
        path: "/metering/fee/conditioningSharing/detail",
        name: "ConditioningSharingDetail",
        component: () => import("@/views/console/device/publicshare/components/conditDetail"),
        hidden: true,
        meta: {
          title: "空调公摊详情",
          icon: "icon-dianbiao",
          hidden: true,
          activeMenu: "/metering/fee/conditioningSharing",
        },
      },

      // ========== 分隔线：其他智能设备 ==========
      {
        path: "divider-smart-devices",
        name: "DeviceDividerSmartDevices",
        meta: {
          isDivider: true,
          dividerLabel: "其他智能设备",
          hidden: false,
        },
      },
      // 照明
      {
        path: "lighting",
        name: "DeviceLighting",
        component: () => import("@/views/console/device/lighting"),
        meta: { title: "照明", icon: "icon-zhaoming1" },
      },
      {
        path: "lighting/detail/:id",
        name: "DeviceLightingDetail",
        component: () => import("@/views/console/device/lighting/detail"),
        hidden: true,
        meta: {
          title: "照明详情",
          icon: "icon-zhaoming1",
          hidden: true,
          activeMenu: "/device/lighting",
        },
      },
      // 车位
      {
        path: "parking",
        name: "DeviceParking",
        component: () => import("@/views/console/device/parking"),
        meta: { title: "车位", icon: "icon-peizhitubiaosvg-" },
      },
      {
        path: "parking/detail/:id",
        name: "DeviceParkingDetail",
        component: () => import("@/views/console/device/parking/detail"),
        hidden: true,
        meta: {
          title: "车位详情",
          icon: "icon-peizhitubiaosvg-",
          hidden: true,
          activeMenu: "/device/parking",
        },
      },
      // 门锁
      {
        path: "doorlock",
        name: "DeviceDoorlock",
        component: () => import("@/views/console/device/doorlock"),
        meta: { title: "门锁", icon: "icon-fangjian" },
      },
      // 充电桩
      {
        path: "charging",
        name: "DeviceCharging",
        component: () => import("@/views/console/device/charging"),
        meta: { title: "充电桩", icon: "icon-chongdianzhuang1" },
      },
      {
        path: "charging/detail/:id",
        name: "DeviceChargingDetail",
        component: () => import("@/views/console/device/charging/detail"),
        hidden: true,
        meta: {
          title: "充电桩详情",
          icon: "icon-chongdianzhuang1",
          hidden: true,
          activeMenu: "/device/charging",
        },
      },
    ],
  },

  // ==================== 用能 ====================
  {
    path: "/energy",
    component: Layout,
    redirect: "/energy/equipmentPower",
    meta: { title: "用能", icon: "icon-baobiao" },
    children: [
       {
      path: "divider-equipment-reports",
      name: "EnergyDividerEquipmentReports",
      meta: {
        isDivider: true,
        dividerLabel: "设备用能报表",
        hidden: false,
      },
    },
    // 🆕 设备用电 - 放在第一行
    {
      path: "equipmentPower",
      name: "EquipmentPower",
      component: () => import("@/views/console/energy/equipmentPower"),
      meta: { title: "电表用电", icon: "icon-dianbiao" }, // 可根据需要调整icon
    },
     {
        path: "charging-sankey",
        name: "ChargingSankey",
        component: () => import("@/views/console/energy/chargingReport"),
        meta: { title: "空调用电", icon: "icon-kongtiao" },
      },
       {
        path: "charging-water",
        name: "ChargingWater",
        component: () => import("@/views/console/energy/equipmentWater"),
        meta: { title: "设备用水", icon: "icon-shuibiao" },
      },
      // ========== 分隔线：租户用能报表 ==========
      {
        path: "divider-tenant-reports",
        name: "EnergyDividerTenantReports",
        meta: {
          isDivider: true,
          dividerLabel: "租户用能报表",
          hidden: false,
        },
      },
      // 租户用电
      {
        path: "electricity-report",
        name: "ElectricityReport",
        component: () => import("@/views/console/energy/electricityReport"),
        meta: { title: "租户用电", icon: "icon-dianbiao" },
      },
      // 租户用电桑基图
      {
        path: "electricity-sankey",
        name: "ElectricitySankey",
        component: () => import("@/views/console/energy/electricitySankey"),
        meta: { title: "租户用电桑基图", icon: "icon-dianbiao3" },
      },
      // 租户用水
      {
        path: "water-report",
        name: "WaterReport",
        component: () => import("@/views/console/energy/waterReport"),
        meta: { title: "租户用水", icon: "icon-shuibiao" },
      },
      // 租户用水明细
      {
        path: "water-sankey",
        name: "WaterSankey",
        component: () => import("@/views/console/energy/waterSankey"),
        meta: { title: "租户用水桑基图", icon: "icon-shuibiao_o" },
      },
      // ========== 分隔线：分项计量 ==========
      {
        path: "divider-sub-metering",
        name: "EnergyDividerSubMetering",
        meta: {
          isDivider: true,
          dividerLabel: "分项计量",
          hidden: false,
        },
      },
      // 分项计量
      {
        path: "sub-metering",
        name: "ConsolesubMetering",
        component: () => import("@/views/console/subMetering/sub-metering"),
        meta: { title: "用电分项计量", icon: "icon-daikaipiao" },
      },
      {
        path: "sub-metering/detail/:id",
        name: "ConsolesubMeteringDetail",
        component: () => import("@/views/console/subMetering/detail"),
        hidden: true,
        meta: {
          title: "分项计量设置",
          icon: "icon-daikaipiao",
          hidden: true,
          activeMenu: "/energy/sub-metering",
        },
      },
    ],
  },

  // ==================== 账单 ====================
  // 创建新的一级菜单，但路径保持 /metering/bill
  {
    path: "/metering/bill",
    component: Layout,
    redirect: "/metering/bill/consumption-bill",
    meta: { title: "账单", icon: "icon-zhangdan" },
    children: [
      // ========== 分隔线：账单管理 ==========
      {
        path: "divider-bill-management",
        name: "BillDividerManagement",
        meta: {
          isDivider: true,
          dividerLabel: "账单管理",
          hidden: false,
        },
      },
      // 🆕 用能账单
      {
        path: "consumption-bill",
        name: "ConsumptionBill",
        component: () => import("@/views/console/bill/newBill/consumptionBill"),
        meta: { title: "用能账单", icon: "icon-dianbiao" },
      },
      // 🆕 手动账单
      {
        path: "new-manual-bill",
        name: "NewManualBill",
        component: () => import("@/views/console/bill/newBill/manualBill"),
        meta: { title: "手动账单", icon: "icon-zhangdan" },
      },
      // 🆕 浮动电价(新)
      {
        path: "float-price",
        name: "FloatPrice",
        component: () => import("@/views/console/bill/newBill/floatPrice"),
        meta: { title: "浮动电价", icon: "icon-changyongtubiao_jifei" },
      },
      // 🆕 分摊账单
      {
        path: "split-bill",
        name: "SplitBill",
        component: () => import("@/views/console/bill/newBill/splittheBill"),
        meta: { title: "分摊账单", icon: "icon-fenxiangyongneng" },
      },
    ],
  },

  // ==================== 租户 ====================
  // 创建新的一级菜单，但路径保持 /metering/tenant
  {
    path: "/metering/tenant",
    component: Layout,
    redirect: "/metering/tenant/list",
    meta: { title: "租户", icon: "icon-zuhupeizhi" },
    children: [
      // ========== 分隔线：租户管理 ==========
      {
        path: "divider-tenant-management",
        name: "TenantDividerManagement",
        meta: {
          isDivider: true,
          dividerLabel: "租户管理",
          hidden: false,
        },
      },
      // 租户卡片
      {
        path: "list",
        name: "TenantList",
        component: () => import("@/views/console/tenant/list"),
        meta: { title: "租户卡片", icon: "icon-zuhupeizhi" },
      },
      {
        path: "detail/:id",
        name: "TenantDetail",
        component: () => import("@/views/console/tenant/detail"),
        hidden: true,
        meta: {
          title: "租户详情",
          icon: "icon-zuhupeizhi",
          hidden: true,
          activeMenu: "/metering/tenant/list",
        },
      },
      // 租户账单 - 路径保持 /metering/bill/energy-bill，但在租户菜单下也显示
      {
        path: "/metering/bill/energy-bill-tenant",
        name: "TenantEnergyBill",
        component: () => import("@/views/console/bill/energyBill"),
        meta: { title: "租户账单", icon: "icon-zuhupeizhi" },
      },
      // 账单统计 - 路径保持 /metering/bill/floating-price，但在租户菜单下也显示
      {
        path: "/metering/bill/floating-price-tenant",
        name: "TenantFloatingPrice",
        component: () => import("@/views/console/bill/floatingPrice"),
        meta: { title: "账单统计", icon: "icon-fenxiangyongneng" },
      },

      // ========== 分隔线：租户计费方案 ==========
      {
        path: "divider-billing-plans",
        name: "TenantDividerBillingPlans",
        meta: {
          isDivider: true,
          dividerLabel: "租户计费方案",
          hidden: false,
        },
      },
      // 电费方案 - 路径保持 /metering/fee/electricity-plan
      {
        path: "/metering/fee/electricity-plan",
        name: "ElectricityPlan",
        component: () => import("@/views/console/fee/electricityPlan"),
        meta: { title: "电费方案", icon: "icon-dianbiao" },
      },
      // 水费方案 - 路径保持 /metering/fee/water-plan
      {
        path: "/metering/fee/water-plan",
        name: "WaterPlan",
        component: () => import("@/views/console/fee/waterPlan"),
        meta: { title: "水费方案", icon: "icon-shuibiao" },
      },
      // 服务费方案 - 路径保持 /metering/fee/service-plan
      {
        path: "/metering/fee/service-plan",
        name: "ServicePlan",
        component: () => import("@/views/console/fee/servicePlan"),
        meta: { title: "服务费方案", icon: "icon-zhangdan" },
      },
      // 电费调价记录 - 路径保持 /metering/fee/electricity-adjustment
      {
        path: "/metering/fee/electricity-adjustment",
        name: "ElectricityAdjustment",
        component: () => import("@/views/console/fee/electricityAdjustment"),
        meta: { title: "电费调价记录", icon: "icon-daikaipiao" },
      },
    ],
  },

  // ==================== 财务 ====================
  // 创建新的一级菜单，但路径保持 /metering/finance 和 /metering/invoice
  {
    path: "/metering/finance",
    component: Layout,
    redirect: "/metering/finance/corporate-recharge",
    meta: { title: "财务", icon: "icon-caiwu" },
    children: [
      // ========== 分隔线：财务管理 ==========
      {
        path: "divider-finance-management",
        name: "FinanceDividerFinanceManagement",
        meta: {
          isDivider: true,
          dividerLabel: "财务管理",
          hidden: false,
        },
      },
      // 🆕 对公充值
      {
        path: "corporate-recharge",
        name: "CorporateRecharge",
        component: () => import("@/views/console/newFinance/corporateRecharge"),
        meta: { title: "对公充值", icon: "icon-changyongtubiao_jifei" },
      },
      // 🆕 微信充值
      {
        path: "wechat-recharge",
        name: "WechatRecharge",
        component: () => import("@/views/console/newFinance/weChat"),
        meta: { title: "微信充值", icon: "icon-caiwu" },
      },
      // 🆕 手动充值
      {
        path: "manual-recharge",
        name: "ManualRecharge",
        component: () => import("@/views/console/newFinance/manualRecharge"),
        meta: { title: "手动充值", icon: "icon-zhangdan" },
      },
      // 🆕 租户退款
      {
        path: "new-tenant-refund",
        name: "NewTenantRefund",
        component: () => import("@/views/console/newFinance/tenantRefund"),
        meta: { title: "租户退款", icon: "icon-zuhupeizhi" },
      },
      // 🆕 租户开票
      {
        path: "tenant-invoicing",
        name: "TenantInvoicing",
        component: () => import("@/views/console/newFinance/tenantInvoicing"),
        meta: { title: "租户开票", icon: "icon-daikaipiao" },
      },
    ],
  },
  {
    path: "/divider-finance-application",
    component: Layout,
    meta: {
      isDivider: true,
      dividerLabel: "",
      hidden: false,
      customClass: "large-divider", // 🆕 添加自定义class
    },
  },
  // ==================== 应用（保持原样）====================
  {
    path: "/application",
    component: Layout,
    redirect: "/application/conditioning-control/conditioning-management",
    meta: { title: "应用", icon: "icon-fenxiangyongneng" },
    children: [

      {
        path: "divider-app-management",
        name: "ApplicationDividerManagement",
        meta: {
          isDivider: true,
          dividerLabel: "应用管理",
          hidden: false,
        },
      },
      // ==================== 空调智控分组 ====================
      {
        path: "conditioning-control",
        name: "ApplicationConditioningControl",
        component: { render: (h) => h("router-view") },
        redirect: "/application/conditioning-control/conditioning-management",
        meta: {
          title: "集中控制",
          icon: "icon-shezhipeizhi",
          parentGroup: "空调智控",
        },
        children: [
          {
            path: "conditioning-management",
            name: "ConditioningManagement",
            component: () => import("@/views/console/conditioning/conditioning"),
            meta: { title: "空调控制", icon: "icon-kongdiao" },
          },
          {
            path: "translation",
            name: "ConditioningTranslation",
            component: () => import("@/views/console/conditioning/translation"),
            meta: { title: "群组控制", icon: "icon-shezhipeizhi" },
          },
          {
            path: "scheduler",
            name: "ConditioningScheduler",
            component: () => import("@/views/console/conditioning/scheduler"),
            meta: { title: "定时任务", icon: "icon-shebeipeizhi" },
          },
        ],
      },
      {
        path: "conditioning-records",
        name: "ApplicationConditioningRecords",
        component: { render: (h) => h("router-view") },
        redirect: "/application/conditioning-records/reading",
        meta: {
          title: "记录查询",
          icon: "icon-daikaipiao",
          parentGroup: "空调智控",
        },
        children: [
          {
            path: "reading",
            name: "ConditioningReading",
            component: () => import("@/views/console/conditioning/reading"),
            meta: { title: "抄表记录", icon: "icon-daikaipiao" },
          },
          {
            path: "runtimeLogger",
            name: "ConditioningRuntimeLogger",
            component: () => import("@/views/console/conditioning/runtimeLogger"),
            meta: { title: "运行时间记录", icon: "icon-daikaipiao" },
          },
        ],
      },

      // ==================== 充电服务分组 ====================
      {
        path: "charging-management",
        name: "ApplicationChargingManagement",
        component: { render: (h) => h("router-view") },
        redirect: "/application/charging-management/order",
        meta: {
          title: "管理",
          icon: "icon-chongdianzhuang1",
          parentGroup: "充电服务",
        },
        children: [
          {
            path: "order",
            name: "ChargingOrder",
            component: () => import("@/views/console/chargingManager/order"),
            meta: { title: "订单管理", icon: "icon-daikaipiao" },
          },
          {
            path: "encoder",
            name: "ChargingEncoder",
            component: () => import("@/views/console/chargingManager/encoder"),
            meta: { title: "编码管理", icon: "icon-daikaipiao" },
          },
        ],
      },
      {
        path: "charging-billing",
        name: "ApplicationChargingBilling",
        component: { render: (h) => h("router-view") },
        redirect: "/application/charging-billing/billing",
        meta: {
          title: "计费",
          icon: "icon-changyongtubiao_jifei",
          parentGroup: "充电服务",
        },
        children: [
          {
            path: "billing",
            name: "ChargingBilling",
            component: () => import("@/views/console/chargingManager/billing"),
            meta: { title: "充电卡流水", icon: "icon-daikaipiao" },
          },
        ],
      },

      // ==================== 停车收费分组 ====================
      {
        path: "parking-management",
        name: "ApplicationParkingManagement",
        component: { render: (h) => h("router-view") },
        redirect: "/application/parking-management/parking-list",
        meta: {
          title: "管理",
          icon: "icon-tingchewei",
          parentGroup: "停车收费",
        },
        children: [
          {
            path: "parking-list",
            name: "ParkingList",
            component: () => import("@/views/console/parking/billing/index"),
            meta: { title: "停车管理", icon: "icon-chewei-01" },
          },
        ],
      },
      {
        path: "parking-billing",
        name: "ApplicationParkingBilling",
        component: { render: (h) => h("router-view") },
        redirect: "/application/parking-billing/parking-fee",
        meta: {
          title: "计费",
          icon: "icon-changyongtubiao_jifei",
          parentGroup: "停车收费",
        },
        children: [
          {
            path: "parking-fee",
            name: "ParkingFee",
            component: () => import("@/views/console/parking/rule/index"),
            meta: { title: "停车计费", icon: "icon-changyongtubiao_jifei" },
          },
        ],
      },

      // ==================== 智慧照明分组 ====================
      {
        path: "lighting-management",
        name: "ApplicationLightingManagement",
        component: { render: (h) => h("router-view") },
        redirect: "/application/lighting-management/lighting",
        meta: {
          title: "照明管理",
          icon: "icon-zhaoming1",
          parentGroup: "智慧照明",
        },
        children: [
          {
            path: "lighting",
            name: "LightingManagement",
            component: () => import("@/views/console/lighting/index"),
            meta: { title: "照明控制", icon: "icon-zhaoming1" },
          },
        ],
      },
    ],
  },

  // API文档
  {
    path: "/api-docs",
    name: "ApiDocs",
    component: () => import("@/views/ApiDocs.vue"),
    meta: {
      title: "数字物宇-物联中台API文档",
      hidden: true,
    },
  },
];

// 管理后台路由配置 (admin平台) - 保持不变
export const adminRoutes = [
  {
    path: "/",
    component: Layout,
    redirect: "/admin/dashboard",
    meta: { title: "管理后台首页", icon: "el-icon-monitor" },
    children: [
      {
        path: "admin/dashboard",
        name: "AdminDashboard",
        component: () => import("@/views/admin/dashboard/index"),
        meta: {
          title: "管理后台大屏",
          icon: "el-icon-data-board",
          affix: true,
        },
      },
    ],
  },
  {
    path: "/admin",
    component: Layout,
    redirect: "/admin/test",
    meta: { title: "管理后台测试", icon: "el-icon-setting" },
    children: [
      {
        path: "test",
        name: "AdminTest",
        component: () => import("@/views/admin/test/index"),
        meta: { title: "管理后台测试", icon: "el-icon-setting" },
      },
      {
        path: "test1",
        name: "AdminTest1",
        component: () => import("@/views/admin/test/test1/index"),
        meta: { title: "测试1", icon: "el-icon-cpu" },
      },
    ],
  },
];

// 根据用户角色获取可访问的平台列表
export function getAvailablePlatforms(role) {
  console.log("获取用户可用平台:", role);

  switch (role) {
    case "TESTER":
      return ["console"];

    case "SYS_ADMIN":
    case "MANAGER":
    case "CONSTRUCT_DEBUG":
    case "BUSINESS":
    case "MA_ADMIN":
      return ["console", "admin"];

    case "SYS_FINANCE":
    case "SUPER_MANAGER":
      return ["console", "admin"];

    default:
      console.warn(`未知角色: ${role}`);
      return [];
  }
}

// 根据平台和角色获取对应的路由配置
export function getRoutesByPlatform(platform, role) {
  console.log("获取平台路由:", platform, "角色:", role);

  const availablePlatforms = getAvailablePlatforms(role);
  if (!availablePlatforms.includes(platform)) {
    console.warn(`用户 ${role} 无权限访问平台 ${platform}`);
    return [];
  }

  let routes = [];

  switch (platform) {
    case "console":
      routes = [...consoleRoutes];
      console.log("返回控制台路由");
      break;

    case "admin":
      routes = [...adminRoutes];
      console.log("返回管理后台路由");
      break;

    default:
      console.warn(`未知平台: ${platform}`);
      routes = [];
  }

  if (platform === "console") {
    routes = routes.map((r) => {
      if (r.path === "/application" && Array.isArray(r.children)) {
        const children =
          role === "SYS_ADMIN"
            ? r.children
            : r.children.filter((child) => {
                const pg = child.meta && child.meta.parentGroup;
                return pg !== "充电服务" && pg !== "停车收费";
              });
        return { ...r, children };
      }
      return r;
    });
  }

  if (routes.length > 0) {
    routes.push({ path: "*", redirect: "/404", hidden: true });
  }

  console.log(`平台 ${platform} 的路由配置:`, routes);
  return routes;
}

// 获取用户默认平台
export function getDefaultPlatform(role) {
  const availablePlatforms = getAvailablePlatforms(role);

  if (availablePlatforms.length === 0) {
    return null;
  }

  if (availablePlatforms.includes("console")) {
    return "console";
  }

  return availablePlatforms[0];
}
