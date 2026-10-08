<template>
  <div class="energy-map-root">
    <nandu-screen v-if="selected && selected.scene" :key="selected.id" :project-config="sceneConfig" :project-snapshot="selected.snapshot" group-entry @back="returnGroup" />
    <asset-command v-else-if="!selected" />
    <main v-else class="gmap nandu-screen" :class="{ 'gmap--compact': compact, 'gmap--paused': paused }" :aria-label="selected ? selected.name + '能源总览' : '经开资管集团能源监控中心'">
      <div class="gmap-stage" :style="stageStyle">
        <header class="gmap-header">
          <div class="gmap-brand"><screen-icon name="office-building" /><div><strong>经开资管</strong><span>智慧能源 · 多项目协同</span></div></div>
          <div class="gmap-title"><h1>{{ selected ? selected.shortName + '能源总览' : '集团能源监控中心' }}</h1><p>{{ selected ? selected.businessName + ' / ' + selected.address : 'WU ZHONG ECONOMIC DEVELOPMENT ZONE · ENERGY OPERATIONS CENTER' }}</p></div>
          <div class="gmap-header-actions"><span>{{ snapshot.updatedAt }}</span><button class="gmap-demo" @click="openDetail('demo', $event)">演示数据</button><button class="gmap-fullscreen" :aria-label="fullscreen ? '退出全屏' : '进入全屏'" @click="toggleFullscreen">{{ fullscreen ? '退出全屏' : '全屏' }}</button></div>
        </header>
        <div v-if="invalidProject" class="gmap-notice" role="status">该项目尚未配置，已显示集团总览。<button @click="returnGroup">清除项目选择</button></div>
        <section class="gmap-kpis" aria-label="当前范围能源指标">
          <button v-for="kpi in kpis" :key="kpi.label" class="gmap-panel gmap-kpi" @click="openDetail(kpi.kind, $event)"><span class="gmap-orb" :class="kpi.tone"><screen-icon :name="kpi.icon" /></span><span><span class="gmap-label">{{ kpi.label }}</span><strong>{{ kpi.value }}<small>{{ kpi.unit }}</small></strong><em>{{ kpi.note }}</em></span></button>
        </section>
        <div class="gmap-body">
          <aside class="gmap-side gmap-left">
            <section class="gmap-panel gmap-energy">
              <div class="gmap-panel-heading"><h2>能源使用概况</h2><button aria-label="查看能源使用详情" @click="openDetail('energy', $event)">详情 ›</button></div>
              <div class="gmap-today"><screen-icon name="flash" /><span>今日项目用电<strong>{{ number(snapshot.energy.projectToday) }}<small>kWh</small></strong></span></div>
              <div class="gmap-mini-stats"><div><span>租户今日用电</span><strong>{{ number(snapshot.energy.tenantToday) }}<small>kWh</small></strong></div><div><span>今日项目用水</span><strong>{{ number(snapshot.energy.waterToday) }}<small>m³</small></strong></div></div>

            </section>
            <section class="gmap-panel gmap-trend-panel"><div class="gmap-panel-heading"><h2>租户近7日用电</h2><span>单位：kWh</span></div><group-trend :points="snapshot.trend" :paused="paused" /><div class="gmap-trend-caption">完整日用电趋势<span>09.10 — 09.16</span></div></section>
            <section class="gmap-panel gmap-ranking"><div class="gmap-panel-heading"><h2>项目用电排行</h2><span>本月 · 万 kWh</span></div><a v-for="(project, index) in ranked" :key="project.id" :href="projectHref(project)" target="_blank" rel="noopener"><span class="gmap-rank">{{ index + 1 }}</span><span class="gmap-ranking-name">{{ project.shortName }}<i><b :style="{ width: project.snapshot.energy.total / ranked[0].snapshot.energy.total * 100 + '%' }" /></i></span><strong>{{ (project.snapshot.energy.total / 10000).toFixed(2) }}</strong></a></section>
          </aside>
          <section class="gmap-center gmap-panel">
            <div class="gmap-map-toolbar"><h2>{{ selected ? '项目能源概览' : '集团项目分布' }}</h2><div v-if="!selected" class="gmap-filters" role="group" aria-label="按业态筛选"><button v-for="option in filters" :key="option.key" :aria-pressed="business === option.key" :class="{ active: business === option.key }" @click="setBusiness(option.key)">{{ option.name }} <span>{{ option.count }}</span></button></div><button v-else class="gmap-return" @click="returnGroup">‹ 返回集团总览</button><span class="gmap-map-note">项目分布示意 · 非测绘地图</span></div>
            <div v-if="!selected" class="gmap-map" aria-label="项目分布地图">
              <div class="gmap-city-caption">苏州市<span>SUZHOU · WUZHONG</span></div><div class="gmap-map-canvas">
                <img :src="mapImage" alt="依据用户提供底图制作的吴中经开区分布示意图" draggable="false">
                <scene-landmarks class="gmap-map-lines" :landmarks="mapLandmarks" :paused="paused" />
                <span class="gmap-district gmap-district--north">城南片区</span><span class="gmap-district gmap-district--east">郭巷片区</span><span class="gmap-district gmap-district--west">越溪片区</span><span class="gmap-district gmap-district--south">横泾片区</span>
                <a v-for="project in visibleProjects" :key="project.id" class="gmap-map-pin" :class="{ 'is-selected': highlighted.id === project.id, 'is-industrial': project.business === 'industrial' }" :style="{ left: project.label[0] + '%', top: project.label[1] + '%', '--pin-y': project.label[1] + '%' }" :aria-label="'进入' + project.name + '能源大屏'" @mouseenter="highlightId = project.id" @focus="highlightId = project.id" :href="projectHref(project)" target="_blank" rel="noopener"><span><i />{{ project.shortName }}<b>›</b></span></a>

              </div>
              <article class="gmap-project-popover">
                <img v-if="highlighted.scene" class="gmap-popover-photo" :src="scenes[highlighted.scene]" :alt="highlighted.name + '夜景效果图'">
                <div v-else class="gmap-scene-pending"><screen-icon name="office-building" /><span>实景待补充</span></div>
                <div class="gmap-popover-content">
                  <div class="gmap-popover-heading">{{ highlighted.shortName }}<em>{{ highlighted.businessName }}</em></div>
                  <dl class="gmap-popover-metrics"><div><dt>本月用电</dt><dd>{{ (highlighted.snapshot.energy.total / 10000).toFixed(2) }}<small>万 kWh</small></dd></div><div><dt>设备在线率</dt><dd>{{ highlighted.snapshot.devices.onlinePercent }}<small>%</small></dd></div></dl>
                  <a :href="projectHref(highlighted)" target="_blank" rel="noopener">进入项目能源大屏 <span>→</span></a>
                </div>
              </article>
            </div>
            <div v-else class="gmap-pending-project"><img :src="mapImage" alt="区域示意背景"><div><span class="gmap-eyebrow">{{ selected.businessName }} · 能源运行</span><h2>{{ selected.name }}</h2><p>{{ selected.address }}</p><div class="gmap-pending-metrics"><span>接入设备<strong>{{ snapshot.devices.total }}<small>台</small></strong></span><span>本月用电<strong>{{ (snapshot.energy.total / 10000).toFixed(2) }}<small>万 kWh</small></strong></span></div><p class="gmap-pending-note">项目实景素材待补充，当前展示能源与设备模拟数据。</p><button @click="openDetail('devices', $event)">查看设备运行详情 →</button></div></div>
            <section class="gmap-panel gmap-projects"><div class="gmap-panel-heading"><h2>项目场景与运行快照</h2><span>基于实拍场景</span><button @click="openDetail('projects', $event)">全部 {{ model.projects.length }} 项目 ›</button></div><div v-if="sceneProjects.length" class="gmap-project-grid"><a v-for="project in sceneProjects" :key="project.id" class="gmap-project-card" :href="projectHref(project)" target="_blank" rel="noopener"><img :src="scenes[project.scene]" :alt="project.name + '夜景效果图'"><span class="gmap-project-card-title">{{ project.shortName }}<i>↗</i></span><span class="gmap-project-card-meta"><em>{{ project.businessName }}</em><span><i class="gmap-live" />{{ project.snapshot.devices.onlinePercent }}% 在线</span></span></a></div><div v-else class="gmap-no-scenes"><screen-icon name="office-building" /><span>该业态的项目实景正在补充，点击地图项目可查看能源数据。</span></div></section>
          </section>
          <aside class="gmap-side gmap-right">
            <section class="gmap-panel gmap-solar"><div class="gmap-panel-heading"><h2><screen-icon name="solar-panel" />光伏运行</h2><button v-if="hasPv" @click="openDetail('pv', $event)">详情 ›</button><span v-else>未接入</span></div><template v-if="hasPv"><div class="gmap-solar-main"><div><span>本月光伏发电</span><strong>{{ number(snapshot.photovoltaic.generated) }}<small>kWh</small></strong></div><ring-chart :segments="pvSegments" :value="snapshot.photovoltaic.selfUsePercent + '%'" caption="自用率" label="光伏自用率" :paused="paused" /></div><div class="gmap-solar-track"><i :style="{ width: snapshot.photovoltaic.selfUsePercent + '%' }" /></div><div class="gmap-mini-stats"><div><span><i class="gmap-live" />自用电量</span><strong>{{ number(snapshot.photovoltaic.selfUse) }}<small>kWh</small></strong></div><div><span>上网电量</span><strong>{{ number(snapshot.photovoltaic.exported) }}<small>kWh</small></strong></div></div><p class="gmap-source">接入项目：南都广场 · 上网电量单独统计</p></template><div v-else class="gmap-solar-empty"><screen-icon name="solar-panel" /><p>当前范围暂无光伏接入</p><span>接入后汇总发电、自用与上网电量</span></div></section>
            <section class="gmap-panel gmap-device"><div class="gmap-panel-heading"><h2>设备运行</h2><span class="gmap-online-badge">在线率 {{ snapshot.devices.onlinePercent }}%</span><button @click="openDetail('devices', $event)">全部 ›</button></div><div class="gmap-device-counts"><div><span>设备总数</span><strong>{{ number(snapshot.devices.total) }}</strong></div><div><span><i class="gmap-live" />在线</span><strong>{{ number(snapshot.devices.online) }}</strong></div><button @click="openDetail('offline', $event)"><span><i class="gmap-live orange" />离线</span><strong class="orange">{{ snapshot.devices.offline }}</strong></button></div><div class="gmap-device-types"><button v-for="type in snapshot.devices.types" :key="type.key" @click="openDetail('devices', $event, type.key)"><screen-icon :name="type.icon" /><span>{{ type.name }}<strong>{{ number(type.total) }}<small>台</small></strong></span></button></div><div class="gmap-ac-title">空调内机运行状态 <span>{{ snapshot.devices.airConditioning.total }} 台</span></div><div class="gmap-ac-track"><i v-for="state in acStates" :key="state.key" :style="{ width: percent(state.value, snapshot.devices.airConditioning.total) + '%', background: state.color }" /></div><div class="gmap-ac-labels"><span v-for="state in acStates" :key="state.key"><i :style="{ background: state.color }" />{{ state.name }} <b>{{ state.value }}</b></span></div></section>
            <section class="gmap-panel gmap-events"><div class="gmap-panel-heading"><h2>运行动态</h2><button @click="openDetail('events', $event)">全部 {{ snapshot.events.length }} 条 ›</button></div><button v-for="event in recentEvents" :key="event.id" class="gmap-event" @click="openDetail('events', $event)"><screen-icon name="alert-circle" /><span><strong>{{ event.projectName || selected.name }}</strong><span>{{ event.title }}</span></span><time>{{ event.time }}</time></button></section>
          </aside>
        </div>
        <footer class="gmap-panel gmap-footer"><h2><screen-icon name="database" />费用结算概览<small>本月 · 当前范围</small></h2><button v-for="item in feeMetrics" :key="item.key" @click="openDetail('finance', $event)"><span>{{ item.label }}</span><strong :class="{ orange: item.key === 'outstanding' }"><small v-if="item.key !== 'collectionPercent'">¥</small>{{ number(snapshot.finance[item.key]) }}<small v-if="item.key === 'collectionPercent'">%</small></strong></button></footer>
        <div class="gmap-bottom"><span>{{ scopeLabel }} · {{ visibleProjects.length }} 个项目 · 能耗、设备与费用采用同一模拟快照</span><span>统计周期 {{ snapshot.period }} 租户留存为账户余额，不计入本月收入</span></div>
        <screen-details v-if="detail && detail.kind !== 'projects'" :kind="detail.kind" :initial-type="detail.type" :project-name="scopeLabel" :scope-label="scopeLabel" :snapshot="snapshot" :scene-source="mapImage" :paused="paused" @close="closeDetail" />
        <div v-if="detail && detail.kind === 'projects'" class="gmap-dialog-backdrop" @click.self="closeDetail" @keydown.esc.stop="closeDetail" @keydown.tab="trapProjectFocus"><section ref="projectDialog" class="gmap-project-dialog gmap-panel" role="dialog" aria-modal="true" aria-labelledby="gmap-project-dialog-title"><header><div><span>PROJECT DIRECTORY / 项目导航</span><h2 id="gmap-project-dialog-title">已接入项目</h2></div><button ref="projectClose" aria-label="关闭项目列表" @click="closeDetail"><screen-icon name="close" /></button></header><p>沿用现有能源大屏的管理方范围，当前全部为模拟数据。</p><div class="gmap-directory"><a v-for="project in model.projects" :key="project.id" :href="projectHref(project)" target="_blank" rel="noopener"><img v-if="project.scene" :src="scenes[project.scene]" :alt="project.name + '场景'"><span v-else class="gmap-directory-placeholder"><screen-icon name="office-building" />实景待补充</span><span><em>{{ project.businessName }}</em><strong>{{ project.name }}</strong><small>{{ project.address }}</small><b>{{ (project.snapshot.energy.total / 10000).toFixed(2) }} 万 kWh →</b></span></a></div></section></div>
      </div>
    </main>
  </div>
