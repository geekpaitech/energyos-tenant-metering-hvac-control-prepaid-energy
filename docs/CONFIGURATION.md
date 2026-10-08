# 配置与启动说明

## 运行环境

本项目以 **Node.js 14.21.3 + npm 6.14.18** 为本次验证基准。使用相近 Node.js 14.x 版本时需自行验证；暂不要求升级 Node.js、Vue 或 Vue CLI。

在 `wyy-admin` 目录执行：

```bash
node --version
npm --version
npm ci
npm run serve
```

默认打开 `http://localhost:8080`。`npm ci` 按 `package-lock.json` 安装依赖，并会重建当前目录的 `node_modules`；已有可正常运行的依赖时，无需为修改地址重新安装。新增或调整依赖时再使用 `npm install`，同时提交 `package.json` 与更新后的锁文件。

## 主后台一处修改

在 `vue.config.js` 顶部修改 `services.backendRoot`：

```js
backendRoot: 'https://iot-test.geekpartytech.com'
```

填写后台根地址，不要附加 `/api` 或具体接口路径；业务模块已有 `/api/...` 路径。根地址末尾的 `/` 会自动去除。

- 开发：浏览器请求当前前端地址下的 `/api/...`，由 `devServer.proxy` 转发到 `backendRoot`，保留 `/api` 路径。
- 生产：浏览器直接请求 `backendRoot + /api/...`。
- 对公充值凭证上传：与普通主业务请求使用相同根地址。
- 不需要同步修改 `src/utils/request.js` 或 `.env.production`。
- 修改后，停止并重新执行 `npm run serve`；已部署的生产包需要重新 `npm run build` 并替换部署文件。

这是一处配置、启动/构建时生效的方案。生产服务器上修改源码不会自动改变已经生成的静态 JS。

## 服务配置项

所有下列配置都在 `vue.config.js` 的 `services` 对象中。

| 配置项 | 默认值 | 用途与填写要求 |
|---|---|---|
| `backendRoot` | `https://iot-test.geekpartytech.com` | 主业务接口根地址，不含 `/api` |
| `aiRoot` | `https://ai.geekpartytech.com` | AI 对话、文件上传、核查与流式响应服务根地址 |
| `gridRoot` | `https://grid.geekpartytech.com` | 光伏、停车车辆统计、消防统计及能源大屏光伏接口根地址 |
| `emsOrigin` | `https://cp-ems.szcloudpulse.com:86` | EMS 平台地址，包含端口，不含 `/prod-api` |
| `emsApiPath` | `/prod-api` | EMS 接口前缀，以 `/` 开头，不带尾斜杠；完整接口根地址由 `emsOrigin + emsApiPath` 组成 |
| `fmcsRoot` | `https://jp.brcon.com.cn` | 楼控及外部子系统根地址 |
| `parkingOauthUrl` | `https://www.ai2park.cn/#/oauth` | 停车系统完整登录入口，保留 `/#/oauth`，不要附加查询参数 |
| `tenantPortalUrl` | `https://geekpartytech.com/wx/ebc/` | 租户二维码完整入口，默认尾斜杠保留，不附加 `?tenantId=` |
| `permissionFormalUrl` | `https://iot.geekpartytech.com/` | 测试环境权限页面提示中的正式系统链接，不参与主接口请求 |
| `requestTimeout` | `10000` | 主 Axios 实例默认超时，单位毫秒；显式传入超时的接口仍保留原行为 |

只切换主业务后台时只改 `backendRoot`，其他服务可以继续使用默认值。只有对应服务也更换部署位置时才改其配置。不同服务的认证方式、请求体和成功状态码保持现有实现，不统一替换为主后台接口。

已有权限页面继续根据主后台地址是否包含 `iot-test` 判断测试环境，并保留测试环境下的写操作限制。切换后台地址时需了解这项原有行为；`permissionFormalUrl` 只控制提示链接。

账号密码、项目 ID、EMS 项目映射、楼层数据、地图、图片资源、业务专属外链和天气服务仍使用原配置。本次集中的是上述服务地址，不改变这些业务内容。README 图片路径与素材地址保持原样。

## 数据来源开关

`vue.config.js` 的 `features` 对象：

| 配置项 | 默认值 | 实际行为 |
|---|---|---|
| `useMock` | `false` | 仅在开发环境为 `true` 时加载 `src/mock`；不代表覆盖所有真实接口 |
| `regionUseMock` | `true` | 保留原区域模块的楼层 Mock；改为 `false` 时按原实现尝试真实接口，部分失败场景仍有原有回退 |

多个大屏有各自的演示快照或业务数据处理方式，这两个开关不等同于“所有页面离线演示”。当前默认值与整理前的数据来源保持一致。

## 开发服务器与部署目录

直接修改 `vue.config.js` 中已有配置：

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `devServer.port` | `8080` | 本地端口；端口占用时 Vue CLI 可能选择下一个可用端口，以终端输出为准 |
| `devServer.open` | `true` | 启动后自动打开浏览器，可改为 `false` |
| `devServer.https` | `false` | 本地开发协议；不控制后台地址协议或生产服务器 HTTPS |
| `devServer.proxy['/api'].target` | 自动使用 `services.backendRoot` | 无需单独修改 |
| `devServer.proxy['/api'].secure` | `true` | 开发代理验证后台 HTTPS 证书 |
| `devServer.proxy['/api'].changeOrigin` | `true` | 转发时使用目标后台 Host |
| `devServer.proxy['/api'].logLevel` | `debug` | 保留现有代理日志设置 |
| `publicPath` | `/` | 静态资源部署目录；例如子目录部署可设为 `/iot/` |

