<template>
  <div class="nandu-dialog-backdrop" @click.self="$emit('close')" @keydown.esc.stop="$emit('close')" @keydown.tab="trapFocus">
    <section ref="dialog" class="nandu-dialog" role="dialog" aria-modal="true" aria-labelledby="nandu-dialog-title" tabindex="-1">
      <header class="nandu-dialog__header"><span class="nandu-dialog__title-icon"><screen-icon :name="presentation.icon" /></span><div><p>{{ projectName }} <span>/ 运行详情</span></p><h2 id="nandu-dialog-title">{{ presentation.title }}</h2></div><span class="nandu-dialog__demo">模拟数据</span><button ref="close" class="nandu-dialog__close" aria-label="关闭详情" @click="$emit('close')"><screen-icon name="close" /></button></header>
      <div class="nandu-dialog__body">
        <aside class="nandu-detail-visual">
          <img :src="mode === 'pv' ? roofPhoto : sceneSource" :alt="mode === 'pv' ? '用户提供的裙楼屋顶光伏实拍' : projectName + '场景'">
          <div class="nandu-detail-visual__top"><span class="nandu-live-dot" />{{ mode === 'pv' ? '屋顶光伏 · 现场实拍' : projectName + ' · 能源管理' }}</div>
          <div class="nandu-detail-visual__bottom"><screen-icon :name="presentation.icon" /><h3>{{ presentation.visualTitle }}</h3><p>{{ presentation.description }}</p><span>{{ mode === 'pv' ? '阵列分布于屋顶多侧' : '统计范围：' + scopeLabel }}</span></div>
        </aside>
        <div class="nandu-detail-content">
          <div class="nandu-detail-kpis"><div v-for="metric in metrics" :key="metric.label"><span>{{ metric.label }}</span><strong :class="metric.tone">{{ number(metric.value) }}<small>{{ metric.unit }}</small></strong></div></div>
          <template v-if="mode === 'devices'">
            <div class="nandu-detail-filters"><label>类型<select v-model="deviceType"><option value="all">全部设备</option><option v-for="type in snapshot.devices.types" :key="type.key" :value="type.key">{{ type.name }}</option></select></label><label>状态<select v-model="deviceStatus"><option value="all">全部状态</option><option value="online">在线</option><option value="standby">待机</option><option value="offline">离线</option></select></label><span>{{ filteredDevices.length }} 台设备</span></div>
            <table class="nandu-detail-table"><thead><tr><th>设备编号</th><th>设备名称</th><th>运行状态</th><th>最后采集</th></tr></thead><tbody><tr v-for="device in devicePage" :key="device.id"><td>{{ device.id }}</td><td>{{ device.name }}</td><td><span class="nandu-status" :class="'nandu-status--' + device.status"><i />{{ statusLabel(device) }}</span></td><td>{{ device.updatedAt }}</td></tr><tr v-if="!devicePage.length"><td colspan="4" class="nandu-table-empty">当前筛选下没有设备</td></tr></tbody></table>
            <div class="nandu-pagination"><span>设备名称与编号均为演示数据</span><button :disabled="page === 1" @click="page--">上一页</button><span>{{ page }} / {{ pageCount }}</span><button :disabled="page === pageCount" @click="page++">下一页</button></div>
          </template>
          <template v-else-if="mode === 'events'">
            <div class="nandu-detail-section-heading"><h3>今日运行事件</h3><span>事件次数与离线台数分别统计</span></div>
            <div class="nandu-event-list"><article v-for="event in snapshot.events" :key="event.id"><span class="nandu-event-list__icon" :class="{ 'is-resolved': event.status === '已恢复' }"><screen-icon :name="event.status === '已恢复' ? 'check-circle' : 'alert-circle'" /></span><div><h4>{{ event.projectName ? event.projectName + ' · ' : '' }}{{ event.title }}<time>{{ event.time }}</time></h4><p>{{ event.detail }}</p><span class="nandu-event-tag" :class="{ 'is-resolved': event.status === '已恢复' }">{{ event.status }}</span></div></article></div>
          </template>
          <template v-else-if="mode === 'finance'">
            <div class="nandu-detail-section-heading"><h3>本月费用收取明细</h3><span>单位：元</span></div>
            <table class="nandu-detail-table nandu-detail-table--spacious"><thead><tr><th>费用类型</th><th>本月应收</th><th>本月实收</th><th>本月未收</th></tr></thead><tbody><tr v-for="category in snapshot.finance.categories" :key="category.name"><td>{{ category.name }}</td><td>{{ number(category.receivable) }}</td><td>{{ number(category.received) }}</td><td class="nandu-orange">{{ number(category.receivable - category.received) }}</td></tr></tbody></table>
            <div class="nandu-detail-callout"><screen-icon name="information-outline" /><p>租户留存金额 <strong>¥ {{ number(snapshot.finance.balance) }}</strong> 为账户余额，不计入本月应收或本月收入。</p></div>
          </template>
          <template v-else-if="mode === 'pv'">
            <div class="nandu-detail-section-heading"><h3>光伏发电分配</h3><span>自用率 {{ snapshot.photovoltaic.selfUsePercent }}%</span></div>
            <div class="nandu-detail-solar"><ring-chart :segments="solarSegments" :value="number(snapshot.photovoltaic.generated)" unit="kWh" caption="本月发电" label="光伏发电分配" :paused="paused" /><div><p><i class="nandu-dot" />自用电量<strong>{{ number(snapshot.photovoltaic.selfUse) }}<small>kWh</small></strong></p><p><i class="nandu-dot nandu-dot--blue" />上网电量<strong>{{ number(snapshot.photovoltaic.exported) }}<small>kWh</small></strong></p></div></div>
            <table class="nandu-detail-table"><thead><tr><th>模拟分区</th><th>发电量 / kWh</th><th>自用 / kWh</th><th>上网 / kWh</th></tr></thead><tbody><tr v-for="zone in snapshot.photovoltaic.zones" :key="zone.name"><td>{{ zone.name }}</td><td>{{ number(zone.generated) }}</td><td>{{ number(zone.selfUse) }}</td><td>{{ number(zone.exported) }}</td></tr></tbody></table>
            <p class="nandu-detail-footnote">照片为现场实拍；分区名称与发电数据为模拟，后续按实际电表映射接入。</p>
          </template>
          <template v-else-if="mode === 'water'"><div class="nandu-detail-callout"><screen-icon name="water" /><p>本月租户用水仅包含租户水表；今日项目用水包含租户与公区，两个指标统计范围和时间不同，不直接对比。分时曲线待实际采集数据接入后展示。</p></div></template>
          <template v-else-if="mode === 'demo'">
            <div class="nandu-detail-section-heading"><h3>展示口径</h3><span>统一快照 · 不自动随机变动</span></div>
            <dl class="nandu-data-notes"><div><dt>时间范围</dt><dd>本月为 9 月 1 日至 17 日；今日为 9 月 17 日 10:30 快照；近 7 日为 9 月 10 日至 16 日完整日。</dd></div><div><dt>能源关系</dt><dd>市电购入 + 光伏自用 = 项目用电 = 租户用电 + 公区用电。光伏上网单独统计。</dd></div><div><dt>统计单位</dt><dd>电量为 kWh，水量为 m³，费用为元。设备在线包含在线待机设备。</dd></div><div><dt>数据来源</dt><dd>当前为本地模拟数据，尚未连接管理方接口。屋顶照片为现场实拍，中央场景为效果展示。</dd></div></dl>
          </template>
          <template v-else>
            <div class="nandu-detail-tabs" role="tablist" aria-label="能源详情视图" @keydown="onTabKey"><button v-for="(label, index) in ['本月能源构成', '近7日趋势']" :id="'nandu-detail-tab-' + index" :key="label" role="tab" :aria-selected="activeTab === index" :tabindex="activeTab === index ? 0 : -1" aria-controls="nandu-detail-tabpanel" :class="{ 'is-active': activeTab === index }" @click="activeTab = index">{{ label }}</button></div>
            <div id="nandu-detail-tabpanel" role="tabpanel" :aria-labelledby="'nandu-detail-tab-' + activeTab">
              <div v-if="activeTab === 0" class="nandu-detail-energy"><div v-for="row in energyRows" :key="row.name"><div><span>{{ row.name }}</span><strong>{{ number(row.value) }}<small>kWh</small><em>{{ row.percent }}%</em></strong></div><div class="nandu-detail-meter"><span :style="{ width: row.percent + '%', background: row.color }" /></div></div><p class="nandu-detail-equation">市电 {{ number(snapshot.energy.gridImport) }} + 光伏自用 {{ number(snapshot.photovoltaic.selfUse) }} = 项目用电 {{ number(snapshot.energy.total) }} kWh</p></div>
              <div v-else class="nandu-detail-trend"><trend-chart :points="snapshot.trend" :reduced-motion="paused" /></div>
            </div>
            <p class="nandu-detail-footnote">{{ kind === 'tower' || kind === 'entrance' ? '当前为全项目用能汇总，暂不代表单栋或楼层数据。' : '室内与空调用电均属于租户用电；公区用电单独统计。' }}</p>
          </template>
        </div>
      </div>
      <footer class="nandu-dialog__footer"><span><i class="nandu-live-dot" />快照时间 {{ snapshot.updatedAt }}</span><span>统计周期 {{ snapshot.period }}<b>演示数据</b></span></footer>
    </section>
  </div>
