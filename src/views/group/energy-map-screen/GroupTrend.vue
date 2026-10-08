<template><div ref="chart" class="gmap-trend" role="img" :aria-label="'租户近7日用电：' + points.map(p => p.date + '，' + p.value + '千瓦时').join('；')" /></template>
<script>
import * as echarts from 'echarts'
export default {
  props: { points: { type: Array, required: true }, paused: Boolean },
  watch: { points () { this.draw() }, paused () { this.draw() } },
  mounted () { this.chart = echarts.init(this.$refs.chart); this.draw(); this.observer = new ResizeObserver(() => this.chart.resize()); this.observer.observe(this.$el) },
  beforeDestroy () { this.observer.disconnect(); this.chart.dispose() },
  methods: {
    draw () {
      if (!this.chart) return
      this.chart.setOption({ animation: !this.paused, grid: { left: 10, right: 20, top: 20, bottom: 10, containLabel: true }, tooltip: { trigger: 'axis', confine: true, backgroundColor: '#062238', borderColor: '#278cae', textStyle: { color: '#e6fbff' }, valueFormatter: v => v.toLocaleString('zh-CN') + ' kWh' }, xAxis: { type: 'category', boundaryGap: false, data: this.points.map(p => p.date), axisTick: { show: false }, axisLabel: { color: '#a2c5d6', fontSize: 12, hideOverlap: true }, axisLine: { lineStyle: { color: '#1c5270' } } }, yAxis: { type: 'value', min: 0, max: Math.ceil(Math.max(...this.points.map(p => p.value)) / 30000) * 30000, splitNumber: 4, axisLabel: { color: '#91b7cb', fontSize: 12, formatter: v => v >= 10000 ? v / 10000 + '万' : v }, splitLine: { lineStyle: { color: '#153e55', type: 'dashed' } } }, series: [{ name: '租户用电', type: 'line', smooth: 0.25, data: this.points.map(p => p.value), symbolSize: 6, itemStyle: { color: '#b7fff0', borderColor: '#22eccc', borderWidth: 2 }, lineStyle: { color: '#26e9ce', width: 2, shadowColor: '#12dcca', shadowBlur: 8 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(23,204,182,.32)' }, { offset: 1, color: 'rgba(23,204,182,0)' }]) } }] }, true)
    }
  }
}
</script>
