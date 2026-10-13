<p align="center">
  <a href="https://geekpartytech.com/"><img src="src/assets/images/wyy-logo.png" alt="数字物宇 · 极派科技 Logo" width="144" height="144"></a>
</p>

<h1 align="center">数字物宇</h1>
<h3 align="center">智能水电与预付费能源管理平台</h3>

<p align="center">面向写字楼、商业综合体、产业园与公寓</p>
<p align="center"><strong>远程抄表 · 水电计费 · 中央空调集控 · 分项计量 · 能耗分析</strong></p>

<p align="center">
  <a href="#技术与目录"><img src="src/assets/readme/brand/vue.svg" alt="Vue 2" height="24"></a>
  <a href="#技术与目录"><img src="src/assets/readme/brand/element.svg" alt="Element UI 2" height="24"></a>
  <a href="#技术与目录"><img src="src/assets/readme/brand/echarts.svg" alt="ECharts 5" height="24"></a>
  <a href="#运行环境"><img src="src/assets/readme/brand/node.svg" alt="Node.js 14.21.3" height="24"></a>
  <a href="LICENSE"><img src="src/assets/readme/brand/license.svg" alt="Apache License 2.0" height="24"></a>
</p>

<p align="center">
  <a href="https://iot.geekpartytech.com/"><strong>在线体验</strong></a> ·
  <a href="https://vrf.geekpartytech.com/"><strong>产品介绍</strong></a> ·
  <a href="#快速开始"><strong>快速开始</strong></a> ·
  <a href="docs/CONFIGURATION.md"><strong>配置文档</strong></a> ·
  <a href="README.en.md">English</a>
</p>

<p align="center">
  连接智能电表、智能水表与中央空调，覆盖设备管理、用能计量、费用分摊与租户结算。<br>
  Web 管理端与「极物宇」微信小程序，协同物业运营和租户日常用能。
</p>

<p align="center"><sub>本仓库开放 Web 前端源码，完整业务运行依赖配套后台、账号权限及相关服务。</sub></p>

[![数字物宇集团资产运营监控中心](src/assets/readme/集团大屏.png)](src/assets/readme/集团大屏.png)

*集团视角：集中查看项目资产、能源费用收缴、用能概况与设备运行。*

---

