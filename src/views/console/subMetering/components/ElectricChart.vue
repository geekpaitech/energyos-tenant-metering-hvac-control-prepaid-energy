<template>
  <div class="electric-chart-wrapper">
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script>
export default {
  name: 'ElectricChart',

  props: {
    seriesData: {
      type: Array,
      default: () => []
    },
    xAxisData: {
      type: Array,
      default: () => []
    }
  },

  data () {
    return {
      chartInstance: null
    }
  },

  watch: {
    seriesData: {
      handler () {
        this.updateChart()
      },
      deep: true
    },
    xAxisData: {
      handler () {
        this.updateChart()
      },
      deep: true
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
      this.$nextTick(() => {
        if (this.$refs.chartRef) {
          this.chartInstance = this.$echarts.init(this.$refs.chartRef)
          this.updateChart()
        }
      })
    },

    updateChart () {
      if (!this.chartInstance) {
        this.initChart()
        return
      }

      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          show: true,
          top: 10,
          right: '4%',
          icon: 'circle',
          itemWidth: 10,
          itemHeight: 10
        },
        grid: {
          top: 50,
          left: 10,
          right: 30,
          bottom: 10,
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: this.xAxisData,
          axisTick: { show: false },
          axisLine: { show: false },
          axisLabel: {
            color: '#999',
            showMinLabel: true,
            showMaxLabel: true,
            interval: Math.floor(this.xAxisData.length / 5)
          }
        },
        yAxis: {
          type: 'value',
          axisTick: { show: false },
          axisLine: { show: false },
          axisLabel: { color: '#999' },
          splitLine: {
            show: true,
            lineStyle: {
              type: 'dashed',
              color: '#f0f0f0'
            }
          }
        },
        series: this.seriesData
      }

      this.chartInstance.setOption(option, true)
    },

    handleResize () {
      this.chartInstance?.resize()
    }
  }
}
</script>

<style lang="scss" scoped>
.electric-chart-wrapper {
  width: 100%;

  .chart-container {
    width: 100%;
    height: 400px;
  }
}
</style>
