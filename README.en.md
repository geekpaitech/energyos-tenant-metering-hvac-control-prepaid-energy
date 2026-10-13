<p align="center">
  <a href="https://geekpartytech.com/"><img src="src/assets/images/wyy-logo.png" alt="Digital IoT · GeekParty Technology logo" width="144" height="144"></a>
</p>

<h1 align="center">Digital IoT · 数字物宇</h1>
<h3 align="center">Smart metering, prepaid billing and energy management</h3>

<p align="center">For property managers and tenants in office buildings, commercial properties, industrial parks and rental housing</p>
<p align="center"><strong>Remote readings · Utility billing · Central HVAC · Submetering · Energy analytics</strong></p>

<p align="center">
  <a href="#repository-scope"><img src="src/assets/readme/brand/vue.svg" alt="Vue 2" height="24"></a>
  <a href="#repository-scope"><img src="src/assets/readme/brand/element.svg" alt="Element UI 2" height="24"></a>
  <a href="#repository-scope"><img src="src/assets/readme/brand/echarts.svg" alt="ECharts 5" height="24"></a>
  <a href="#runtime"><img src="src/assets/readme/brand/node.svg" alt="Node.js 14.21.3" height="24"></a>
  <a href="LICENSE"><img src="src/assets/readme/brand/license.svg" alt="Apache License 2.0" height="24"></a>
</p>

<p align="center">
  <a href="https://iot.geekpartytech.com/"><strong>Live demo</strong></a> ·
  <a href="https://vrf.geekpartytech.com/"><strong>Product website</strong></a> ·
  <a href="#quick-start"><strong>Quick start</strong></a> ·
  <a href="docs/CONFIGURATION.md"><strong>Configuration guide</strong></a> ·
  <a href="README.md">简体中文</a>
</p>

<p align="center">
  Connect electricity meters, water meters and central HVAC for device management, metering and tenant billing.<br>
  A Web portal and the Ji Wu Yu (极物宇) WeChat mini program support property operations and tenant self-service.
</p>

<p align="center"><sub>This repository provides the Web frontend source code. Full business functionality requires compatible APIs, account permissions and associated services.</sub></p>

[![Group asset and energy operations dashboard](src/assets/readme/集团大屏.png)](src/assets/readme/集团大屏.png)

*Group view: project assets, energy fee collection, consumption and device operations.*

---

