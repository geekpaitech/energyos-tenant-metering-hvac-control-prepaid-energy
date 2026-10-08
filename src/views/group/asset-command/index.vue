<template>
  <main class="asset-command" :class="{ 'command-compact': compact }" aria-label="集团资产运营监控中心">
    <div class="command-stage" :style="stageStyle">
      <header class="command-header">
        <a class="command-brand" href="#/group/energy-map-screen" aria-label="集团经营总览"><img :src="logo" alt="极派科技 Logo"><span><b>极派科技</b><em>数字物宇</em><small>GROUP ASSET INTELLIGENCE</small></span></a>
        <div class="command-title"><h1>集团资产运营监控中心</h1><p>GROUP ASSET OPERATIONS CENTER</p></div>
        <div class="command-system"><span class="command-demo">演示数据</span><div><strong>{{ clock }}</strong><small>{{ today }}</small></div><button :aria-label="fullscreen ? '退出全屏' : '全屏展示'" @click="toggleFullscreen"><i class="el-icon-full-screen" /></button></div>
      </header>
      <div class="command-toolbar">
        <nav role="tablist" aria-label="业务维度"><button v-for="(item, index) in tabs" :id="'command-tab-' + item.id" :key="item.id" role="tab" :aria-selected="tab === item.id" aria-controls="command-main-panel" :tabindex="tab === item.id ? 0 : -1" :class="{ active: tab === item.id }" @click="setTab(item.id)" @keydown.right.prevent="moveTab(index, 1)" @keydown.left.prevent="moveTab(index, -1)"><i :class="item.icon" />{{ item.name }}</button></nav>
        <div class="command-controls"><div class="command-select-field"><label for="command-period">统计周期</label><el-select id="command-period" v-model="period" aria-label="统计周期" popper-class="command-select-dropdown" @visible-change="selectOpen = $event"><el-option v-for="p in periods" :key="p.id" :value="p.id" :label="p.label" /></el-select></div><div class="command-select-field command-project-select"><label for="command-project" class="command-sr-only">选择项目</label><i class="el-icon-office-building" /><el-select id="command-project" v-model="projectId" aria-label="选择项目" popper-class="command-select-dropdown" @change="business = 'all'" @visible-change="selectOpen = $event"><el-option value="all" label="集团全部项目" /><el-option v-for="p in projects" :key="p.id" :value="p.id" :label="p.shortName" /></el-select></div><button class="command-present" :aria-pressed="presenting" :title="presenting ? '点击停止；查看详情或展开筛选时暂停计时' : '每 12 秒自动切换一个业务页面'" @click="togglePresent"><i :class="presenting ? 'el-icon-video-pause' : 'el-icon-video-play'" />{{ presenting ? ((dialog || selectOpen) ? '轮播已暂停' : '轮播中 · ' + countdown + 's') : '汇报模式' }}<span v-if="presenting" class="command-present-progress" :style="{ width: (12 - countdown) / 12 * 100 + '%' }" /></button></div>
      </div>
      <section :key="tab" class="command-kpis" aria-label="当前业务核心指标">
        <article v-for="(kpi, index) in kpis" :key="index" class="command-panel command-kpi" :class="kpi.tone"><span><i :class="activeTab.icon" />{{ kpi.label }}</span><div><strong>{{ kpi.value }}</strong><small>{{ kpi.unit }}</small></div><p>{{ kpi.note }}</p></article>
      </section>
      <div class="command-main">
        <aside class="command-left">
          <section class="command-panel command-collection" :class="{ 'is-focused': tab === 'energy' }">
            <header class="command-panel-head"><h2>能耗费用收缴</h2><button @click="showEnergy('fees')">查看分析 <i class="el-icon-top-right" /></button></header>
            <div class="command-collection-main"><ring-chart :segments="collectionSegments" :value="n(m.collection, 1) + '%'" caption="费用实收率" label="能耗费用实收率" paused /><div><span>本期应收 <small>万元</small></span><strong>{{ money(m.fees) }}</strong><span>本期实收 <small>万元</small></span><strong class="mint">{{ money(m.received) }}</strong></div></div>
            <footer class="command-panel-foot"><div><span>预充值留存</span><b>{{ money(m.balance) }} <small>万元</small></b></div><div><span>欠费租户</span><b>{{ m.arrears }} <small>户</small></b></div><button aria-label="查看项目费用明细" @click="openDialog('fees', $event)"><i class="el-icon-right" /></button></footer>
          </section>
          <section class="command-panel command-energy" :class="{ 'is-focused': tab === 'energy' }">
            <header class="command-panel-head"><h2>能源供给与负载</h2><button @click="showEnergy('supply')">供需分析 <i class="el-icon-top-right" /></button></header>
            <div class="command-pair"><div><span>当前总负荷</span><strong>{{ n(m.load, 2) }}<small>MW</small></strong></div><div><span>光伏出力</span><strong class="mint">{{ n(m.pvPower * 1000, 1) }}<small>kW</small></strong></div></div>
            <div class="command-flow"><div><span>电网购电</span><b>{{ n(m.grid / 10000, 2) }}<small>万 kWh</small></b></div><i class="el-icon-right" /><div><span>项目用电</span><b>{{ n(m.kwh / 10000, 2) }}<small>万 kWh</small></b></div><div class="mint"><span>光伏自用</span><b>{{ n(m.self) }}<small>kWh</small></b></div><i class="el-icon-top-right mint" /><div><span>余电上网</span><b>{{ n(m.exported) }}<small>kWh</small></b></div></div>
            <footer class="command-inline-foot"><span>光伏自用率 <b>{{ n(m.selfRate, 1) }}%</b></span><span>运行负载率 <b>{{ n(pct(m.load, m.capacity), 1) }}%</b></span></footer>
          </section>
        </aside>
        <section id="command-main-panel" class="command-panel command-portfolio" role="tabpanel" :aria-labelledby="'command-tab-' + tab">
          <header class="command-portfolio-head"><div><span class="command-eyebrow">CONNECTED PORTFOLIO</span><h2>{{ activeTab.title }}</h2></div><div class="command-types" aria-label="按业态筛选"><button v-for="option in types" :key="option.id" :class="{ active: business === option.id && projectId === 'all' }" :aria-pressed="business === option.id && projectId === 'all'" @click="setType(option.id)">{{ option.name }} <b>{{ option.count }}</b></button></div></header>
          <div class="command-center-content">
            <div v-show="tab === 'overview'" :class="{ 'scene-ready': sceneReady }" class="command-scene" @mouseleave="hoverId = null" @keydown.esc="hoverId = null">
              <div class="command-scene-canvas"><img @load="sceneReady = true" class="command-city" :src="city" alt="六组楼宇组成的集团资产集群示意场景" draggable="false"><a v-for="p in visibleProjects" :key="p.id" class="command-pin" :class="{ selected: hoverId === p.id }" :style="{ left: p.anchor[0] + '%', top: p.anchor[1] + '%' }" :href="projectHref(p)" target="_blank" rel="noopener" @mouseenter="hoverId = p.id" @focus="hoverId = p.id" @blur="hoverId = null"><i /><span>{{ p.shortName }}<small>{{ p.businessName }} · 在线 {{ p.snapshot.devices.onlinePercent }}%</small></span><i class="el-icon-top-right" /></a></div>
              <div class="command-scene-info"><span>纳入集团管理</span><strong>{{ visibleProjects.length }}<small>个项目</small></strong><span>吴中经开 · 多业态协同</span></div>
              <div v-if="hoverProject" class="command-hover-card" @mouseenter="hoverId = hoverProject.id"><img v-if="hoverProject.scene" :src="scenes[hoverProject.scene]" :alt="hoverProject.name + '实拍美化场景'"><div v-else class="command-no-scene"><i class="el-icon-office-building" /><span>项目实景待补充</span></div><div><b>{{ hoverProject.name }}</b><span>本月用电 <strong>{{ n(hoverProject.snapshot.energy.total / 10000, 2) }}<small>万 kWh</small></strong></span><a :href="projectHref(hoverProject)" target="_blank" rel="noopener">进入项目子屏 <i class="el-icon-top-right" /></a></div></div>
              <span class="command-scene-legend"><i />{{ visibleProjects.length }} 个项目 · 独立访问</span><span class="command-scene-note">资产集群示意 · 非地理比例</span>
            </div>
            <div v-show="tab !== 'overview'" :key="'report-' + tab" class="command-report">
              <header><div><span>{{ scopeName }} · {{ ['power', 'air', 'light'].includes(tab) || (tab === 'energy' && energyView === 'supply') ? '今日运行快照' : periodLabel }}</span><h3>{{ report.title }} <small>{{ report.unit }}</small></h3></div><div v-if="tab === 'energy'" class="command-subtabs"><button :aria-pressed="energyView === 'supply'" :class="{ active: energyView === 'supply' }" @click="energyView = 'supply'">能源供需</button><button :aria-pressed="energyView === 'fees'" :class="{ active: energyView === 'fees' }" @click="energyView = 'fees'">费用回款</button></div><span v-else class="command-report-badge">{{ visibleProjects.length }} 项目 · 模拟分析</span></header>
              <div class="command-report-body"><command-chart :series="report.series" :labels="report.labels" :unit="report.unit" :label="report.title" /><div class="command-report-ranks"><header><b>项目对标</b><span>{{ report.rankLabel }}</span></header><button v-for="(p, index) in report.ranked" :key="p.id" @click="projectId = p.id"><em>{{ String(index + 1).padStart(2, '0') }}</em><span>{{ p.shortName }}<progress :value="p.value" :max="report.ranked[0].value || 1" /></span><strong>{{ n(p.value, 2) }}<small>{{ report.rankUnit }}</small></strong></button><p v-if="report.ranked.length === 1">当前为单项目视角<button @click="projectId = 'all'; business = 'all'">返回集团对标</button></p></div></div>
              <p class="command-report-note">{{ report.note }}</p>
            </div>
          </div>
          <footer class="command-snapshots"><div><span>项目场景与运行快照</span><small>基于实拍美化</small></div><div class="command-snapshot-list"><a v-for="p in sceneProjects" :key="p.id" :href="projectHref(p)" target="_blank" rel="noopener"><img :src="scenes[p.scene]" :alt="p.name"><span>{{ p.shortName }}<small><i />{{ p.snapshot.devices.onlinePercent }}% 在线</small></span></a><span v-if="!sceneProjects.length" class="command-scene-empty">当前范围实景待补充，可通过项目列表进入能源子屏。</span></div><button aria-label="查看全部项目" @click="openDialog('projects', $event)"><i class="el-icon-right" /></button></footer>
        </section>
        <section class="command-panel command-power" :class="{ 'is-focused': tab === 'power' }">
          <header class="command-panel-head"><h2>配电运维 · 集中值守</h2><button @click="setTab('power')">运行分析 <i class="el-icon-top-right" /></button></header>
          <div class="command-power-summary"><div><strong>{{ m.rooms }}</strong><span>配电房 / 座</span></div><div><strong>{{ m.transformers }}</strong><span>变压器 / 台</span></div><div><strong class="mint">{{ n(m.onlineRate, 1) }}<small>%</small></strong><span>接入设备在线率</span></div></div>
          <button class="command-duty" @click="openDialog('duty', $event)"><i class="el-icon-view" /><span>集团统一值守 <b>24H</b></span><span>查看巡视快照 <i class="el-icon-arrow-right" /></span></button>
          <div class="command-alert-heading"><h3>跨业务风险与处置</h3><button @click="openDialog('risks', $event)">全部 {{ m.risk }} <i class="el-icon-top-right" /></button></div>
          <div class="command-alerts"><button v-for="event in alerts.slice(0, 3)" :key="event.id" @click="openDialog('risk', $event, event)"><span><b>{{ event.title }}</b><small>{{ event.projectName }} · {{ event.time }}</small></span><em>{{ event.status }}</em></button></div>
          <footer class="command-closure"><div><span>工单闭环率</span><strong>{{ n(pct(m.closed, m.closed + m.open), 1) }}<small>%</small></strong></div><p><span>发现</span><i class="el-icon-right" /><span>派单</span><i class="el-icon-right" /><span>处置</span><i class="el-icon-right" /><span>复核</span></p></footer>
        </section>
      </div>
      <section class="command-operations" aria-label="多业务运行概览">
        <article class="command-panel" :class="{ 'is-focused': tab === 'air' }"><header class="command-panel-head"><h2><i class="el-icon-monitor" />空调运行</h2><button @click="setTab('air')">运行分析 <i class="el-icon-top-right" /></button></header><div class="command-operation-value"><div><span>运行内机 / 总量</span><strong>{{ n(m.acRun) }}<small>/ {{ n(m.ac) }} 台</small></strong></div><span class="command-state">策略运行中</span></div><command-chart class="command-mini-chart" :series="airSeries" :labels="miniLabels" label="空调日内运行趋势" unit="台" small /><footer class="command-inline-foot"><span>综合能效 <b>{{ n(m.cop, 2) }}</b></span><span>舒适达标率 <b>{{ n(m.comfort, 1) }}%</b></span></footer></article>
        <article class="command-panel" :class="{ 'is-focused': tab === 'light' }"><header class="command-panel-head"><h2><i class="el-icon-sunny" />照明管理</h2><button @click="setTab('light')">设备分析 <i class="el-icon-top-right" /></button></header><div class="command-operation-value"><div><span>在线照明回路</span><strong>{{ n(m.lights - m.lightFault) }}<small>路</small></strong></div><span class="command-state">按需照明</span></div><div class="command-light-states"><div class="command-stackbar"><i :style="{ flex: m.lightOn }" /><i :style="{ flex: m.lightOff }" /><i :style="{ flex: m.lightFault }" /></div><div class="command-state-legend"><span>点亮 <b>{{ n(m.lightOn) }}</b></span><span>关闭 <b>{{ n(m.lightOff) }}</b></span><span>异常 <b>{{ m.lightFault }}</b></span></div></div><footer class="command-inline-foot"><span>策略覆盖率 <b>{{ n(m.lightCoverage, 1) }}%</b></span><span>本期节电 <b>18.6%</b></span></footer></article>
        <article class="command-panel" :class="{ 'is-focused': tab === 'parking' }"><header class="command-panel-head"><h2><i class="el-icon-truck" />停车运营</h2><button @click="setTab('parking')">运营分析 <i class="el-icon-top-right" /></button></header><div class="command-operation-value"><div><span>本期停车收入</span><strong>{{ money(m.parkingIncome) }}<small>万元</small></strong></div><span class="command-state">无感通行</span></div><div class="command-parking"><span>车位利用率 <b>{{ n(pct(m.parkingUsed, m.spaces), 1) }}%</b></span><progress :value="m.parkingUsed" :max="m.spaces" /></div><footer class="command-inline-foot"><span>总车位 <b>{{ n(m.spaces) }}</b></span><span>当前余位 <b>{{ n(m.spaces - m.parkingUsed) }}</b></span></footer></article>
        <article class="command-panel" :class="{ 'is-focused': tab === 'charge' }"><header class="command-panel-head"><h2><i class="el-icon-connection" />充电桩运营</h2><button @click="setTab('charge')">运营分析 <i class="el-icon-top-right" /></button></header><div class="command-operation-value"><div><span>本期充电收入</span><strong>{{ money(m.chargeIncome) }}<small>万元</small></strong></div><span class="command-state">统一运营</span></div><div class="command-charge-states"><div><span>充电中</span><b class="mint">{{ m.charging }}</b></div><div><span>空闲</span><b>{{ m.chargeIdle }}</b></div><div><span>异常</span><b class="gold">{{ m.chargeFault }}</b></div></div><footer class="command-inline-foot"><span>本期充电量 <b>{{ n(m.chargeKwh / 10000, 2) }} 万 kWh</b></span><span>桩利用率 <b>{{ n(pct(m.charging, m.plugs), 1) }}%</b></span></footer></article>
      </section>
      <footer class="command-footer"><span>DIGITAL TWIN · DIGITAL OPERATION <i />{{ scopeName }} · {{ periodLabel }} · {{ activeTab.name }}</span><span>当前范围汇总 · 全部指标为模拟数据 · 运行快照 2026.09.22 10:30</span></footer>
    </div>
    <div v-if="dialog" class="command-modal" @click.self="closeDialog" @keydown.esc="closeDialog"><section ref="dialog" role="dialog" aria-modal="true" :aria-label="dialogTitle" tabindex="-1" @keydown.tab="trapFocus"><header><div><span class="command-eyebrow">OPERATIONS INSIGHT</span><h2>{{ dialogTitle }}</h2><p>{{ scopeName }} · {{ periodLabel }} · 演示数据</p></div><button ref="close" aria-label="关闭详情" @click="closeDialog"><i class="el-icon-close" /></button></header><div class="command-modal-content"><template v-if="dialog.kind === 'duty'"><img class="command-switchroom" :src="switchroom" alt="配电房巡视示意素材"><p>集中值守 {{ m.rooms }} 座配电房、{{ m.transformers }} 台变压器。此图为演示场景，不是实时监控视频。</p></template><template v-else-if="dialog.kind === 'risk'"><div class="command-risk-detail"><span>{{ dialog.event.projectName }}</span><h3>{{ dialog.event.title }}</h3><p>发现时间 {{ dialog.event.time }} · 当前状态 {{ dialog.event.status }}</p><p>{{ dialog.event.detail }}</p><div>发现 → 派单 → 现场处置 → 复核归档</div></div><p>本页为风险流程演示，不会派发真实工单。</p></template><table v-else-if="dialog.kind === 'risks'"><thead><tr><th>项目</th><th>风险事项</th><th>发现时间</th><th>状态</th></tr></thead><tbody><tr v-for="event in alerts" :key="event.id"><td>{{ event.projectName }}</td><td><button @click="dialog = { kind: 'risk', event }">{{ event.title }}</button></td><td>{{ event.time }}</td><td>{{ event.status }}</td></tr></tbody></table><table v-else><thead><tr><th>项目</th><th>业态</th><th>{{ dialog.kind === 'fees' ? '本期应收 / 元' : '本期用电 / kWh' }}</th><th>{{ dialog.kind === 'fees' ? '本期实收 / 元' : '设备在线率' }}</th><th>{{ dialog.kind === 'fees' ? '待收 / 元' : '项目子屏' }}</th></tr></thead><tbody><tr v-for="p in visibleProjects" :key="p.id"><td>{{ p.name }}</td><td>{{ p.businessName }}</td><td>{{ n(projectMetrics(p)[dialog.kind === 'fees' ? 'fees' : 'kwh']) }}</td><td>{{ dialog.kind === 'fees' ? n(projectMetrics(p).received) : n(projectMetrics(p).onlineRate, 1) + '%' }}</td><td v-if="dialog.kind === 'fees'" class="gold">{{ n(projectMetrics(p).outstanding) }}</td><td v-else><a :href="projectHref(p)" target="_blank" rel="noopener">打开 <i class="el-icon-top-right" /></a></td></tr></tbody></table></div><footer>模拟指标用于展示；预充值留存为账户余额，不计入本期收入。</footer></section></div>
    <div v-if="notice" class="command-toast" role="status">{{ notice }}</div>
  </main>
