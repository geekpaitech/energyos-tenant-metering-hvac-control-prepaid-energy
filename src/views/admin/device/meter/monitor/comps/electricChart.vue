<template>
  <div v-loading="loading" class="admin-electric-chart">
    <div ref="chartRef" class="chart-container" />
  </div>
</template>

<script>
export default {
  name: 'AdminElectricChart',
  data () {
    return {
      loading: false,
      chartInstance: null
    }
  },
  mounted () {
    this.initChart()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.handleResize)
    this.chartInstance?.dispose()
  },
  methods: {
    initChart () {
      if (!this.$refs.chartRef || !this.$echarts) return
      this.chartInstance = this.$echarts.init(this.$refs.chartRef)
    },
    handleResize () {
      this.chartInstance?.resize()
    },
    getElectricData (seriesData, timeArr) {
      this.loading = true
      if (!this.chartInstance) this.initChart()
      const option = {
        tooltip: { trigger: 'axis' },
        grid: { top: 30, left: 50, right: 30, bottom: 30, containLabel: true },
        xAxis: {
          type: 'category',
          data: timeArr,
          axisLabel: { interval: Math.max(0, Math.floor(timeArr.length / 6)) }
        },
        yAxis: { type: 'value' },
        series: seriesData
      }
      this.chartInstance?.setOption(option, true)
      this.$nextTick(() => { this.loading = false })
    }
  }
}
</script>

<style scoped>
.admin-electric-chart {
  width: 100%;
  min-height: 320px;
  margin-bottom: 12px;
}
.chart-container {
  width: 100%;
  height: 40vh;
  min-height: 280px;
}
</style>
