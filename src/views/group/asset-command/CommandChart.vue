<template><div ref="chart" class="command-chart" role="img" :aria-label="label" /></template>
<script>
import * as echarts from 'echarts'
export default {
  props: { series: { type: Array, required: true }, labels: { type: Array, required: true }, label: { type: String, default: '业务趋势' }, unit: { type: String, default: '' }, small: Boolean },
  watch: { series: { deep: true, handler () { this.draw() } }, labels () { this.draw() } },
  mounted () { this.observer = new ResizeObserver(() => this.resizeChart()); this.observer.observe(this.$el); this.resizeChart() },
  beforeDestroy () { this.observer.disconnect(); if (this.chart) this.chart.dispose() },
  methods: {
    resizeChart () {
      if (!this.$el.clientWidth || !this.$el.clientHeight) return
      if (!this.chart) { this.chart = echarts.init(this.$refs.chart, null, { renderer: 'svg' }); this.draw() } else this.chart.resize()
    },
    draw () {
      if (!this.chart) return
      this.chart.setOption({ animation: false, color: this.series.map(s => s.color), grid: { top: this.small ? 8 : 24, bottom: this.small ? 22 : 48, left: this.small ? 0 : 48, right: 16 }, legend: { show: !this.small, bottom: 0, textStyle: { color: '#acc3d7', fontSize: 12 }, icon: 'roundRect', itemHeight: 3, itemWidth: 16 }, tooltip: { trigger: 'axis', confine: true, backgroundColor: '#102b43', borderColor: '#41667d', textStyle: { color: '#e7f4ff' }, valueFormatter: value => Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 3 }) + ' ' + this.unit }, xAxis: { type: 'category', boundaryGap: false, data: this.labels, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#8fabbe', fontSize: this.small ? 10 : 12, hideOverlap: true, interval: Math.max(0, Math.floor(this.labels.length / 5) - 1) } }, yAxis: { type: 'value', min: 0, splitNumber: 3, axisLabel: { show: !this.small, color: '#8fabbe', fontSize: 12 }, splitLine: { lineStyle: { color: '#8bb4cf16' } } }, series: this.series.map(s => ({ name: s.name, type: 'line', data: s.values, smooth: 0.22, symbol: 'none', lineStyle: { width: 2, type: s.dashed ? 'dashed' : 'solid' }, areaStyle: s.dashed ? undefined : { opacity: 0.08 } })) }, true)
    }
  }
}
</script>
