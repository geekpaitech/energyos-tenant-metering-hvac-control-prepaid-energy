# 数字物宇-多联机中央空调集控+计费系统

面向智慧楼宇与数字能源的企业级前端项目，聚焦“多联机中央空调集控 + 计费 + 能耗分析 + 运营”。遵循 AI Native 能源管理理念，基于云-管-端架构与 IoT + AI + Data 能力，支撑设备统一接入、能耗精细化管理与运营协同，满足百万设备并发与 99.99% 可用性目标。

- 官网：https://geekpartytech.com/
- 系统地址：https://iot.geekpartytech.com/
- 产品介绍：https://vrf.geekpartytech.com/
- 演示账号：18866668888
- 演示密码：Demo@2025

## 核心能力
- 多品牌统一管控：兼容主流 VRF 厂商与 200+ 协议，统一接入与控制
- 精准分户计量：冷量/电量分户与账单溯源，预付费模式零欠费
- 集控与调度：设备组控、时序调度、运行日志与异常处理
- 能源分析：电/水报表、桑基图、设备功率与用能分布、节能对比
- 计费与结算：费率管理、分摊、浮动电价、手工账单与对账核验
- 运营协同：租户管理、充值退款、发票、资金流水、工单与告警
- AI Agent：费用智能核验与预测、故障分析与策略推荐

## 系统架构
- 应用层：物业管理端、租户小程序、工程 App、开放 API
- 平台层：设备管理、计费引擎、告警中心、数据分析中台
- 边缘层：品牌网关、LoRa/NB/4G 通信模块、边缘计算与协议转换
- 设备层：主流 VRF 与配套仪表；断网可脱机运行，数据本地缓存与同步

## 技术栈
- 前端：Vue CLI、Vue Router、Vuex、Element UI
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
### 租户看板
![租户看板](src/assets/readme/1.png)

### 电表
![电表](src/assets/readme/2.png)

### 设备大屏
![设备大屏](src/assets/readme/3.png)

### 空调
![空调](src/assets/readme/4.png)

### 用电报表
![用电报表](src/assets/readme/5.png)

### 空调设备数据
![空调设备数据](src/assets/readme/6.png)

### 分项计量与电费核查（含 AI 分析）
![分项计量-电费核查联 AI 相关分析](src/assets/readme/7.png)

### 基于 AI 的智能对话
![基于 AI 智能对话](src/assets/readme/8.png)

> 截图位于 `src/assets/readme/` 目录，均为 PNG 文件。

## 版本与命名
- 展示名称：数字物宇-多联机中央空调集控+计费系统
- 包名：当前 `package.json` 的 `name` 为 `admin-fcc`（私有项目，为避免构建工具异常暂不改动）。如需同步更改包名，请说明目标命名与发布策略，我们将配合调整。

## 相关链接
- 极派科技官网：https://geekpartytech.com/
- 数字物宇-物联中台：https://iot.geekpartytech.com/