</template>

<script>
import NanduScreen from '../nandu-energy-screen/index.vue'
import AssetCommand from '../asset-command/index.vue'
import ScreenIcon from '../nandu-energy-screen/components/ScreenIcon.vue'
import RingChart from '../nandu-energy-screen/components/RingChart.vue'
import ScreenDetails from '../nandu-energy-screen/components/ScreenDetails.vue'
import GroupTrend from './GroupTrend.vue'
import SceneLandmarks from '../nandu-energy-screen/components/SceneLandmarks.vue'
import { createGroupModel, aggregateSnapshots } from './data'
import { formatNumber, percentage } from '../nandu-energy-screen/data'
import { mapImage, scenes, projectConfig } from './assets'
import './screen.scss'

export default {
  name: 'GroupEnergyMapScreen',
  components: { AssetCommand, NanduScreen, ScreenIcon, RingChart, ScreenDetails, GroupTrend, SceneLandmarks },
  data () { return { model: createGroupModel(), mapImage, scenes, highlightId: '1000107', business: 'all', width: window.innerWidth, height: window.innerHeight, detail: null, reducedMotion: false, pageHidden: false, fullscreen: false } },
  computed: {
    mapLandmarks () { return this.visibleProjects.map(p => ({ id: p.id, label: p.name, x: p.point[0], y: p.point[1], labelX: p.label[0], labelY: p.label[1], leader: [[p.label[0], p.label[1] + 3], p.point] })) },
    selected () { return this.model.projects.find(p => p.id === String(this.$route.query.project || '')) || null },
    invalidProject () { return Boolean(this.$route.query.project && !this.selected) },
    sceneConfig () { return this.selected ? projectConfig(this.selected) : null },
    visibleProjects () { return this.selected ? [this.selected] : this.model.projects.filter(p => this.business === 'all' || p.business === this.business) },
    snapshot () { return this.selected ? this.selected.snapshot : aggregateSnapshots(this.visibleProjects.map(p => p.snapshot)) },
    scopeLabel () { return this.selected ? this.selected.name : this.business === 'all' ? '经开资管 · 集团' : '经开资管 · ' + (this.business === 'office' ? '商办' : '产业园') },
    hasPv () { return this.visibleProjects.some(p => p.hasPv) },
    sceneProjects () { return this.visibleProjects.filter(p => p.scene) },
    highlighted () { return this.visibleProjects.find(p => p.id === this.highlightId) || this.visibleProjects[0] },
    ranked () { return [...this.visibleProjects].sort((a, b) => b.snapshot.energy.total - a.snapshot.energy.total) },
    recentEvents () { return [...this.snapshot.events].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 2) },
    filters () { return [{ key: 'all', name: '全部项目' }, { key: 'office', name: '商办' }, { key: 'industrial', name: '产业园' }].map(o => ({ ...o, count: this.model.projects.filter(p => o.key === 'all' || p.business === o.key).length })) },
    compact () { return this.width < 1100 && this.width / this.height < 1.35 },
    scale () { return this.compact ? 1 : Math.min(this.width / 1920, this.height / 1080) },
    stageStyle () { return { zoom: this.scale, width: this.compact ? '100%' : this.width / this.scale + 'px', height: this.compact ? 'auto' : this.height / this.scale + 'px' } },
    paused () { return this.reducedMotion || this.pageHidden },
    pvSegments () { return [{ name: '自用', value: this.snapshot.photovoltaic.selfUse, color: '#25efc7' }, { name: '上网', value: this.snapshot.photovoltaic.exported, color: '#215174' }] },
    acStates () { return [{ key: 'running', name: '运行', color: '#26e6c1' }, { key: 'standby', name: '待机', color: '#319efe' }, { key: 'offline', name: '离线', color: '#ffa452' }].map(s => ({ ...s, value: this.snapshot.devices.airConditioning[s.key] })) },
    feeMetrics () { return [{ key: 'receivable', label: '本月应收' }, { key: 'received', label: '本月实收' }, { key: 'outstanding', label: '本月未收' }, { key: 'collectionPercent', label: '费用实收率' }, { key: 'balance', label: '租户留存金额' }] },
    kpis () {
      const s = this.snapshot; return [
        { label: '接入能源管理项目', value: this.visibleProjects.length, unit: '个', icon: 'office-building', kind: 'projects', note: this.selected ? this.selected.businessName : this.business === 'all' ? '商办 / 产业园' : this.business === 'office' ? '商办项目' : '产业园项目' },
        { label: '本月项目用电', value: (s.energy.total / 10000).toFixed(2), unit: '万 kWh', icon: 'flash', kind: 'energy', note: '租户与公区合计' },
        { label: '本月租户用水', value: this.number(s.energy.tenantWater), unit: 'm³', icon: 'water', kind: 'water', note: '租户水表统计' },
        { label: '本月光伏发电', value: this.hasPv ? this.number(s.photovoltaic.generated) : '—', unit: this.hasPv ? 'kWh' : '', icon: 'solar-panel', kind: this.hasPv ? 'pv' : 'demo', note: this.hasPv ? '南都广场屋顶光伏' : '当前范围暂未接入', tone: 'mint' },
        { label: '设备在线率', value: s.devices.onlinePercent, unit: '%', icon: 'cog', kind: 'devices', note: this.number(s.devices.online) + ' / ' + this.number(s.devices.total) + ' 台在线' },
        { label: '费用实收率', value: s.finance.collectionPercent, unit: '%', icon: 'chart-pie', kind: 'finance', note: '本月实收 / 本月应收', tone: 'mint' }
      ]
    }
  },
  watch: { '$route.query.project' () { this.detail = null } },
  mounted () {
    this.resize(); this.syncVisibility(); this.media = window.matchMedia('(prefers-reduced-motion: reduce)'); this.reducedMotion = this.media.matches
    this.media.addEventListener('change', this.syncMotion)
    window.addEventListener('resize', this.resize); document.addEventListener('visibilitychange', this.syncVisibility); document.addEventListener('fullscreenchange', this.resize)
  },
  beforeDestroy () { this.media.removeEventListener('change', this.syncMotion); window.removeEventListener('resize', this.resize); document.removeEventListener('visibilitychange', this.syncVisibility); document.removeEventListener('fullscreenchange', this.resize) },
  methods: {
    number: formatNumber,
    percent: percentage,
    resize () { this.width = window.innerWidth; this.height = window.innerHeight; this.fullscreen = Boolean(document.fullscreenElement) },
    syncVisibility () { this.pageHidden = document.hidden },
    syncMotion (e) { this.reducedMotion = e.matches },
    async toggleFullscreen () { try { if (document.fullscreenElement) await document.exitFullscreen(); else await this.$el.requestFullscreen() } catch (e) { this.openDetail('demo') } },
    setBusiness (value) { this.business = value; this.highlightId = this.visibleProjects[0].id },
    projectHref (project) { return this.$router.resolve({ path: '/group/energy-map-screen', query: { project: project.id } }).href },
    returnGroup () { this.detail = null; this.$router.push({ path: '/group/energy-map-screen' }) },
    openDetail (kind, event, type = 'all') { this.trigger = event ? event.currentTarget : document.activeElement; this.detail = { kind, type }; if (kind === 'projects') this.$nextTick(() => this.$refs.projectClose.focus()) },
    closeDetail () { this.detail = null; this.$nextTick(() => { if (this.trigger && this.trigger.isConnected) this.trigger.focus() }) },
    trapProjectFocus (event) { const controls = this.$refs.projectDialog.querySelectorAll('button, a[href]'); const first = controls[0]; const last = controls[controls.length - 1]; if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) { event.preventDefault(); (event.shiftKey ? last : first).focus() } }
  }
}
</script>
