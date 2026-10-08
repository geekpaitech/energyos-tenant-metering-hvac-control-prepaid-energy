<template>
  <div class="nandu-ring" role="img" :aria-label="label">
    <div ref="chart" class="nandu-ring__chart" />
    <div class="nandu-ring__caption"><strong>{{ value }}</strong><span v-if="unit">{{ unit }}</span><small v-if="caption">{{ caption }}</small></div>
  </div>
</template>
<script>
import * as echarts from 'echarts'
export default {
  name: 'NanduRingChart',
  props: {
    segments: { type: Array, required: true },
    value: { type: String, required: true },
    unit: { type: String, default: '' },
    caption: { type: String, default: '' },
    label: { type: String, required: true },
    paused: { type: Boolean, default: false }
  },
  watch: {
    segments: { deep: true, handler () { this.renderChart() } },
    paused () { this.renderChart() }
  },
  mounted () {
    this.chart = echarts.init(this.$refs.chart)
    this.renderChart()
    this.resizeObserver = new ResizeObserver(() => this.chart && this.chart.resize())
    this.resizeObserver.observe(this.$refs.chart)
  },
  beforeDestroy () {
    if (this.resizeObserver) this.resizeObserver.disconnect()
    if (this.chart) this.chart.dispose()
  },
  methods: {
    renderChart () {
      if (!this.chart) return
      this.chart.setOption({
        animation: !this.paused,
        animationDuration: 900,
        series: [{
          type: 'pie',
          radius: ['69%', '91%'],
          center: ['50%', '50%'],
          startAngle: 90,
          silent: true,
          label: { show: false },
          labelLine: { show: false },
          itemStyle: { borderColor: '#072939', borderWidth: 1 },
          data: this.segments.map(segment => ({ value: segment.value, name: segment.name, itemStyle: { color: segment.color } }))
        }]
      }, true)
    }
  }
}
</script>
