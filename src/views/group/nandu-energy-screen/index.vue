<template>
  <main class="nandu-screen" :class="{ 'nandu-screen--paused': motionPaused, 'nandu-screen--compact': layout.compact }" :aria-label="config.title">
    <div class="nandu-stage" :class="{ 'nandu-stage--ready': sceneReady }" :style="stageStyle">
      <div class="nandu-scene-layer">
        <img ref="scene" class="nandu-scene" :style="sceneStyle" :src="sceneSource" :alt="config.projectName + '夜景效果展示'" draggable="false" @load="onSceneLoad" @error="onSceneError">
        <div class="nandu-scene-shade" aria-hidden="true" />
        <scene-landmarks class="nandu-enter" :landmarks="sceneLandmarks" :scene-width="layout.sceneWidth" :scene-height="layout.sceneHeight" :paused="motionPaused" @select="openLandmark" />
      </div>
      <div v-if="!sceneReady && !sceneError" class="nandu-loading" role="status">正在载入{{ config.projectName }}能源总览…</div>
      <div v-if="sceneError" class="nandu-image-error" role="alert">场景图片暂未加载成功 <button type="button" @click="retryScene">重新加载</button></div>
      <header class="nandu-header nandu-enter">
        <div class="nandu-header__project"><button v-if="groupEntry" class="nandu-back-group" @click="$emit('back')">‹ 集团总览</button><strong v-else>{{ config.projectName }}</strong><span>/</span><span>能源总览</span></div>
        <div class="nandu-header__heading"><h1>{{ config.title }}</h1><p>{{ config.subtitle }}</p></div>
        <div class="nandu-header__meta"><time :title="'演示快照：' + snapshot.updatedAt">{{ snapshot.updatedAt }}</time><button class="nandu-demo-badge" type="button" @click="openDetail('demo', $event)">演示数据</button></div>
      </header>
      <section class="nandu-headline nandu-panel nandu-enter" aria-label="本月核心指标">
        <button v-for="metric in headlineMetrics" :key="metric.label" type="button" class="nandu-headline__metric" @click="openDetail(metric.kind, $event)">
          <span class="nandu-orb" :class="metric.tone"><screen-icon :name="metric.icon" /></span>
          <span><span class="nandu-metric-label">{{ metric.label }}</span><strong class="nandu-number">{{ metric.value }}<small>{{ metric.unit }}</small></strong></span>
        </button>
      </section>
      <section class="nandu-overview nandu-panel nandu-enter" aria-labelledby="nandu-overview-title">
        <div class="nandu-panel-heading"><h2 id="nandu-overview-title">今日能源概况</h2><button aria-label="查看今日能源详情" @click="openDetail('energy', $event)"><screen-icon name="chevron-right" /></button></div>
        <div class="nandu-today-list"><div v-for="metric in todayMetrics" :key="metric.label" class="nandu-today-metric"><span class="nandu-orb"><screen-icon :name="metric.icon" /></span><div><h3>{{ metric.label }}</h3><strong class="nandu-number">{{ number(metric.value) }}<small>{{ metric.unit }}</small></strong></div></div></div>
      </section>
      <section class="nandu-trend-panel nandu-panel nandu-enter" aria-labelledby="nandu-trend-title">
        <div class="nandu-panel-heading"><h2 id="nandu-trend-title">租户近7日用电趋势</h2><span class="nandu-unit">单位：kWh</span></div>
        <trend-chart :points="snapshot.trend" :reduced-motion="motionPaused" />
      </section>
      <section class="nandu-consumption nandu-panel nandu-enter" aria-labelledby="nandu-consumption-title">
        <div class="nandu-panel-heading"><h2 id="nandu-consumption-title">本月租户用电构成</h2><button aria-label="查看租户用电构成" @click="openDetail('energy', $event)"><screen-icon name="chevron-right" /></button></div>
        <div class="nandu-consumption__body"><ring-chart :segments="consumptionSegments" :value="number(snapshot.energy.tenant)" unit="kWh" caption="本月合计" label="租户用电构成" :paused="motionPaused" /><div class="nandu-consumption__legend"><div v-for="segment in consumptionSegments" :key="segment.name"><h3><i class="nandu-dot" :style="{ background: segment.color }" />{{ segment.name }}</h3><strong>{{ number(segment.value) }}<small>kWh</small><em>{{ segment.percent }}%</em></strong></div></div></div>
      </section>
      <section class="nandu-project-card nandu-panel nandu-enter" aria-labelledby="nandu-project-title">
        <div class="nandu-panel-heading"><h2 id="nandu-project-title">项目能源总览</h2></div>
        <div v-for="metric in projectMetrics" :key="metric.label" class="nandu-project-metric"><screen-icon :name="metric.icon" /><div><h3>{{ metric.label }}</h3><strong>{{ number(metric.value) }}<small>kWh</small></strong></div></div>
      </section>
      <section v-if="hasPv" class="nandu-pv nandu-panel nandu-enter" aria-labelledby="nandu-pv-title">
        <div class="nandu-panel-heading nandu-panel-heading--icon"><h2 id="nandu-pv-title"><screen-icon name="solar-panel" />光伏运行</h2><button aria-label="查看光伏运行详情" @click="openDetail('pv', $event)"><span>绿色能源</span><screen-icon name="chevron-right" /></button></div>
        <div class="nandu-pv__overview"><div><h3>本月发电</h3><strong class="nandu-number nandu-mint">{{ number(snapshot.photovoltaic.generated) }}<small>kWh</small></strong></div><div class="nandu-pv__percent"><span>自用率</span><strong>{{ snapshot.photovoltaic.selfUsePercent }}%</strong></div><ring-chart :segments="pvSegments" :value="snapshot.photovoltaic.selfUsePercent + '%'" label="光伏自用比例" :paused="motionPaused" /></div>
        <div class="nandu-pv__track" role="img" :aria-label="'自用' + snapshot.photovoltaic.selfUsePercent + '%，其余上网'"><span :style="{ width: snapshot.photovoltaic.selfUsePercent + '%' }" /></div>
        <div class="nandu-pv__details"><div><i class="nandu-dot" /><span>自用<strong>{{ number(snapshot.photovoltaic.selfUse) }}<small>kWh</small></strong></span></div><div><i class="nandu-dot nandu-dot--blue" /><span>上网<strong>{{ number(snapshot.photovoltaic.exported) }}<small>kWh</small></strong></span></div></div>
      </section>
      <section v-else class="nandu-pv nandu-panel nandu-enter nandu-water-panel">
        <div class="nandu-panel-heading"><h2>用水概况</h2><button aria-label="查看用水详情" @click="openDetail('water', $event)"><screen-icon name="chevron-right" /></button></div>
        <div class="nandu-water-total"><screen-icon name="water" /><div><h3>本月租户用水</h3><strong class="nandu-number">{{ number(snapshot.energy.tenantWater) }}<small>m³</small></strong></div></div>
        <div class="nandu-water-bottom"><span>今日项目用水 <b>{{ number(snapshot.energy.waterToday) }} m³</b></span><span>光伏：暂未接入</span></div>
      </section>
      <section class="nandu-devices nandu-panel nandu-enter" aria-labelledby="nandu-devices-title">
        <div class="nandu-panel-heading nandu-panel-heading--icon"><h2 id="nandu-devices-title"><screen-icon name="cog" />设备运行</h2><button aria-label="查看设备运行详情" @click="openDetail('devices', $event)"><span>保障用能</span><screen-icon name="chevron-right" /></button></div>
        <div class="nandu-online-rate"><span>设备在线率</span><strong>{{ snapshot.devices.onlinePercent }}<small>%</small></strong></div>
        <div class="nandu-device-counts"><div><h3>设备总数</h3><strong>{{ snapshot.devices.total }}<small>台</small></strong></div><div><h3><screen-icon name="wifi" />在线</h3><strong>{{ snapshot.devices.online }}<small>台</small></strong></div><div class="nandu-orange"><h3><screen-icon name="alert-circle" />离线</h3><strong>{{ snapshot.devices.offline }}<small>台</small></strong></div></div>
        <div class="nandu-device-types"><button v-for="type in snapshot.devices.types" :key="type.key" type="button" :aria-label="'查看' + type.name + '设备'" @click="openDetail('devices', $event, type.key)"><screen-icon :name="type.icon" /><span>{{ type.name }}<strong>{{ type.total }}<small>台</small></strong></span></button></div>
        <div class="nandu-ac"><h3>空调内机状态</h3><div class="nandu-ac__track" role="img" :aria-label="acStates.map(s => s.label + s.value + '台').join('，')"><span v-for="state in acStates" :key="state.key" :class="'nandu-ac--' + state.key" :style="{ width: state.percent + '%' }" /></div><div class="nandu-ac__legend"><div v-for="state in acStates" :key="state.key" :class="'nandu-ac--' + state.key"><h4><i class="nandu-dot" />{{ state.label }}</h4><strong>{{ state.value }}<small>台</small></strong></div></div></div>
      </section>
      <section class="nandu-events nandu-panel nandu-enter" aria-labelledby="nandu-events-title">
        <div class="nandu-panel-heading nandu-panel-heading--icon"><h2 id="nandu-events-title"><screen-icon name="pulse" />运行动态</h2><button aria-label="查看运行事件" @click="openDetail('events', $event)"><span>全部事件</span><screen-icon name="chevron-right" /></button></div>
        <div class="nandu-event-grid"><button @click="openDetail('offline', $event)"><screen-icon name="alert-circle" /><span>当前离线设备<strong>{{ snapshot.devices.offline }}<small>台</small></strong></span></button><button @click="openDetail('offline', $event, 'ac')"><screen-icon name="fan" /><span>空调离线<strong>{{ snapshot.devices.airConditioning.offline }}<small>台</small></strong></span></button><button @click="openDetail('events', $event)"><screen-icon name="alert-circle" /><span>今日通信异常<strong>{{ snapshot.events.length }}<small>次</small></strong></span></button><div><screen-icon name="clock-outline" /><span>快照更新时间<strong class="nandu-event-time">10:30</strong></span></div></div>
      </section>
      <energy-flow class="nandu-enter" :has-pv="hasPv" :energy="snapshot.energy" :photovoltaic="snapshot.photovoltaic" :paused="motionPaused" />
      <footer class="nandu-finance nandu-panel nandu-enter" aria-label="费用结算概览">
        <h2><screen-icon name="database" />费用结算概览</h2><div class="nandu-finance__metrics"><button v-for="metric in financeMetrics" :key="metric.key" type="button" class="nandu-finance__metric" :class="{ 'nandu-orange': metric.key === 'outstanding' }" @click="openDetail('finance', $event)"><span class="nandu-orb"><screen-icon :name="metric.icon" /></span><span><span class="nandu-metric-label">{{ metric.label }}</span><strong><small v-if="metric.key !== 'collectionPercent'">¥</small>{{ metric.value }}<small v-if="metric.key === 'collectionPercent'">%</small></strong></span></button></div>
      </footer>
      <p class="nandu-period">统计周期 {{ snapshot.period }}<span>· 演示数据</span></p>
      <screen-details v-if="detail" :project-name="config.projectName" :kind="detail.kind" :initial-type="detail.type" :snapshot="snapshot" :scene-source="sceneSource" :paused="motionPaused" @close="closeDetail" />
    </div>
  </main>