</template>
<script>
import ScreenIcon from './ScreenIcon.vue'
import RingChart from './RingChart.vue'
import TrendChart from './TrendChart.vue'
import roofPhoto from '../assets/nandu-roof-photo.jpg'
import { formatNumber, percentage } from '../data'
export default {
  name: 'NanduScreenDetails',
  components: { ScreenIcon, RingChart, TrendChart },
  props: {
    projectName: { type: String, default: '南都广场' },
    scopeLabel: { type: String, default: '全项目' },
    kind: { type: String, required: true },
    initialType: { type: String, default: 'all' },
    snapshot: { type: Object, required: true },
    sceneSource: { type: String, required: true },
    paused: { type: Boolean, default: false }
  },
  data () { return { roofPhoto, activeTab: 0, deviceType: this.initialType, deviceStatus: this.kind === 'offline' ? 'offline' : 'all', page: 1, pageSize: 7 } },
  computed: {
    mode () { return ['devices', 'offline'].includes(this.kind) ? 'devices' : (['pv', 'finance', 'events', 'demo', 'water'].includes(this.kind) ? this.kind : 'energy') },
    presentation () {
      const presentations = {
        water: { title: '用水概况', icon: 'water', visualTitle: '分清范围，读懂用水', description: '本月租户用水与今日项目用水分别展示；尚未接入分时用水曲线。' },
        devices: { title: '设备运行详情', icon: 'cog', visualTitle: '设备状态，一览可知', description: '按设备类型和在线状态查看计量及空调设备，定位需要排查的采集点。' },
        events: { title: '运行事件', icon: 'pulse', visualTitle: '从异常到排查', description: '汇总通信异常与恢复记录，区分当前故障和已经恢复的历史事件。' },
        pv: { title: '裙楼屋顶光伏', icon: 'solar-panel', visualTitle: '让屋顶产生绿色能源', description: '左右两侧屋顶均有光伏阵列，保留中央天井、采光区域与维护通道。' },
        finance: { title: '费用结算详情', icon: 'database', visualTitle: '应收、实收与未收', description: '按费用类型核对本月收取情况，账户留存余额单独展示。' },
        demo: { title: '能源总览 · 数据说明', icon: 'information-outline', visualTitle: '同一套数据，同一种口径', description: '用能、设备、光伏与费用采用一致的模拟快照，便于演示和核对。' },
        energy: { title: this.kind === 'tower' ? this.projectName + ' · 能源总览' : (this.kind === 'entrance' ? this.projectName + ' · 项目总览' : '能源运行详情'), icon: 'office-building', visualTitle: '看清每一部分用能', description: '从项目总量查看租户与公区用电，结合近期趋势了解用能变化。' }
      }
      return presentations[this.mode]
    },
    metrics () {
      const e = this.snapshot.energy
      const p = this.snapshot.photovoltaic
      const d = this.snapshot.devices
      const f = this.snapshot.finance
      const metric = (label, value, unit, tone = '') => ({ label, value, unit, tone })
      if (this.mode === 'water') return [metric('本月租户用水', e.tenantWater, 'm³'), metric('今日项目用水', e.waterToday, 'm³'), metric('接入水表', d.types.find(t => t.key === 'water').total, '台')]
      if (this.mode === 'devices') return [metric('设备总数', d.total, '台'), metric('在线设备', d.online, '台'), metric('离线设备', d.offline, '台', 'nandu-orange')]
      if (this.mode === 'pv') return [metric('本月发电', p.generated, 'kWh'), metric('本月自用', p.selfUse, 'kWh'), metric('本月上网', p.exported, 'kWh')]
      if (this.mode === 'finance') return [metric('本月应收', f.receivable, '元'), metric('本月实收', f.received, '元'), metric('本月未收', f.outstanding, '元', 'nandu-orange')]
      if (this.mode === 'events') return [metric('今日通信异常', this.snapshot.events.length, '次'), metric('待排查事件', this.snapshot.events.filter(event => event.status === '待排查').length, '条', 'nandu-orange'), metric('已恢复事件', this.snapshot.events.filter(event => event.status === '已恢复').length, '条')]
      return [metric('今日项目用电', e.projectToday, 'kWh'), metric('今日租户用电', e.tenantToday, 'kWh'), metric('今日公区用电', e.commonToday, 'kWh')]
    },
    filteredDevices () { return this.snapshot.deviceRecords.filter(device => (this.deviceType === 'all' || device.type === this.deviceType) && (this.deviceStatus === 'all' || (this.deviceStatus === 'online' ? device.status !== 'offline' : device.status === this.deviceStatus))) },
    pageCount () { return Math.max(1, Math.ceil(this.filteredDevices.length / this.pageSize)) },
    devicePage () { return this.filteredDevices.slice((this.page - 1) * this.pageSize, this.page * this.pageSize) },
    solarSegments () { return [{ name: '自用', value: this.snapshot.photovoltaic.selfUse, color: '#2ae9c8' }, { name: '上网', value: this.snapshot.photovoltaic.exported, color: '#279ffa' }] },
    energyRows () { return [{ name: '租户 · 室内用电', value: this.snapshot.energy.indoor, color: '#27e6cb' }, { name: '租户 · 空调用电', value: this.snapshot.energy.airConditioning, color: '#32b6fa' }, { name: '公区用电', value: this.snapshot.energy.common, color: '#7c9bff' }].map(row => ({ ...row, percent: percentage(row.value, this.snapshot.energy.total) })) }
  },
  watch: { deviceType () { this.page = 1 }, deviceStatus () { this.page = 1 } },
  mounted () { this.$refs.close.focus() },
  methods: {
    number: formatNumber,
    statusLabel (device) { return device.status === 'offline' ? '离线' : (device.status === 'standby' ? '在线 · 待机' : (device.type === 'ac' ? '在线 · 运行' : '在线')) },
    onTabKey (event) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
      event.preventDefault()
      this.activeTab = event.key === 'Home' ? 0 : (event.key === 'End' ? 1 : 1 - this.activeTab)
      this.$nextTick(() => this.$refs.dialog.querySelector('[aria-selected="true"]').focus())
    },
    trapFocus (event) {
      const controls = Array.from(this.$refs.dialog.querySelectorAll('button, select, [tabindex="0"]')).filter(node => !node.disabled && node.tabIndex !== -1)
      const first = controls[0]
      const last = controls[controls.length - 1]
      if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) { event.preventDefault(); (event.shiftKey ? last : first).focus() }
    }
  }
}
</script>