**Navigation:** [Capabilities](#capabilities) · [Web interface](#web-interface) · [Ji Wu Yu mini program](#ji-wu-yu-mini-program) · [Repository scope](#repository-scope) · [Quick start](#quick-start) · [Demo and contact](#demo-and-contact)

## Capabilities

| Business area | Functionality |
| :--- | :--- |
| **Smart metering** | Electricity and water meters, remote readings, device status, tenant associations and consumption records |
| **Prepaid billing** | Account balances, tariffs, cost allocation, tenant bills, top-ups, refunds and transaction records |
| **Central HVAC** | Individual and group control, scheduling, indoor/outdoor unit topology and HVAC consumption |
| **Energy analytics** | Water and electricity reports, consumption details, Sankey diagrams, power data and project dashboards |
| **AI assistance** | Electricity bill analysis, file parsing, business questions and analytical suggestions |
| **Related systems** | Lighting, environmental sensing, power distribution and parking/charging-related modules |

> Business workflow: meter readings → metering and allocation → bill settlement → top-ups and payments → operations analysis

| Property type | Typical use |
| :--- | :--- |
| Office buildings and commercial properties | Multi-tenant utility and HVAC billing |
| Industrial parks and property portfolios | Project-level and group-level energy and operations reporting |
| Rental properties | Prepaid accounts, balance enquiries and tenant self-service |
| Property and engineering teams | Device status checks, centralized control and mobile management |

## Web interface

### Operations dashboard

Review tenant consumption, receivables, collections, overdue balances and device status alongside energy flows and submetering.

[![Operations dashboard: tenant consumption, billing and equipment](src/assets/readme/web/operations-dashboard.png)](src/assets/readme/web/operations-dashboard.png)

### Smart metering and remote readings

[![Electricity meter cards: status, tenant associations and tariffs](src/assets/readme/web/electricity-meter-cards.png)](src/assets/readme/web/electricity-meter-cards.png)

*Review meter status, tenant associations and tariffs in card or list views.*

<details>
<summary>Water meters, device details and billing configuration</summary>

#### Water meter management

[![Water meter cards: associations, payment modes and valve status](src/assets/readme/web/water-meter-cards.png)](src/assets/readme/web/water-meter-cards.png)

Review device associations, payment modes and valve status for dedicated and shared water meters.

#### Electricity meter details and readings

[![Electricity meter management and consumption data](src/assets/readme/电表管理.png)](src/assets/readme/电表管理.png)

Review tenant associations, meter information, power curves and consumption history.

#### Batch meter associations

[![Batch meter associations](src/assets/readme/批量绑定电表.png)](src/assets/readme/批量绑定电表.png)

Manage associations between meters and tenants.

#### Shared-meter groups

[![Shared-meter groups](src/assets/readme/电表公摊组管理.png)](src/assets/readme/电表公摊组管理.png)

Organize devices used for shared-cost allocation.

#### Electricity tariffs

[![Electricity tariffs](src/assets/readme/电费方案管理.png)](src/assets/readme/电费方案管理.png)

Manage billing schemes and rate configurations.

</details>

### Prepaid accounts and tenant billing

[![Tenant bills and payment status](src/assets/readme/租户账单列表.png)](src/assets/readme/租户账单列表.png)

*Review bills by period, charge type and payment status.*

<details>
<summary>Tenant records and bill details</summary>

#### Tenant records and devices

[![Tenant records and devices](src/assets/readme/租户详情与设备.png)](src/assets/readme/租户详情与设备.png)

Review tenant information, devices and business records.

#### Tenant billing details

[![Tenant billing details](src/assets/readme/租户账单明细.png)](src/assets/readme/租户账单明细.png)

Review account balances, utility charges and individual bills.

#### Individual bill details

[![Individual bill details](src/assets/readme/账单详情弹窗.png)](src/assets/readme/账单详情弹窗.png)

Inspect charge components and settlement information.

</details>

### Central HVAC management

[![Central air-conditioning control and scheduling](src/assets/readme/空调集控.png)](src/assets/readme/空调集控.png)

*Manage air-conditioning devices from individual units to groups and system topology.*

<details>
<summary>Device control, groups and topology</summary>

#### Individual unit control

[![Individual unit control](src/assets/readme/单台空调控制.png)](src/assets/readme/单台空调控制.png)

Review operating state and available control parameters.

#### Remote control

[![Remote control](src/assets/readme/空调远程控制.png)](src/assets/readme/空调远程控制.png)

Access device management and remote-control workflows.

#### Group control

[![Group control](src/assets/readme/空调群组控制.png)](src/assets/readme/空调群组控制.png)

Organize devices into groups for management.

#### Indoor and outdoor unit topology

[![Indoor and outdoor unit topology](src/assets/readme/空调内外机拓扑.png)](src/assets/readme/空调内外机拓扑.png)

Inspect connections and device states.

#### Outdoor unit systems

[![Outdoor unit systems](src/assets/readme/空调外机系统.png)](src/assets/readme/空调外机系统.png)

Review system-level operating information.

#### Device relationships

[![Device relationships](src/assets/readme/空调设备关系图.png)](src/assets/readme/空调设备关系图.png)

Inspect the device hierarchy and associated equipment.

</details>

### Submetering and energy analytics

[![Tenant electricity report: consumption, cost trends and time-of-use data](src/assets/readme/web/tenant-electricity-report.png)](src/assets/readme/web/tenant-electricity-report.png)

*Review electricity consumption, cost trends and time-of-use breakdowns by reporting period and tenant.*

<details>
<summary>Project energy overview, consumption records and metering topology</summary>

#### Project energy overview

[![Project energy management dashboard](src/assets/readme/项目能源大屏.png)](src/assets/readme/项目能源大屏.png)

Review supply, load, billing and photovoltaic-related information for a project.

#### Electricity reporting

[![Electricity reporting](src/assets/readme/用电报表.png)](src/assets/readme/用电报表.png)

Review consumption and cost trends.

#### Consumption details

[![Consumption details](src/assets/readme/用能数据明细表.png)](src/assets/readme/用能数据明细表.png)

Inspect records used for reporting and billing analysis.

#### Tenant energy reports

[![Tenant energy reports](src/assets/readme/租户用能报表.png)](src/assets/readme/租户用能报表.png)

Review tenant consumption and cost summaries.

#### Tenant electricity Sankey diagram

[![Tenant electricity Sankey diagram](src/assets/readme/租户用电桑基图.png)](src/assets/readme/租户用电桑基图.png)

View energy distribution between tenants and metered sections.

#### HVAC consumption

[![HVAC consumption](src/assets/readme/空调用能.png)](src/assets/readme/空调用能.png)

Review air-conditioning consumption and operating data.

#### Tenant operations dashboard

[![Tenant operations dashboard](src/assets/readme/租户看板.png)](src/assets/readme/租户看板.png)

Review tenant, account, consumption and billing indicators.

#### Power distribution topology

[![Power distribution topology](src/assets/readme/配电系统拓扑图.png)](src/assets/readme/配电系统拓扑图.png)

Inspect the power distribution hierarchy and equipment.

</details>

### AI-assisted analysis

[![AI-assisted electricity bill analysis](src/assets/readme/电费核查.png)](src/assets/readme/电费核查.png)

*File parsing and analysis depend on the configured AI service.*

<details>
<summary>AI assistant</summary>

#### AI assistant

[![AI assistant](src/assets/readme/AI助手.png)](src/assets/readme/AI助手.png)

Ask business questions and review analytical responses.

</details>

### Lighting and environmental sensing

[![Lighting management](src/assets/readme/智能照明.png)](src/assets/readme/智能照明.png)

*Inspect lighting equipment and operating status in a visual interface.*

<details>
<summary>Environmental sensing</summary>

#### Environmental sensing

[![Environmental sensing](src/assets/readme/环境感知.png)](src/assets/readme/环境感知.png)

Review environmental information and associated devices.

</details>

## Ji Wu Yu mini program

The **Ji Wu Yu (极物宇)** WeChat mini program provides separate tenant and management views. Tenants review accounts, bills and consumption. Property managers review tenant statistics and manage meters and air-conditioning devices.

### Tenant portal

<table width="100%">
  <tr>
    <th align="center" width="33%">Account overview</th>
    <th align="center" width="33%">Bills and charges</th>
    <th align="center" width="33%">Account transactions</th>
  </tr>
  <tr>
    <td align="center" valign="top"><a href="src/assets/readme/miniapp/tenant-home.jpg"><img src="src/assets/readme/miniapp/tenant-home.jpg" alt="Account overview" width="220"></a></td>
    <td align="center" valign="top"><a href="src/assets/readme/miniapp/tenant-bills.jpg"><img src="src/assets/readme/miniapp/tenant-bills.jpg" alt="Bills and charges" width="220"></a></td>
    <td align="center" valign="top"><a href="src/assets/readme/miniapp/tenant-account.jpg"><img src="src/assets/readme/miniapp/tenant-account.jpg" alt="Account transactions" width="220"></a></td>
  </tr>
  <tr>
    <td align="center" valign="top">View balances, usage and associated devices.</td>
    <td align="center" valign="top">View water and electricity charges by period.</td>
    <td align="center" valign="top">View balance movements and account details.</td>
  </tr>
</table>

### Management portal

<table width="100%">
  <tr>
    <th align="center" width="33%">Management overview</th>
    <th align="center" width="33%">Water and electricity meters</th>
    <th align="center" width="33%">Air conditioning</th>
  </tr>
  <tr>
    <td align="center" valign="top"><a href="src/assets/readme/miniapp/manager-home.jpg"><img src="src/assets/readme/miniapp/manager-home.jpg" alt="Management overview" width="220"></a></td>
    <td align="center" valign="top"><a href="src/assets/readme/miniapp/manager-meters.jpg"><img src="src/assets/readme/miniapp/manager-meters.jpg" alt="Water and electricity meters" width="220"></a></td>
    <td align="center" valign="top"><a href="src/assets/readme/miniapp/manager-air-conditioning.jpg"><img src="src/assets/readme/miniapp/manager-air-conditioning.jpg" alt="Air conditioning" width="220"></a></td>
  </tr>
  <tr>
    <td align="center" valign="top">Access tenant statistics and daily management.</td>
    <td align="center" valign="top">View device status and management actions.</td>
    <td align="center" valign="top">View air-conditioning status and filters.</td>
  </tr>
</table>

[Open the mini program and contact section](#demo-and-contact)

## Repository scope

| Component | Included in this repository | Dependencies |
| :--- | :--- | :--- |
| **Web frontend** | Vue pages, routing, state, API calls, visualizations and configuration | Compatible APIs and account permissions |
| **Ji Wu Yu mini program** | Screenshots and an experience QR code in this README | The separately provided mini program |
| **Backend and device connectivity** | Frontend API calls and service address settings | Backend business services and connected devices |
| **AI and external systems** | Calls, embedded pages and navigation entries | Their services, authentication and access permissions |

This repository contains the Web frontend, not the mini program or backend source code. Some dashboards use demonstration snapshots, and existing Mock data sources remain in place. Running the frontend does not make every business workflow available offline.

| Area | Technologies |
| :--- | :--- |
| UI | Vue 2, Element UI |
| Routing and state | Vue Router, Vuex |
| Visualization | ECharts, Konva |
| Requests and build | Axios, Vue CLI 4 |
| Data utilities | Mock.js, Moment, xlsx |
| Unit tests | Mocha, Vue Test Utils, Chai |

Key locations: `src/api/` for APIs, `src/views/` for business pages, `src/components/` for shared components, `src/config/` and `src/utils/` for configuration and utilities, and `vue.config.js` for service addresses and build settings.

## Quick start

### Runtime

Use **Node.js 14.21.3 and npm 6.14.18** as the validation baseline. Keep the existing Vue 2 / Vue CLI 4 dependency versions and committed `package-lock.json`. Nearby Node.js 14.x versions require their own verification.

```bash
git clone https://gitee.com/geekpartytech/wyy-admin.git
cd wyy-admin
npm ci
npm run serve
```

The default local address is [http://localhost:8080](http://localhost:8080). Existing working dependencies do not need to be reinstalled for documentation or service address changes.

### Service configuration

The default backend is **`https://iot-test.geekpartytech.com`**. Change the main backend by editing `services.backendRoot` at the top of `vue.config.js`:

```js
backendRoot: 'https://iot-test.geekpartytech.com'
```

Use the backend root without `/api` or an endpoint path. The development `/api` proxy and production requests use this setting.

| Configuration | Purpose |
| :--- | :--- |
| `services.backendRoot` | Main business APIs and related upload URLs |
| Other `services` entries | AI, statistics, EMS, building management, parking and external portals |
| `features` | Existing global and region Mock settings |
| `devServer` | Local port, automatic browser opening and proxy |
| `publicPath` | Static asset deployment path |

Restart the development server after changing configuration. Production deployments require a new build. The `.env` files select build modes rather than maintaining another set of service addresses.

See the [configuration and deployment guide](docs/CONFIGURATION.md) for defaults, configuration fields and troubleshooting. The guide is written in Chinese.

### Build and validation

```bash
npm run build         # Production assets in dist/
npm run check:config  # Offline configuration and URL checks
npm run test:unit     # Unit tests
```

Deploy production assets to a Web server or CDN. Backend CORS must permit the frontend origin and authentication headers when using different origins. The development proxy is not part of the production deployment.

## License and contributions

Licensed under [Apache License 2.0](LICENSE). Report problems through [Issues](https://gitee.com/geekpartytech/wyy-admin/issues), or submit a [Pull Request](https://gitee.com/geekpartytech/wyy-admin/pulls).

Include your runtime, reproduction steps and expected result when reporting a problem. Describe the affected business area and relevant validation when proposing changes.

## Demo and contact

| Entry | Details |
| :--- | :--- |
| Web demo | [Digital IoT management portal](https://iot.geekpartytech.com/) |
| Demo account | `18866668888` |
| Demo password | `Demo@2025` |
| Product website | [HVAC and energy management](https://vrf.geekpartytech.com/) |
| Company website | [GeekParty Technology](https://geekpartytech.com/) |

The online demo differs from the default local development backend. Demo services connect to real business systems: browse only, without issuing device commands or starting transactions.

<table width="100%">
  <tr>
    <th align="center" width="50%">Ji Wu Yu mini program</th>
    <th align="center" width="50%">WeCom contact</th>
  </tr>
  <tr>
    <td align="center" valign="top"><a href="src/assets/readme/contact/miniapp-qrcode.jpg"><img src="src/assets/readme/contact/miniapp-qrcode.jpg" alt="Ji Wu Yu mini program QR code" width="190"></a></td>
    <td align="center" valign="top"><a href="src/assets/readme/contact/enterprise-wechat.png"><img src="src/assets/readme/contact/enterprise-wechat.png" alt="WeCom contact QR code" width="190"></a></td>
  </tr>
  <tr>
    <td align="center" valign="top">Scan with WeChat to open the mini program.<br>Features depend on your account and role.</td>
    <td align="center" valign="top">Product enquiries and project integration.<br>GeekParty Technology</td>
  </tr>
</table>

<p align="center"><sub>Digital IoT · Ji Wu Yu WeChat mini program · GeekParty Technology</sub></p>
