<template>
  <div v-loading="loading" class="monitor" :style="nameData.length > 1 ? '' : 'margin-top:20px'">
    <div ref="chartRef" class="chart-container" :style="{ height }" />
  </div>
</template>

<script>
import moment from 'moment'
import { MeterChargeType } from '../monitorEnums'
import { formatLogicPayTypeLabel, formatSwitchStatusLabel } from '../../utils'

export default {
  name: 'AdminBusinessChart',
  data () {
    return {
      nameData: [],
      height: '120px',
      loading: false,
      chartInstance: null,
      theme: 'light',
      WaterValueStatusRead: {},
      MeterChargeType
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
    getOptionData (data, lengthData, timeDate) {
      this.loading = true
      this.nameData = lengthData
      const that = this
      this.height = Math.max(lengthData.length * 60, 120) + 'px'
      const fontColor = '#666666'
      const option = {
        legend: { show: false },
        tooltip: {
          position: 'top',
          appendToBody: true,
          formatter (params) {
            const title = params.data[2]
            const item = params.data[3]
            const user = `<br/>操作人:${item.userId ? `${item.userPhone}（${item.userId}）` : '-'}<br/>`
            let str = ''
            if (title === '电表绑定类型修改') {
              str = '绑定类型:' + (item.bindType ? '专用表' : '公摊表')
            } else if (title === '电表充值') {
              const type = that.MeterChargeType.find(t => t.value === item.chargeType)
              str = '充值类型:' + (type ? type.label : '-') + '<br/>充值金额:' + (item.chargeMoney ?? '-') + '元'
            } else if (title === '电表启停') {
              str = '操作类型:' + (item.enableType ? '启用' : '停用')
            } else if (title === '电表付费模式修改') {
              str = '付费模式:' + formatLogicPayTypeLabel(item.logicPayType)
            } else if (title === '电表上下线') {
              str = '操作类型:' + (item.onOffType ? '上线' : '下线')
            } else if (title === '电表调价') {
              str = '方案名称:' + item.priceName + '<br/> 尖/峰/平/谷' + `${item.powerPeakPrice}/${item.powerTopPrice}/${item.powerFlatPrice}/${item.powerValleyPrice}`
            } else if (title === '电表分合闸') {
              str = '合闸状态:' + formatSwitchStatusLabel(item.switchStatus)
            } else if (title === '电表绑定') {
              str = '绑定名称:' + item.bindName + '<br/>绑定Id' + item.bindId
            }
            return `<div style="font-size:14px;">${params.data[0]}${user}${str}</div>`
          }
        },
        xAxis: {
          type: 'time',
          min: new Date(timeDate[0]).getTime(),
          max: new Date(timeDate[1]).getTime(),
          axisLabel: {
            formatter (params) {
              return moment(params).format('YYYY-MM-DD HH:mm:ss')
            }
          }
        },
        yAxis: {
          type: 'category',
          data: lengthData
        },
        grid: { top: 10, left: '1%', right: 70, bottom: 20, containLabel: true },
        series: {
          data,
          type: 'scatter',
          symbolSize: 10,
          itemStyle: {
            color (e) {
              if (e.data[2] === '电表上下线') {
                return e.data[3].onOffType ? '#47b881' : '#ee3d3d'
              }
              return e.data[4]
            }
          }
        }
      }
      this.$nextTick(() => {
        if (!this.chartInstance) this.initChart()
        this.chartInstance?.resize()
        this.chartInstance?.setOption(option, true)
        this.loading = false
      })
    }
  }
}
</script>

<style scoped>
.monitor { width: 100%; margin-bottom: 10px; }
.chart-container { width: 100%; min-height: 120px; }
</style>
