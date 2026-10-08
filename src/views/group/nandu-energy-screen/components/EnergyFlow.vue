<template>
  <section class="nandu-flow" :class="{ 'nandu-flow--grid-only': !hasPv }" aria-label="本月能源构成，单位千瓦时">
    <h2 class="nandu-section-title">本月能源构成 <span class="nandu-flow__unit">单位：kWh</span></h2>
    <div ref="connections" class="nandu-flow__connections" aria-hidden="true" />
    <div class="nandu-flow__node nandu-flow__grid">
      <screen-icon name="transmission-tower" />
      <div><span>市电</span><strong>{{ number(energy.gridImport) }}</strong></div>
    </div>
    <span v-if="hasPv" class="nandu-flow__plus" aria-hidden="true">+</span>
    <div v-if="hasPv" class="nandu-flow__node nandu-flow__solar">
      <screen-icon name="solar-panel" />
      <div><span>光伏自用</span><strong>{{ number(photovoltaic.selfUse) }}</strong></div>
    </div>
    <div class="nandu-flow__total"><span>项目用电</span><strong>{{ number(energy.total) }}</strong></div>
    <div class="nandu-flow__node nandu-flow__tenant">
      <screen-icon name="account-group" />
      <div><span>租户</span><strong>{{ number(energy.tenant) }} <small>kWh</small></strong></div>
    </div>
    <div class="nandu-flow__node nandu-flow__common">
      <screen-icon name="office-building" />
      <div><span>公区</span><strong>{{ number(energy.common) }} <small>kWh</small></strong></div>
    </div>
  </section>
</template>

<script>
import * as echarts from 'echarts'
import ScreenIcon from './ScreenIcon.vue'
import { formatNumber } from '../data'

export default {
  name: 'NanduEnergyFlow',
  components: { ScreenIcon },
  props: {
    hasPv: { type: Boolean, default: true },
    energy: { type: Object, required: true },
    photovoltaic: { type: Object, required: true },
    paused: { type: Boolean, default: false }
  },
  watch: { paused () { this.renderConnections() } },
  mounted () {
    this.chart = echarts.init(this.$refs.connections, null, { renderer: 'canvas' })
    this.renderConnections()
  },
  beforeDestroy () { if (this.chart) this.chart.dispose() },
  methods: {
    number: formatNumber,
    renderConnections () {
      if (!this.chart) return
      this.chart.setOption({
        animation: !this.paused,
        grid: { top: 0, left: 0, right: 0, bottom: 0 },
        xAxis: { show: false, type: 'value', min: 0, max: 940 },
        yAxis: { show: false, type: 'value', min: 0, max: 150, inverse: true },
        series: [{
          type: 'lines',
          coordinateSystem: 'cartesian2d',
          polyline: true,
          silent: true,
          lineStyle: { color: '#33caff', width: 2.5, opacity: 0.95, shadowBlur: 8, shadowColor: '#009dff' },
          effect: { show: !this.paused, period: 3.8, trailLength: 0.25, symbol: 'circle', symbolSize: 4, color: '#caffff' },
          data: [
            { coords: [[392, 91], [419, 91]] },
            { coords: [[645, 91], [668, 91], [680, 83], [688, 59], [701, 54]] },
            { coords: [[645, 91], [668, 91], [680, 99], [688, 119], [701, 122]] }
          ]
        }]
      }, true)
    }
  }
}
</script>
