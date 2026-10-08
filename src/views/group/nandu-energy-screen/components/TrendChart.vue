<template>
  <div class="nandu-trend">
    <div ref="chart" class="nandu-trend__canvas" role="img" :aria-label="summary" />
    <ol class="nandu-visually-hidden">
      <li v-for="point in points" :key="point.date">{{ point.date }}：{{ point.value }} 千瓦时</li>
    </ol>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'NanduTrendChart',
  props: {
    points: { type: Array, required: true },
    reducedMotion: { type: Boolean, default: false }
  },
  computed: {
    summary () { return `租户近7日用电，单位千瓦时。${this.points.map(p => `${p.date} ${p.value}`).join('，')}` }
  },
  watch: {
    points: { deep: true, handler () { this.renderChart() } },
    reducedMotion () { this.renderChart() }
  },
  mounted () {
    this.chart = echarts.init(this.$refs.chart, null, { renderer: 'canvas' })
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
        animation: !this.reducedMotion,
        animationDuration: 900,
        animationEasing: 'cubicOut',
        textStyle: { fontFamily: 'Arial, Microsoft YaHei, sans-serif' },
        grid: { left: 12, right: 24, top: 27, bottom: 12, containLabel: true },
        tooltip: {
          trigger: 'axis',
          confine: true,
          backgroundColor: 'rgba(3, 26, 45, 0.96)',
          borderColor: '#31c7f2',
          textStyle: { color: '#eafaff', fontSize: 16 },
          formatter: params => `${params[0].axisValue}<br/>租户用电 ${Number(params[0].value).toLocaleString('zh-CN')} kWh`,
          axisPointer: { type: 'line', lineStyle: { color: '#66d6ed', type: 'dashed' } }
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: this.points.map(p => p.date),
          axisLine: { lineStyle: { color: 'rgba(145, 189, 210, 0.6)' } },
          axisTick: { show: false },
          axisLabel: { color: '#d7e9fa', fontSize: 15, margin: 15 }
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: Math.max(20000, Math.ceil(Math.max(...this.points.map(p => p.value)) / 15000) * 20000),
          axisLabel: { color: '#d7e9fa', fontSize: 15, formatter: value => value.toLocaleString('zh-CN') },
          splitLine: { lineStyle: { color: 'rgba(128, 180, 207, 0.19)', type: 'dashed' } },
          axisLine: { show: true, lineStyle: { color: 'rgba(145, 189, 210, 0.5)' } }
        },
        series: [{
          type: 'line',
          smooth: 0.3,
          data: this.points.map((p, index) => ({ value: p.value, label: index === 0 ? { position: 'bottom', align: 'left' } : (index === this.points.length - 1 ? { position: 'bottom', align: 'right' } : {}) })),
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: { width: 3, color: '#38c9ff', shadowBlur: 12, shadowColor: '#14c7ff' },
          itemStyle: { color: '#edffff', borderColor: '#1ad6ff', borderWidth: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(18, 131, 227, 0.57)' },
              { offset: 1, color: 'rgba(18, 131, 227, 0.015)' }
            ])
          },
          label: { show: true, position: 'top', color: '#eafaff', fontSize: 12, fontWeight: 'bold', formatter: p => Number(p.value).toLocaleString('zh-CN') },
          emphasis: { scale: true }
        }]
      }, true)
    }
  }
}
</script>

<style scoped>
.nandu-trend, .nandu-trend__canvas { width: 100%; height: 100%; }
.nandu-visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
</style>