</template>
<script>
import ScreenIcon from './components/ScreenIcon.vue'
import TrendChart from './components/TrendChart.vue'
import RingChart from './components/RingChart.vue'
import EnergyFlow from './components/EnergyFlow.vue'
import SceneLandmarks from './components/SceneLandmarks.vue'
import ScreenDetails from './components/ScreenDetails.vue'
import { screenConfig, createDemoSnapshot, loadScreenSnapshot, formatNumber, percentage } from './data'
import { getScreenLayout, mapSceneLandmarks } from './layout'
import sceneImage from './assets/nandu-night-scene-v2.png'
import './screen.scss'
export default {
  name: 'NanduEnergyScreen',
  components: { ScreenIcon, TrendChart, RingChart, EnergyFlow, SceneLandmarks, ScreenDetails },
  props: { projectConfig: { type: Object, default: null }, projectSnapshot: { type: Object, default: null }, groupEntry: { type: Boolean, default: false } },
  data () { return { config: this.projectConfig || screenConfig, snapshot: this.projectSnapshot || createDemoSnapshot(), layout: getScreenLayout(window.innerWidth, window.innerHeight), sceneSource: (this.projectConfig && this.projectConfig.sceneSource) || sceneImage, sceneReady: false, sceneError: false, reducedMotion: false, pageHidden: false, detail: null } },
  computed: {
    hasPv () { return this.config.hasPv !== false },
    stageStyle () { return { zoom: this.layout.scale, width: this.layout.stageWidth + 'px', height: this.layout.compact ? 'auto' : this.layout.stageHeight + 'px', '--compact-flow-scale': (this.layout.stageWidth - 24) / 940 } },
    sceneStyle () { return { width: this.layout.renderedWidth + 'px', height: this.layout.renderedHeight + 'px', left: this.layout.offsetX + 'px', top: this.layout.offsetY + 'px' } },
    sceneLandmarks () { return mapSceneLandmarks(this.config.landmarks, this.layout) },
    motionPaused () { return this.reducedMotion || this.pageHidden || !this.sceneReady },
    headlineMetrics () {
      return [
        { label: '本月项目用电', value: formatNumber(this.snapshot.energy.total), unit: 'kWh', icon: 'flash', kind: 'energy', tone: '' },
        { label: '设备在线率', value: this.snapshot.devices.onlinePercent, unit: '%', icon: 'cog', kind: 'devices', tone: '' },
        this.hasPv ? { label: '本月光伏发电', value: formatNumber(this.snapshot.photovoltaic.generated), unit: 'kWh', icon: 'solar-panel', kind: 'pv', tone: 'nandu-orb--mint' } : { label: '本月租户用水', value: formatNumber(this.snapshot.energy.tenantWater), unit: 'm³', icon: 'water', kind: 'water', tone: 'nandu-orb--mint' }
      ]
    },
    todayMetrics () { return [{ label: '今日项目用电', value: this.snapshot.energy.projectToday, icon: 'flash', unit: 'kWh' }, { label: '租户今日用电', value: this.snapshot.energy.tenantToday, icon: 'account-group', unit: 'kWh' }, { label: '今日项目用水', value: this.snapshot.energy.waterToday, icon: 'water', unit: 'm³' }] },
    projectMetrics () { return [{ label: '项目用电', value: this.snapshot.energy.total, icon: 'flash' }, { label: '租户用电', value: this.snapshot.energy.tenant, icon: 'office-building' }, { label: '公区用电', value: this.snapshot.energy.common, icon: 'account-group' }] },
    consumptionSegments () { return [{ name: '室内用电', value: this.snapshot.energy.indoor, percent: this.snapshot.energy.indoorPercent, color: '#28eed1' }, { name: '空调用电', value: this.snapshot.energy.airConditioning, percent: this.snapshot.energy.airConditioningPercent, color: '#299ff9' }] },
    pvSegments () { return [{ name: '自用', value: this.snapshot.photovoltaic.selfUse, color: '#27efc9' }, { name: '上网', value: this.snapshot.photovoltaic.exported, color: '#204d76' }] },
    acStates () { return [{ key: 'running', label: '运行' }, { key: 'standby', label: '待机' }, { key: 'offline', label: '离线' }].map(item => ({ ...item, value: this.snapshot.devices.airConditioning[item.key], percent: percentage(this.snapshot.devices.airConditioning[item.key], this.snapshot.devices.airConditioning.total) })) },
    financeMetrics () { return [{ key: 'receivable', label: '本月应收', icon: 'database' }, { key: 'received', label: '本月实收', icon: 'check-circle' }, { key: 'outstanding', label: '本月未收', icon: 'alert-circle' }, { key: 'collectionPercent', label: '费用实收率', icon: 'chart-pie' }, { key: 'balance', label: '租户留存金额', icon: 'account-group' }].map(item => ({ ...item, value: item.key === 'collectionPercent' ? this.snapshot.finance[item.key].toFixed(1) : formatNumber(this.snapshot.finance[item.key]) })) }
  },
  mounted () {
    this.updateScale()
    this.syncVisibility()
    window.addEventListener('resize', this.updateScale)
    document.addEventListener('fullscreenchange', this.updateScale)
    document.addEventListener('visibilitychange', this.syncVisibility)
    this._motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    this.reducedMotion = this._motionQuery.matches
    if (this._motionQuery.addEventListener) this._motionQuery.addEventListener('change', this.syncMotion)
    else this._motionQuery.addListener(this.syncMotion)
    if (this.$refs.scene.complete && this.$refs.scene.naturalWidth) this.onSceneLoad()
    if (!this.projectSnapshot) loadScreenSnapshot().then(snapshot => { if (!this._isBeingDestroyed && !this._isDestroyed) this.snapshot = snapshot })
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.updateScale)
    document.removeEventListener('fullscreenchange', this.updateScale)
    document.removeEventListener('visibilitychange', this.syncVisibility)
    if (this._motionQuery) {
      if (this._motionQuery.removeEventListener) this._motionQuery.removeEventListener('change', this.syncMotion)
      else this._motionQuery.removeListener(this.syncMotion)
    }
  },
  methods: {
    number: formatNumber,
    updateScale () { this.layout = getScreenLayout(window.innerWidth, window.innerHeight) },
    syncVisibility () { this.pageHidden = document.hidden },
    syncMotion (event) { this.reducedMotion = event.matches },
    onSceneLoad () { this.sceneError = false; this.sceneReady = true },
    onSceneError () { this.sceneError = true; this.sceneReady = true },
    retryScene () { this.sceneReady = false; this.sceneError = false; this.sceneSource = `${(this.projectConfig && this.projectConfig.sceneSource) || sceneImage}?retry=${Date.now()}` },
    openDetail (kind, event, type = 'all') { this._detailTrigger = event ? event.currentTarget : document.activeElement; this.detail = { kind, type } },
    openLandmark (item) { this.openDetail(item.id === 'podium' ? 'pv' : item.id) },
    closeDetail () { this.detail = null; this.$nextTick(() => { if (this._detailTrigger && this._detailTrigger.isConnected) this._detailTrigger.focus() }) }
  }
}
</script>