**阅读导航：** [产品能力](#产品能力) · [适用场景](#适用场景) · [业务界面](#业务界面) · [极物宇小程序](#极物宇小程序) · [开源范围](#开源范围) · [快速开始](#快速开始) · [体验与联系](#体验与联系)

## 产品能力

| 业务方向 | 主要功能 | 管理重点 |
| :--- | :--- | :--- |
| **智能水电与远程抄表** | 智能电表、智能水表、设备状态、租户绑定、用能记录 | 设备归属清楚，读数与用能可查 |
| **预付费与租户结算** | 专户余额、计费方案、费用分摊、租户账单、充值退款与资金流水 | 从计量到费用，关联租户账户与结算 |
| **中央空调集控与计费** | 单台控制、群组控制、时序调度、内外机拓扑、空调用能 | 按设备、区域和租户管理空调 |
| **分项计量与能耗分析** | 电水报表、用能明细、桑基图、设备功率、项目与集团看板 | 查看用能分布、运行情况和费用构成 |
| **AI 辅助核查与运营** | 电费核查、文件解析、指标问答与分析建议 | 辅助理解账单与用能数据 |
| **场景扩展与联动** | 智能照明、环境感知、配电，以及停车与充电桩相关模块 | 在统一入口查看关联业务 |

> 业务流程：抄表采集 → 计量与分摊 → 账单结算 → 充值缴费 → 运营分析

## 适用场景

| 场景 | 管理需求 | 对应能力 |
| :--- | :--- | :--- |
| **写字楼与商业综合体** | 多租户水电与空调费用管理 | 租户设备关联、分户计量、公摊与账单 |
| **产业园与多项目运营** | 跨项目查看能耗、收缴与设备状态 | 集团看板、项目能源大屏、分项报表 |
| **公寓与租赁物业** | 水电预付费、余额查询与租户自助服务 | 账户管理、充值缴费、极物宇租户端 |
| **物业与工程管理** | 日常设备巡查、状态查看与集中管理 | 水电设备管理、空调集控、移动管理端 |

## 业务界面

### 运营数据看板

汇总租户用能、应收与实收费用、欠费情况及设备状态，结合能源流向与分项计量，为物业日常运营提供项目概览。

[![运营数据看板：租户用能、费用与设备概况](src/assets/readme/web/operations-dashboard.png)](src/assets/readme/web/operations-dashboard.png)

### 智能水电与远程抄表

将设备、租户、计费方案与用能记录关联起来，查看智能电表和智能水表的归属及运行状态。

[![智能电表卡片：设备状态、租户绑定与计费方案](src/assets/readme/web/electricity-meter-cards.png)](src/assets/readme/web/electricity-meter-cards.png)

*电表管理：集中查看设备状态、租户绑定与计费方案，支持卡片与列表视图。*

<details>
<summary>水表管理、设备详情与计费配置</summary>

#### 智能水表管理

[![智能水表卡片：设备归属、付费模式与阀控状态](src/assets/readme/web/water-meter-cards.png)](src/assets/readme/web/water-meter-cards.png)

查看水表归属、付费模式与阀控状态，管理专用及公摊水表。

#### 电表详情与用电记录

[![智能电表管理与用电数据](src/assets/readme/电表管理.png)](src/assets/readme/电表管理.png)

查看绑定信息、实时功率、功率曲线与历史用电记录。

#### 电表批量绑定

[![电表批量绑定](src/assets/readme/批量绑定电表.png)](src/assets/readme/批量绑定电表.png)

批量建立电表与租户的关联，管理设备归属。

#### 电表公摊组管理

[![电表公摊组管理](src/assets/readme/电表公摊组管理.png)](src/assets/readme/电表公摊组管理.png)

查看公摊组及关联设备，为费用分摊提供管理入口。

#### 电费方案管理

[![电费方案管理](src/assets/readme/电费方案管理.png)](src/assets/readme/电费方案管理.png)

管理租户适用的电费方案与费率配置。

</details>

### 预付费与租户结算

围绕租户账户组织账单、用能和资金记录，将水电计费与预付费管理放在同一业务流程中。

[![租户账单列表与缴费状态](src/assets/readme/租户账单列表.png)](src/assets/readme/租户账单列表.png)

*租户账单：按账期、费用类型与缴费状态查看结算记录。*

<details>
<summary>租户档案与账单明细</summary>

#### 租户档案与关联设备

[![租户档案与关联设备](src/assets/readme/租户详情与设备.png)](src/assets/readme/租户详情与设备.png)

查看租户信息、关联设备及业务记录。

#### 租户账单明细

[![租户账单明细](src/assets/readme/租户账单明细.png)](src/assets/readme/租户账单明细.png)

查看租户账户、水电费用汇总与逐笔账单。

#### 账单详情

[![账单详情](src/assets/readme/账单详情弹窗.png)](src/assets/readme/账单详情弹窗.png)

查看单笔账单的费用构成与结算信息。

</details>

### 中央空调集控与计费

覆盖单台设备、群组与系统拓扑等管理视角，结合空调用能数据支持日常运行管理与计费业务。

[![中央空调集中控制与调度](src/assets/readme/空调集控.png)](src/assets/readme/空调集控.png)

*空调集控：集中查看设备状态，进入设备控制与调度功能。*

<details>
<summary>单台控制、群组与系统拓扑</summary>

#### 单台空调控制

[![单台空调控制](src/assets/readme/单台空调控制.png)](src/assets/readme/单台空调控制.png)

查看单台空调的运行状态及模式、温度等控制参数。

#### 空调远程控制

[![空调远程控制](src/assets/readme/空调远程控制.png)](src/assets/readme/空调远程控制.png)

在管理端集中查看设备并使用远程控制入口。

#### 空调群组控制

[![空调群组控制](src/assets/readme/空调群组控制.png)](src/assets/readme/空调群组控制.png)

按群组组织设备，管理批量控制场景。

#### 空调内外机拓扑

[![空调内外机拓扑](src/assets/readme/空调内外机拓扑.png)](src/assets/readme/空调内外机拓扑.png)

查看内外机连接关系与运行状态。

#### 空调外机系统

[![空调外机系统](src/assets/readme/空调外机系统.png)](src/assets/readme/空调外机系统.png)

从系统视角查看外机与相关运行信息。

#### 空调设备关系图

[![空调设备关系图](src/assets/readme/空调设备关系图.png)](src/assets/readme/空调设备关系图.png)

查看设备层级及关联关系，辅助定位设备。

</details>

### 分项计量与能耗分析

从单项目能源概况延伸到租户、设备和用能明细，结合报表与桑基图查看能源流向及费用分布。

[![租户用电报表：用电量、费用趋势与分时电量](src/assets/readme/web/tenant-electricity-report.png)](src/assets/readme/web/tenant-electricity-report.png)

*用电分析：按统计区间与租户维度查看电量、费用趋势及尖峰平谷构成。*

<details>
<summary>项目能源概览、用能明细与计量拓扑</summary>

#### 项目能源概览

[![项目能源管理与能耗分析大屏](src/assets/readme/项目能源大屏.png)](src/assets/readme/项目能源大屏.png)

查看能源供给、负载、计费与光伏等业务信息。

#### 用电报表

[![用电报表](src/assets/readme/用电报表.png)](src/assets/readme/用电报表.png)

按时间及业务维度查看用电与费用变化。

#### 用能数据明细

[![用能数据明细](src/assets/readme/用能数据明细表.png)](src/assets/readme/用能数据明细表.png)

查看用能明细，为统计与账单核查提供数据依据。

#### 租户用能报表

[![租户用能报表](src/assets/readme/租户用能报表.png)](src/assets/readme/租户用能报表.png)

查看租户用能与费用汇总，比较不同统计维度。

#### 租户用电桑基图

[![租户用电桑基图](src/assets/readme/租户用电桑基图.png)](src/assets/readme/租户用电桑基图.png)

以能源流向展示租户及分项用电的分配关系。

#### 空调用能数据

[![空调用能数据](src/assets/readme/空调用能.png)](src/assets/readme/空调用能.png)

查看空调相关用能与运行数据。

#### 租户运营看板

[![租户运营看板](src/assets/readme/租户看板.png)](src/assets/readme/租户看板.png)

汇总查看租户、用能、账单与账户相关指标。

#### 配电系统拓扑

[![配电系统拓扑](src/assets/readme/配电系统拓扑图.png)](src/assets/readme/配电系统拓扑图.png)

以拓扑视图展示配电层级与关联设备。

</details>

### AI 辅助核查与运营

以电费核查和指标问答为入口，辅助理解费用构成与用能数据。相关能力依赖已配置的 AI 服务。

[![AI 辅助电费核查与分析](src/assets/readme/电费核查.png)](src/assets/readme/电费核查.png)

*电费核查：结合文件与业务数据，查看解析结果及分析内容。*

<details>
<summary>AI 助手</summary>

#### AI 助手

[![AI 助手](src/assets/readme/AI助手.png)](src/assets/readme/AI助手.png)

通过对话入口进行业务指标问答与分析。

</details>

### 场景扩展与联动

在能源管理之外，提供照明和环境感知等关联业务入口。

[![智能照明可视化管理](src/assets/readme/智能照明.png)](src/assets/readme/智能照明.png)

*照明管理：以可视化界面查看照明设备与运行状态。*

<details>
<summary>环境感知</summary>

#### 环境感知

[![环境感知](src/assets/readme/环境感知.png)](src/assets/readme/环境感知.png)

查看温湿度、人体存在等环境信息及相关设备。

</details>

## 极物宇小程序

「极物宇」是数字物宇配套的微信小程序，覆盖 **租户端** 与 **管理端**：租户查看账户、账单和用能，管理方查看租户统计并管理水电、空调设备。

### 租户端 · 账户、账单与用能查询

<table width="100%">
  <tr>
    <th align="center" width="33%">租户首页</th>
    <th align="center" width="33%">租户账单</th>
    <th align="center" width="33%">账户明细</th>
  </tr>
  <tr>
    <td align="center" valign="top"><a href="src/assets/readme/miniapp/tenant-home.jpg"><img src="src/assets/readme/miniapp/tenant-home.jpg" alt="租户首页" width="220"></a></td>
    <td align="center" valign="top"><a href="src/assets/readme/miniapp/tenant-bills.jpg"><img src="src/assets/readme/miniapp/tenant-bills.jpg" alt="租户账单" width="220"></a></td>
    <td align="center" valign="top"><a href="src/assets/readme/miniapp/tenant-account.jpg"><img src="src/assets/readme/miniapp/tenant-account.jpg" alt="账户明细" width="220"></a></td>
  </tr>
  <tr>
    <td align="center" valign="top">查看账户余额、用能概览与关联设备</td>
    <td align="center" valign="top">按账期查看水电费用与账单明细</td>
    <td align="center" valign="top">查看账户余额变化与收支记录</td>
  </tr>
</table>

### 管理端 · 租户运营与设备管理

<table width="100%">
  <tr>
    <th align="center" width="33%">管理首页</th>
    <th align="center" width="33%">水电设备管理</th>
    <th align="center" width="33%">空调设备管理</th>
  </tr>
  <tr>
    <td align="center" valign="top"><a href="src/assets/readme/miniapp/manager-home.jpg"><img src="src/assets/readme/miniapp/manager-home.jpg" alt="管理首页" width="220"></a></td>
    <td align="center" valign="top"><a href="src/assets/readme/miniapp/manager-meters.jpg"><img src="src/assets/readme/miniapp/manager-meters.jpg" alt="水电设备管理" width="220"></a></td>
    <td align="center" valign="top"><a href="src/assets/readme/miniapp/manager-air-conditioning.jpg"><img src="src/assets/readme/miniapp/manager-air-conditioning.jpg" alt="空调设备管理" width="220"></a></td>
  </tr>
  <tr>
    <td align="center" valign="top">查看租户统计，进入日常管理功能</td>
    <td align="center" valign="top">查看水电设备状态与管理入口</td>
    <td align="center" valign="top">查看空调运行状态，按条件筛选设备</td>
  </tr>
</table>

[前往小程序体验与联系入口](#体验与联系)

## 开源范围

本仓库以 Web 管理端为开源内容。小程序、后台与设备接入服务是完整产品体系的配套组成部分，不包含在本仓库源码中。

| 组成 | 本仓库提供的内容 | 运行依赖 |
| :--- | :--- | :--- |
| **Web 管理端** | Vue 页面、路由与状态管理、接口调用、可视化及配置 | Node.js 环境、兼容后台与账号权限 |
| **极物宇小程序** | 本文提供租户端、管理端截图与体验入口 | 配套微信小程序服务 |
| **后台与设备接入** | 前端接口调用及相关服务地址配置 | 后台业务服务、设备接入与项目配置 |
| **AI 与外部子系统** | 前端调用、嵌入或跳转入口 | 对应服务及其认证与访问权限 |

部分大屏使用演示快照；前端页面中也保留了现有 Mock 数据来源。启动前端不等于所有业务均可脱离后台离线运行，详情见[配置文档](docs/CONFIGURATION.md)。

### 技术与目录

| 用途 | 技术 |
| :--- | :--- |
| 页面与组件 | Vue 2、Element UI |
| 路由与状态 | Vue Router、Vuex |
| 图表与可视化 | ECharts、Konva |
| 请求与构建 | Axios、Vue CLI 4 |
| 数据与工具 | Mock.js、Moment、xlsx |
| 单元测试 | Mocha、Vue Test Utils、Chai |

| 目录或文件 | 用途 |
| :--- | :--- |
| `src/api/` | 按业务领域划分的接口模块 |
| `src/views/` | 设备、计费、租户、财务、能源与看板等页面 |
| `src/components/` | 公共组件 |
| `src/config/`、`src/utils/` | 服务配置读取、请求封装与业务工具 |
| `src/router/`、`src/store/` | 路由、权限与状态管理 |
| `src/assets/readme/` | 本文截图、小程序与联系素材 |
| `vue.config.js` | 服务地址、开发代理与构建配置 |
| `docs/CONFIGURATION.md` | 完整启动、配置与部署说明 |

## 快速开始

### 运行环境

以 **Node.js 14.21.3 + npm 6.14.18** 为验证基准，保留现有 Vue 2 / Vue CLI 4 与依赖版本。相近 Node.js 14.x 版本需自行验证；使用已提交的 `package-lock.json` 安装依赖。

在项目根目录执行：

```bash
git clone https://gitee.com/geekpartytech/wyy-admin.git
cd wyy-admin
npm ci
npm run serve
```

本地默认访问 [http://localhost:8080](http://localhost:8080)。已有可正常运行的依赖时，修改地址或 README 无需重新安装依赖。

### 后台与服务配置

主业务后台默认使用 **`https://iot-test.geekpartytech.com`**。切换后台只需修改 `vue.config.js` 顶部的 `services.backendRoot`：

```js
backendRoot: 'https://iot-test.geekpartytech.com'
```

填写后台根地址，不附加 `/api` 或具体接口路径。开发环境的 `/api` 代理与生产环境请求会使用同一配置。

| 配置入口 | 用途 |
| :--- | :--- |
| `services.backendRoot` | 主业务接口与相关上传地址 |
| `services` 的其他字段 | AI、统计、EMS、楼控、停车及外部入口 |
| `features` | 全局与区域模块的现有 Mock 开关 |
| `devServer` | 本地端口、浏览器自动打开与代理 |
| `publicPath` | 前端静态资源部署目录 |

修改配置后需重启开发服务；已部署的生产环境需要重新构建。`.env.development` 与 `.env.production` 只保留构建模式，不再维护第二套服务地址。

[查看所有配置项、默认值与常见问题](docs/CONFIGURATION.md)

### 构建与验证

```bash
npm run build         # 生产构建，输出 dist/
npm run check:config  # 离线配置与地址检查，不请求真实后台
npm run test:unit     # 单元测试
```

生产构建产物可部署至 Web 服务器或 CDN。跨域访问需由后台允许前端域名与鉴权请求头；开发代理不会随生产包部署。详细说明见[部署配置](docs/CONFIGURATION.md)。

## 开源与贡献

本项目采用 [Apache License 2.0](LICENSE)。欢迎通过 [Issues](https://gitee.com/geekpartytech/wyy-admin/issues) 反馈问题，或提交 [Pull Request](https://gitee.com/geekpartytech/wyy-admin/pulls)。

反馈问题时，请说明运行环境、复现步骤与预期结果；提交变更时，请说明涉及的业务范围，并补充必要的文档或验证记录。

## 体验与联系

### Web 管理端

| 入口 | 信息 |
| :--- | :--- |
| 在线体验 | [数字物宇管理平台](https://iot.geekpartytech.com/) |
| 演示账号 | `18866668888` |
| 演示密码 | `Demo@2025` |
| 产品介绍 | [中央空调与能源管理产品介绍](https://vrf.geekpartytech.com/) |
| 企业官网 | [极派科技](https://geekpartytech.com/) |

在线体验地址与本地开发默认后台不同。演示环境连接真实业务服务，体验时请仅浏览，不下发设备控制指令或发起交易。

### 小程序与项目交流

<table width="100%">
  <tr>
    <th align="center" width="50%">极物宇微信小程序</th>
    <th align="center" width="50%">企业微信 · 项目咨询</th>
  </tr>
  <tr>
    <td align="center" valign="top"><a href="src/assets/readme/contact/miniapp-qrcode.jpg"><img src="src/assets/readme/contact/miniapp-qrcode.jpg" alt="极物宇微信小程序二维码" width="190"></a></td>
    <td align="center" valign="top"><a href="src/assets/readme/contact/enterprise-wechat.png"><img src="src/assets/readme/contact/enterprise-wechat.png" alt="极派科技企业微信二维码" width="190"></a></td>
  </tr>
  <tr>
    <td align="center" valign="top">微信扫码进入小程序<br>功能范围以账号权限与角色为准</td>
    <td align="center" valign="top">产品咨询、项目对接与部署交流<br>极派科技</td>
  </tr>
</table>

<p align="center"><sub>数字物宇能源管理平台 · 极物宇微信小程序 · 极派科技</sub></p>