</template>

<script>
import { Select as ElSelect, Option as ElOption } from 'element-ui'
import logo from '@/assets/images/wyy-logo.png'
import city from './assets/portfolio-studio.png'
import switchroom from './assets/switchroom-interior.png'
import { scenes } from '../energy-map-screen/assets'
import RingChart from '../nandu-energy-screen/components/RingChart.vue'
import CommandChart from './CommandChart.vue'
import { TABS, PERIODS, createPortfolio, aggregatePortfolio, kpisFor, reportFor, num, rate } from './model'
import './screen.scss'

export default {
  name: 'GroupAssetCommand',
  components: { RingChart, CommandChart, ElSelect, ElOption },
  data () { return { logo, city, switchroom, scenes, tabs: TABS, periods: PERIODS, projects: createPortfolio(), tab: 'overview', period: 'month', projectId: 'all', business: 'all', energyView: 'supply', hoverId: null, width: window.innerWidth, height: window.innerHeight, fullscreen: false, presenting: false, countdown: 12, selectOpen: false, sceneReady: false, now: new Date(), dialog: null, notice: '' } },
  computed: {
    compact () { return this.width < 1100 && this.width / this.height < 1.35 },
    scale () { return this.compact ? 1 : Math.min(this.width / 1920, this.height / 1080) },
    stageStyle () {
      if (this.compact) return { zoom: 1, width: '100%', height: 'auto' }
      const width = this.width / this.scale
      const height = this.height / this.scale
      // 830 = stage gutters + column gaps + baseline sidebars; 536 = other rows and gaps.
      const availableCenter = width - 830
      const center = Math.min(availableCenter * 0.92, (height - 536) * 1.85)
      const extraSide = (availableCenter - center) / 2
      return { zoom: this.scale, width: width + 'px', height: height + 'px', '--command-left-width': 354 + extraSide + 'px', '--command-right-width': 392 + extraSide + 'px' }
    },
    clock () { return this.now.toLocaleTimeString('zh-CN', { hour12: false }) },
    today () { return this.now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' }) },
    activeTab () { return this.tabs.find(t => t.id === this.tab) },
    periodLabel () { return this.periods.find(p => p.id === this.period).label },
    visibleProjects () { return this.projects.filter(p => (this.projectId === 'all' || p.id === this.projectId) && (this.business === 'all' || this.business === p.business)) },
    scopeName () { return this.projectId !== 'all' ? this.projects.find(p => p.id === this.projectId).shortName : this.business === 'all' ? '集团全部项目' : this.business === 'office' ? '集团商办项目' : '集团产业园项目' },
    types () { return [{ id: 'all', name: '全部' }, { id: 'industrial', name: '产业园' }, { id: 'office', name: '商办' }].map(t => ({ ...t, count: this.projects.filter(p => t.id === 'all' || p.business === t.id).length })) },
    m () { return aggregatePortfolio(this.visibleProjects, this.period) },
    kpis () { return kpisFor(this.tab, this.m) },
    report () { return reportFor(this.tab, this.m, this.visibleProjects, this.period, this.energyView) },
    collectionSegments () { return [{ name: '实收', value: this.m.received, color: '#63d9c1' }, { name: '待收', value: this.m.outstanding, color: '#29445b' }] },
    hoverProject () { return this.visibleProjects.find(p => p.id === this.hoverId) },
    sceneProjects () { return this.visibleProjects.filter(p => p.scene) },
    miniLabels () { return ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '24:00'] },
    airSeries () { return [{ name: '运行内机', color: '#80bed8', values: [0.45, 0.48, 0.42, 0.62, 0.69, 0.87, 0.92, 0.82, 1, 0.91, 0.8, 0.64, 0.48].map(v => Math.round(v * this.m.acRun)) }] },
    alerts () { return this.visibleProjects.flatMap(p => Array.from({ length: p.ops.open }, (_, i) => ({ id: p.id + '-' + i, projectName: p.shortName, title: i ? '照明回路通信异常' : p.business === 'industrial' ? '变压器温度预警' : '空调采集通信异常', detail: i ? '照明回路暂未返回状态，建议排查现场网关与通信线路。' : p.business === 'industrial' ? '模拟 A 相温度 82.6°C，超过演示阈值 80°C，等待现场复核。' : '采集链路状态异常，建议核对网关与内机在线状态。', time: '10:' + (19 + i), status: i ? '处理中' : '待排查' }))) },
    dialogTitle () { return !this.dialog ? '' : ({ projects: '集团项目全景', fees: '项目能耗费用明细', duty: '配电集中值守 · 巡视快照', risks: '跨业务风险与处置', risk: '风险详情' }[this.dialog.kind]) }
  },
  watch: { business () { this.hoverId = null }, projectId () { this.hoverId = null } },
  mounted () { this.resize(); window.addEventListener('resize', this.resize); document.addEventListener('fullscreenchange', this.resize); this.timer = setInterval(() => { this.now = new Date(); this.advancePresentation() }, 1000) },
  beforeDestroy () { window.removeEventListener('resize', this.resize); document.removeEventListener('fullscreenchange', this.resize); clearInterval(this.timer); clearTimeout(this.noticeTimer) },
  methods: {
    n: num,
    pct: rate,
    money (v) { return num(v / 10000, 2) },
    projectMetrics (p) { return aggregatePortfolio([p], this.period) },
    resize () { this.width = window.innerWidth; this.height = window.innerHeight; this.fullscreen = Boolean(document.fullscreenElement) },
    async toggleFullscreen () { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen() } catch (e) { this.notice = '当前窗口不支持全屏，请使用浏览器全屏功能。'; this.noticeTimer = setTimeout(() => { this.notice = '' }, 4000) } },
    togglePresent () { this.presenting = !this.presenting; this.countdown = 12; this.hoverId = null },
    advancePresentation () { if (!this.presenting || this.dialog || this.selectOpen || document.hidden) return; this.countdown -= 1; if (this.countdown <= 0) { this.tab = this.tabs[(this.tabs.findIndex(t => t.id === this.tab) + 1) % this.tabs.length].id; this.hoverId = null; this.countdown = 12 } },
    setTab (id) { this.tab = id; this.hoverId = null; this.presenting = false },
    moveTab (index, direction) { const next = this.tabs[(index + direction + this.tabs.length) % this.tabs.length]; this.setTab(next.id); this.$nextTick(() => this.$el.querySelector('#command-tab-' + next.id).focus()) },
    setType (id) { this.business = id; this.projectId = 'all' },
    showEnergy (view) { this.energyView = view; this.setTab('energy') },
    projectHref (p) { return this.$router.resolve({ path: '/group/energy-map-screen', query: { project: p.id } }).href },
    openDialog (kind, event, detail) { this.trigger = event ? event.currentTarget : document.activeElement; this.dialog = { kind, event: detail }; this.$nextTick(() => this.$refs.close.focus()) },
    closeDialog () { this.dialog = null; this.$nextTick(() => { if (this.trigger && this.trigger.isConnected) this.trigger.focus() }) },
    trapFocus (e) { const nodes = this.$refs.dialog.querySelectorAll('a[href], button'); const first = nodes[0]; const last = nodes[nodes.length - 1]; if ((e.shiftKey && document.activeElement === first) || (!e.shiftKey && document.activeElement === last)) { e.preventDefault(); (e.shiftKey ? last : first).focus() } }
  }
}
</script>
