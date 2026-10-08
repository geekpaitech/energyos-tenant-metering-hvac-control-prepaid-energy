# 集团能源地图大屏

独立页面目录：`src/views/group/energy-map-screen`。
集团入口：`/#/group/energy-map-screen`，路由隐藏，不增加菜单按钮。
项目入口：`/#/group/energy-map-screen?project=<管理方ID>`。
地图、排行、项目卡及项目目录均用原生链接在新标签页打开，集团页面保留。
原南都入口 `/#/group/nandu-energy-screen` 保留。

## 项目范围

沿用 `src/views/energy-screen/config.js` 的 `ENERGY_SCREEN_MANAGER_IDS` 和业态映射。

| 管理方ID | 项目 | 业态 | 场景 |
| --- | --- | --- | --- |
| 1000107 | 南都广场 | 商办 | 已有南都场景 |
| 1000171 | 吴淞江新邻荟 | 商办 | 根据提供实拍美化 |
| 1000175 | 苏旺商务中心广场 | 商办 | 根据提供实拍美化 |
| 1000178 | 经开-机器人产业园 | 产业园 | 实景待补充，展示项目数据页 |
| 1000183 | 塔韵商务广场 | 商办 | 根据提供实拍美化 |
| 1000198 | OPC人工智能产业园 | 产业园 | 实景待补充，展示项目数据页 |

## 数据与交互

目前全部使用 `data.js` 中的确定性模拟快照，不请求真实能耗接口。
集团和业态筛选结果均由子项目快照汇总，设备在线率、费用实收率由汇总分子/分母重新计算。
项目用电 = 租户用电 + 公区用电 = 市电购入 + 光伏自用；光伏上网量单独统计。
今日数据和月数据不混用，近7日图只含完整日。留存金额为账户余额，不计入本月收入。
只有南都配置光伏；未接入的项目显示未接入，不伪造发电量。
设备明细支持类型、状态筛选和分页；详情支持 Esc 关闭、Tab 焦点约束和关闭后焦点恢复。
浏览器隐藏/用户偏好减少动效时暂停图表动效。

接真实接口时保留快照字段结构，替换快照装配来源；项目场景与点位配置在 `assets.js` / `data.js`。

## 地图与素材

`group-map-terrain.png` 是基于用户提供轮廓重绘的立体效果示意场景，原始像素 1672×941。
它不是测绘地图，不包含可用于定位的经纬度；周边道路纹理为视觉化表达，点位为示意锚点。
当前不声称行政边界、道路和各项目位置已完成 GIS 精度核验。真实地图替换应使用授权底图与核对后的坐标。

地图图片只承担场景。所有名称、指标、图表、标记、连接线和按钮由前端渲染，避免把文字烘焙进图片。
地图画布始终按素材比例缩放；图片和交互标记共用坐标系。项目详情卡独立放在地图区域内，不超出侧栏边界。
`group-header.png` 为低亮度城市剪影背景，不包含品牌或业务文字。
两项新素材均通过内置图片生成工具创建，源文件保留在本地 generated_images 目录。

## 显示规格

桌面以 1920×1080 为设计基准，按窗口等比缩放 UI，并将剩余宽高分配给网格，避免黑边和横向挤压。
中心地图锁定宽高比，不随网格非等比拉伸。窄长窗口使用纵向滚动、双列指标/项目卡。
集团画面采用深蓝底、冰蓝数值与少量薄荷绿状态色；告警使用橙色。
本轮只完成集团页视觉收尾，子项目背景构图仍为独立后续优化范围。

## 验证

- `node node_modules/@vue/cli-service/bin/vue-cli-service.js test:unit --skip-plugins @vue/cli-plugin-eslint tests/unit/groupEnergyMap.spec.js tests/unit/nanduEnergyScreen.spec.js`
- `node node_modules/eslint/bin/eslint.js src/views/group/energy-map-screen/*.js src/views/group/energy-map-screen/*.vue tests/unit/groupEnergyMap.spec.js`
- `npm run build`

单测命令跳过 Vue CLI 的全量 ESLint 插件，避免被共享旧配置文件现存 lint 问题阻断；本目录另做独立 lint 检查。
视觉及交互检查记录见仓库根目录 `design-qa.md`。临时浏览器证据放在忽略目录 `artifacts/`。
