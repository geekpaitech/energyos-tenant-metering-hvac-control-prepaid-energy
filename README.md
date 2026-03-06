# 数字物宇-多联机中央空调集控+计费系统

面向智慧楼宇与数字能源的企业级前端项目，聚焦“多联机中央空调集控 + 计费 + 能耗分析 + 运营”。基于 IoT + AI + Data 的产品理念，支撑设备统一接入、能耗精细化管理与运营协同。项目采用 Vue 2 + Vue CLI 4 + Element UI 等技术栈构建，支持 PWA 与单元测试。

- 官网：https://geekpartytech.com/
- 系统地址：https://iot.geekpartytech.com/
- 演示账号：18866668888
- 演示密码：Demo@2025

## 核心能力
- 集控：空调设备接入、组控、调度、运行日志
- 计费：能耗账单、分摊、浮动电价、手工账单
- 能源分析：电/水报表、桑基图、设备功率与用能分布
- 运营：租户管理、充值退款、发票、资金流水
- 设备协同：照明、门锁、停车等多场景协同
- AI 助手：费用智能核验与预测

## 技术栈
- 框架：Vue 2、Vue Router、Vuex、Element UI
- 可视化：ECharts、Konva
- 工具：Axios、Ali-OSS、Mock.js、Moment、xlsx
- PWA：register-service-worker，图标路径经 vue.config.js 配置
- 测试：@vue/cli-plugin-unit-mocha + @vue/test-utils + chai

## 目录结构
```
wyy-admin/
├─ public/                # 静态资源与模板 (index.html, favicon 等)
│  ├─ img/icons/          # PWA 图标
│  └─ robots.txt
├─ src/
│  ├─ api/                # 按领域划分的接口模块 (空调/水电/计费/租户/财务等)
│  ├─ assets/             # 样式与图片 (floors SVG 使用自定义 loader)
│  ├─ components/         # 公共组件 (Breadcrumb、Pagination、TagsView 等)
│  ├─ layout/             # 应用布局 (Navbar、Sidebar、AppMain)
│  ├─ mock/               # 本地模拟数据
│  ├─ router/             # 全局路由
│  ├─ store/              # Vuex 模块 (app、permission、user 等)
│  ├─ utils/              # 请求封装/鉴权/菜单路由/校验工具
│  ├─ views/              # 业务页面
│  │  ├─ console/         # 设备/计费/能源/AI 助手等控制台模块
│  │  ├─ device/          # 设备详情与协同 (空调/水表/电表/照明/门锁/停车)
│  │  ├─ energy/          # 能源报表/桑基图/设备功率
│  │  ├─ fee/             # 费率与服务方案
│  │  ├─ finance/         # 资金流水/提现/退款/发票
│  │  ├─ tenant/          # 租户档案/设备/账单/交易
│  │  ├─ parking/         # 计费与规则配置
│  │  ├─ dashboard/       # 运营看板与统计
│  │  ├─ login/           # 登录页
│  │  ├─ system/          # 用户/角色/菜单权限
│  │  ├─ operator/        # 运维变更日志与管理
│  │  ├─ order/           # 订单列表与详情
│  │  ├─ report/          # 报表 (概览/销售/用户)
│  │  ├─ ApiDocs.vue      # API 使用说明入口
│  │  ├─ 401.vue / 404.vue
│  │  └─ ...
│  ├─ App.vue
│  ├─ main.js
│  ├─ permission.js
│  └─ settings.js
├─ tests/unit/            # 单元测试示例
├─ .env.development       # 开发环境变量
├─ .env.production        # 生产环境变量
├─ vue.config.js          # 开发服务器/代理与 floors SVG loader 自定义
├─ babel.config.js
├─ .eslintrc.js
├─ .editorconfig
├─ .browserslistrc
└─ package.json
```

## 环境要求
- Node.js >= 14（推荐 16/18 LTS）
- npm >= 7

## 快速开始
```bash
npm install
npm run serve
```
- 本地开发地址：http://localhost:8080
- 代理配置：`/api` → `https://iot-test.geekpartytech.com`（详见 vue.config.js）

## 构建与测试
```bash
npm run build      # 生产构建
npm run test:unit  # 单元测试
npm run lint       # 代码规范检查与修复
```

## 环境变量
- 开发环境（.env.development）
  - VUE_APP_BASE_API=/dev-api
  - VUE_APP_HTTPS=false
  - PORT=8080
  - OPEN=true
- 生产环境（.env.production）
  - VUE_APP_BASE_API=https://api.yourdomain.com
  - VUE_APP_HTTPS=true
> 说明：实际 API 域名与 HTTPS 策略以部署环境为准，通过环境变量注入。

## 部署指南
- 生产构建产物可部署至任意 Web 服务器或 CDN。
- 确保后端 API 与 `VUE_APP_BASE_API` 对齐，必要时在网关配置反向代理。
- PWA 图标路径在 `vue.config.js` 的 `pwa.iconPaths` 中已统一为 `favicon.ico`。

## 安全与合规
- 不在仓库中存储敏感密钥；Ali-OSS 等凭据通过后端签名或环境变量注入。
- 演示账号与密码仅用于体验环境，勿用于生产。
- 前端层面采用输入校验与 DOMPurify 等策略防止 XSS。

## 接口与封装
- `src/utils/request.js` 基于 Axios 封装，统一拦截器与错误处理。
- `src/api/` 下按领域拆分接口文件（如 `airCondition.js`、`meter.js`、`billDetailApi.js`、`tenant.js`、`finance` 等）。

## 业务模块导航
- Conditioning：集控、抄表、运行日志、调度器
- Billing：能耗账单、分摊、浮动电价、手工账单
- Energy：电/水报表、桑基图、设备功率
- Finance：资金流水、提现、退款、发票
- Tenant：租户档案、设备、账单、交易
- Device：空调/水表/电表/照明/门锁/停车
- Parking：计费与规则配置
- System：用户/角色/菜单权限
- Dashboard：运营看板与统计

## 演示与截图
- 方式一（推荐）：提供线上图片 URL（HTTPS/CDN），我们将在下方“演示截图”小节中直接引用。
- 方式二：若需本仓库存放，请提供图片文件，我们建议统一放置在 `docs/screenshots/` 并在 README 中引用。
- 请为每张图提供标题与简述（模块/页面/关键指标）。

### 演示截图（占位）
- Dashboard 总览（待补充）
- Conditioning 调度（待补充）
- Billing 账单（待补充）
- Energy 报表（待补充）
- Tenant 档案（待补充）

## 版本与命名
- 展示名称：数字物宇-多联机中央空调集控+计费系统
- 包名：当前 `package.json` 的 `name` 为 `admin-fcc`（私有项目，为避免构建工具异常暂不改动）。如需同步更改包名，请说明目标命名与发布策略，我们将配合调整。

## 相关链接
- 极派科技官网：https://geekpartytech.com/
- 数字物宇-物联中台：https://iot.geekpartytech.com/