开发端口也可临时指定：

```bash
npm run serve -- --port 8081
```

Vue CLI 命令行参数以及终端中的 `PORT`/`HOST` 等仍可能覆盖部分开发服务器设置，请以启动输出为准。

当前路由采用 hash 模式。子目录部署需要检查现有绝对回跳链接与外部系统回调，单独修改 `publicPath` 不代表所有外部回跳都自动适配。楼层 SVG 的自定义 loader 和 PWA 图标配置保持原样。

## 配置如何传递到前端

`vue.config.js` 在 Vue CLI 加载时生成 `VUE_APP_SERVICE_CONFIG`，并生成 Mock 开关与兼容用的 `VUE_APP_BASE_API`。Vue CLI 将这些公开值注入构建；`src/config/services.js` 负责提供业务模块所需的常量。

`.env.development` / `.env.production` 仅保留 `NODE_ENV`。旧的 `/dev-api`、生产占位地址及未接入的 `OPEN`、`VUE_APP_HTTPS` 配置已移除。服务地址与两个 Mock 开关以 `vue.config.js` 为准，不再通过 `.env.local` 重复维护。

这些配置属于前端公开配置，不能用于存放私有密钥。本次不调整既有固定账号、自动登录和认证方式。

## 构建与离线验证

```bash
npm run check:config
npm run test:unit
npm run build
```

`check:config` 分别加载开发、生产与测试的真实 Vue CLI 配置，检查开发代理与生产后台的一致性、上传基地址、EMS 地址组合、AI 与停车 URL、Mock 开关，以及请求隔离仅在测试环境生效；使用虚构参数，不登录、不请求后台、不执行设备或财务操作。

`test:unit` 执行仓库本地单元测试。测试环境清除业务应用入口，由测试工具添加测试入口，并将主请求模块替换为 `tests/helpers/offline-request.js`：意外调用真实请求会直接报错，涉及请求行为的测试应提供显式 mock。这样引用 API 常量的数据工具不会连带加载 store、路由和浏览器专用依赖；全仓规范检查仍由 `npm run lint` 单独执行。这项隔离只在 `NODE_ENV=test` 生效，不改变开发启动或生产构建。现有测试以大屏数据、布局和查询参数为主，不能替代真实后台的业务验收。

生产默认产物位于 `dist/`。直接执行 `npm run build` 会重新生成该目录；需要保留旧产物时可以指定其他输出目录：

```bash
npm run build -- --dest artifacts/build-check
```

`npm run lint` 是原有的规范检查与修复命令，可能修改文件；单纯切换服务地址不需要运行全仓修复。

## 生产部署与常见排查

- 将构建产物部署到静态 Web 服务器；生产包不会启动开发代理。主后台和独立服务需可访问。
- 前后端跨域时，后台需允许实际前端域名，以及现有 `Authorization`、`X-Token`、`userDeviceType`、`Content-Type` 等请求头。保留原有鉴权头与接口协议。
- 浏览器使用 HTTPS 访问前端时，对应接口也应通过浏览器允许的 HTTPS 地址访问。
- EMS、停车与楼控嵌入页面依赖其自身的登录、跨域和 iframe 嵌入策略；只修改主后台地址不会改变这些独立平台。
- 修改配置没有生效：先确认已重启开发服务或已重新构建部署，再检查浏览器缓存与实际请求 URL。
- 普通接口成功但某个外部模块失败：按配置表检查该模块的独立服务、账号权限与嵌入策略。
- 上传失败：确认请求 URL 使用当前后台，以及后台上传接口、权限和文件规则；本说明不要求进行真实上传验证。
- 配置检查与本地编译可以离线验证地址和构建链路。空调下发、电表控制、充值、退款、开票等真实操作不属于配置验证步骤。

## 本次验证记录（2026-10-08）

环境：Node.js `14.21.3`、npm `6.14.18`，使用本机现有依赖，未更换 Node/npm 或升级依赖。本次未重新执行全新依赖安装。

| 检查 | 结果 |
|---|---|
| `npm run check:config` | 开发、生产、测试三种配置通过；确认测试请求隔离未进入开发/生产配置 |
| `npm run test:unit` | 43 项通过；同步修正旧测试中已移除的今日查询函数引用，改为当前 `period: '今日'` 入口 |
| `npm run build -- --dest artifacts/config-refactor-build` | 生产构建通过，输出到独立目录，原 `dist/` 保留 |
| 开发启动 | 独立端口 `18080` 编译成功，禁止自动打开浏览器；首页 HTML 和 `js/app.js` 静态响应均为 HTTP 200，验证后关闭临时服务 |
| 内容核对 | README 的 28 处图片引用、依赖声明与既有固定登录凭据保持原样 |

编译仍有 Sass 弃用、Browserslist 数据和产物体积提示，本次保留现有工具链。未登录后台、未执行真实上传、设备指令或财务操作；以上结果验证配置和编译链路，不代表执行了真实业务验收。
