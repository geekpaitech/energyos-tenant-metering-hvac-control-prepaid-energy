<template>
  <div class="nandu-landmarks">
    <div ref="connections" class="nandu-landmarks__connections" aria-hidden="true" />
    <button
      v-for="item in landmarks"
      :key="item.id"
      type="button"
      class="nandu-landmark"
      :style="{ left: item.labelX + '%', top: item.labelY + '%' }"
      :aria-label="'查看' + item.label + '场景说明'"
      @click="$emit('select', item)"
    >{{ item.label }}</button>
  </div>
</template>

<script>
import * as echarts from 'echarts'
export default {
  name: 'NanduSceneLandmarks',
  props: {
    landmarks: { type: Array, required: true },
    paused: { type: Boolean, default: false },
    sceneWidth: { type: Number, default: 1920 },
    sceneHeight: { type: Number, default: 1080 }
  },
  watch: {
    paused () { this.renderConnections() },
    landmarks: { deep: true, handler () { this.$nextTick(() => { if (this.chart) this.chart.resize(); this.renderConnections() }) } }
  },
  mounted () {
    this.chart = echarts.init(this.$refs.connections, null, { renderer: 'canvas' })
    this.renderConnections()
    this.observer = new ResizeObserver(() => this.chart && this.chart.resize())
    this.observer.observe(this.$el)
  },
  beforeDestroy () { if (this.observer) this.observer.disconnect(); if (this.chart) this.chart.dispose() },
  methods: {
    renderConnections () {
      if (!this.chart) return
      this.chart.setOption({
        animation: !this.paused,
        grid: { top: 0, left: 0, bottom: 0, right: 0 },
        xAxis: { show: false, min: 0, max: 100, type: 'value' },
        yAxis: { show: false, min: 0, max: 100, inverse: true, type: 'value' },
        series: [
          {
            type: 'lines',
            coordinateSystem: 'cartesian2d',
            polyline: true,
            silent: true,
            lineStyle: { color: '#45dfff', opacity: 0.95, width: 1.5, shadowBlur: 8, shadowColor: '#17cfff' },
            data: this.landmarks.map(item => ({ coords: item.leader }))
          },
          {
            type: this.paused ? 'scatter' : 'effectScatter',
            coordinateSystem: 'cartesian2d',
            silent: true,
            symbolSize: 11,
            rippleEffect: { scale: 2.6, brushType: 'stroke', period: 4.5 },
            itemStyle: { color: '#d5ffff', borderColor: '#34daff', borderWidth: 2, shadowBlur: 18, shadowColor: '#25d7ff' },
            data: this.landmarks.map(item => [item.x, item.y])
          }
        ]
      }, true)
    }
  }
}
</script>
