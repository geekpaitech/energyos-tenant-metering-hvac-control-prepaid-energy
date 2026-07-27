<template>
  <div ref="chart" class="energy-chart" role="img" :aria-label="ariaLabel" />
</template>

<script>
export default {
  name: 'EnergyEChartHost',
  props: {
    option: { type: Object, required: true },
    ariaLabel: { type: String, default: '数据图表' }
  },
  data () {
    return { chart: null }
  },
  watch: {
    option: {
      deep: true,
      handler () { this.renderChart() }
    }
  },
  mounted () {
    this.chart = this.$echarts.init(this.$refs.chart)
    this.renderChart()
    window.addEventListener('resize', this.resize)
    if (typeof ResizeObserver !== 'undefined') {
      this._observer = new ResizeObserver(this.resize)
      this._observer.observe(this.$refs.chart)
    }
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.resize)
    if (this._observer) this._observer.disconnect()
    if (this.chart) {
      this.chart.dispose()
      this.chart = null
    }
  },
  methods: {
    renderChart () {
      if (!this.chart || !this.option) return
      this.chart.setOption(this.option, true)
    },
    resize () {
      if (this.chart) this.chart.resize()
    }
  }
}
</script>
