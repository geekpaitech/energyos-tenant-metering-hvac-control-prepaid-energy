<template>
  <div class="ac-stats-panel" style="cursor: pointer;" @click="handlePanelClick">
    <div class="panel-header">
      <div class="header-left">
        <div class="icon-box">
          <img class="icon-img" :src="acIcons.run" alt="空调运行统计" />
        </div>
        <div class="title-box">
          <h3>空调运行统计</h3>
          <p>实时模式分布</p>
        </div>
      </div>
      <el-button size="mini" class="remote-btn" @click="$emit('open-remote')">
        <img class="remote-icon-img" src="../image/yk.png" alt="" />
        <span>遥控</span>
      </el-button>
    </div>

    <div class="panel-body" v-loading="loading">
      <!-- Stats Grid -->
      <div class="stats-grid">
        <div v-for="stat in stats" :key="stat.label" class="stat-item">
          <div :class="['stat-icon', stat.bgColor]">
            <img class="stat-icon-img" :src="getStatIcon(stat.label)" alt="" />
          </div>
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
          <div :class="['stat-trend', stat.trend >= 0 ? 'up' : 'down']">
            <i :class="stat.trend >= 0 ? 'el-icon-top' : 'el-icon-bottom'"></i>
            {{ Math.abs(stat.trend) }}%
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div ref="chartRef" class="chart-container"></div>

      <!-- Temperature Info -->
      <div class="temp-info">
        <div class="temp-item">
          <i class="el-icon-thermometer"></i>
          <span class="temp-label">平均室温</span>
        </div>
        <div class="temp-value-box">
          <span class="temp-value">{{ avgRoomTemp !== null ? `${avgRoomTemp.toFixed(1)}°C` : '--' }}</span>
          <el-tag size="mini" :type="tempTag.type">{{ tempTag.label }}</el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { mapGetters, mapState } from 'vuex'
import { pageAirInfo, isDemoManager } from '@/api/newDashboard'

export default {
  name: 'ACStatsPanel',
  data () {
    return {
      chart: null,
      loading: false,
      avgRoomTemp: null,
      tempTag: { type: 'info', label: '-' },
      stats: [
        { label: '运行中', value: 428, icon: 'el-icon-wind-power', bgColor: 'bg-emerald', trend: 12 },
        { label: '待机', value: 156, icon: 'el-icon-s-open', bgColor: 'bg-slate', trend: -5 },
        { label: '总能耗', value: '2,847', icon: 'el-icon-lightning', bgColor: 'bg-sky', trend: 8.5 }
      ]
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    ...mapState('enumData', ['operationMode']),
    acIcons () {
      return {
        standby: require('@/assets/ac/standby.png'),
        offline: require('@/assets/ac/offline.png'),
        speed: require('@/assets/ac/speed.png'),
        run: require('@/assets/ac/run.png'),
        refrigeration: require('@/assets/ac/refrigeration.png')
      }
    }
  },
  mounted () {
    this.initChart()
    this.fetchStats()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.handleResize)
    if (this.chart) {
      this.chart.dispose()
    }
  },
  watch: {
    currentManagerId () {
      this.fetchStats()
    }
  },
  methods: {
    getStatIcon (label) {
      const key = String(label || '').trim()
      if (key === '运行中') return this.acIcons.run
      if (key === '待机') return this.acIcons.standby
      if (key === '离线') return this.acIcons.offline
      return this.acIcons.run
    },
    getNumber (value) {
      const n = Number(value)
      return Number.isFinite(n) ? n : null
    },
    normalizeMode (mode) {
      const n = this.getNumber(mode)
      if (n === null) return 'other'
      if (n === 0 || n === 1 || n === 2 || n === 4 || n === 8) return n
      return 'other'
    },
    getModeOptions () {
      if (Array.isArray(this.operationMode) && this.operationMode.length) return this.operationMode
      return [
        { value: 0, label: '自动' },
        { value: 1, label: '制热' },
        { value: 2, label: '制冷' },
        { value: 4, label: '送风' },
        { value: 8, label: '除湿' }
      ]
    },
    getModeLabel (mode) {
      if (mode === 'other') return '其他'
      const options = this.getModeOptions()
      const hit = options.find(o => o.value == mode)
      return hit ? hit.label : '其他'
    },
    getModeColor (mode) {
      if (mode === 'other') return '#64748B'
      const map = {
        1: '#F56C6C',
        2: '#409EFF',
        8: '#E6A23C',
        0: '#909399',
        4: '#94A3B8'
      }
      return map[mode] || '#909399'
    },
    classifyTemp (avgTemp) {
      const t = this.getNumber(avgTemp)
      if (t === null) return { type: 'info', label: '-' }
      if (t >= 22 && t <= 26) return { type: 'success', label: '舒适' }
      if (t < 22) return { type: 'info', label: '偏冷' }
      return { type: 'warning', label: '偏热' }
    },
    async fetchStats () {
      if (!this.currentManagerId) return

      this.loading = true
      try {
        let list = []
        if (isDemoManager(this.currentManagerId)) {
          list = [
            { powerStatus: 1, operationMode: 2, roomTemperature: 25.2, state: 0 },
            { powerStatus: 1, operationMode: 2, roomTemperature: 24.6, state: 0 },
            { powerStatus: 1, operationMode: 8, roomTemperature: 23.4, state: 0 },
            { powerStatus: 0, operationMode: 1, roomTemperature: 22.8, state: 0 },
            { powerStatus: 0, operationMode: 0, roomTemperature: 26.1, state: 0 },
            { powerStatus: 1, operationMode: 4, roomTemperature: 25.9, state: 0 },
            { powerStatus: 0, operationMode: 2, roomTemperature: 24.1, state: 0 },
            { powerStatus: 0, operationMode: 1, roomTemperature: 23.8, state: 0 },
            { powerStatus: 1, operationMode: 2, roomTemperature: 25.0, state: 0 },
            { powerStatus: 0, operationMode: 8, roomTemperature: 24.2, state: 0 },
            { powerStatus: 0, operationMode: 2, roomTemperature: 24.8, state: 1, faultCode: 'LOST' }
          ]
        } else {
          const query = {
            managerId: this.currentManagerId,
            page: {
              current: 1,
              size: 200,
              orders: [{ asc: false, column: 'createTime' }]
            }
          }
          const res = await pageAirInfo(query)
          list = (res && res.code === 200 && res.data && res.data.dataList) ? res.data.dataList : []
        }

        const isOffline = (item) => (item && (item.state === 1 || item.faultCode === 'LOST'))
        const isFault = (item) => (item && !isOffline(item) && item.faultCode && item.faultCode !== 'LOST')

        const offlineList = list.filter(i => isOffline(i))
        const faultList = list.filter(i => isFault(i))
        const runningList = list.filter(i => i && !isOffline(i) && !isFault(i) && i.powerStatus === 1)
        const standbyList = list.filter(i => i && !isOffline(i) && !isFault(i) && i.powerStatus !== 1)

        const tempCandidates = runningList.length
          ? runningList
          : (standbyList.length ? standbyList : list.filter(i => i && !isOffline(i)))
        const tempValues = tempCandidates
          .map(i => (i ? this.getNumber(i.roomTemperature) : null))
          .filter(v => v !== null)
        const avgTemp = tempValues.length
          ? tempValues.reduce((sum, v) => sum + v, 0) / tempValues.length
          : null
        this.avgRoomTemp = avgTemp
        this.tempTag = this.classifyTemp(avgTemp)

        this.stats = [
          { label: '运行中', value: runningList.length, icon: 'el-icon-wind-power', bgColor: 'bg-emerald', trend: 0 },
          { label: '待机', value: standbyList.length, icon: 'el-icon-s-open', bgColor: 'bg-slate', trend: 0 },
          { label: '离线', value: offlineList.length, icon: 'el-icon-close-notification', bgColor: 'bg-sky', trend: 0 }
        ]

        const modeCount = new Map()
        const modeSource = list.filter(i => i && !isOffline(i))
        for (const item of modeSource) {
          const key = this.normalizeMode(item.operationMode)
          modeCount.set(key, (modeCount.get(key) || 0) + 1)
        }

        const options = this.getModeOptions()
        const orderedModes = options.map(o => o.value).concat('other')
        const seriesData = orderedModes
          .map(mode => ({
            name: this.getModeLabel(mode),
            value: modeCount.get(mode) || 0,
            itemStyle: { color: this.getModeColor(mode) }
          }))
          .filter(i => i.value > 0)

        this.updateChart(seriesData)
      } catch (e) {
        this.stats = [
          { label: '运行中', value: 0, icon: 'el-icon-wind-power', bgColor: 'bg-emerald', trend: 0 },
          { label: '待机', value: 0, icon: 'el-icon-s-open', bgColor: 'bg-slate', trend: 0 },
          { label: '离线', value: 0, icon: 'el-icon-close-notification', bgColor: 'bg-sky', trend: 0 }
        ]
        this.avgRoomTemp = null
        this.tempTag = { type: 'info', label: '-' }
        this.updateChart([])
      } finally {
        this.loading = false
      }
    },
    initChart () {
      this.chart = echarts.init(this.$refs.chartRef)
      this.updateChart([])

      this.chart.on('click', (params) => {
        if (params.componentType === 'series') {
          this.$router.push('/device/conditioning')
        }
      })
    },
    updateChart (data) {
      if (!this.chart) return

      const hasData = Array.isArray(data) && data.some(d => d && d.value > 0)
      const option = {
        tooltip: hasData
          ? {
            trigger: 'item',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#E2E8F0',
            textStyle: { color: '#1E293B', fontSize: 11 },
            formatter: '{b}: {c}台 ({d}%)'
          }
          : { show: false },
        graphic: hasData
          ? []
          : [
            {
              type: 'text',
              left: 'center',
              top: 'middle',
              style: {
                text: '暂无数据',
                fill: '#94A3B8',
                fontSize: 12,
                fontWeight: 500
              }
            }
          ],
        series: hasData
          ? [
            {
              type: 'pie',
              radius: ['50%', '75%'],
              center: ['50%', '50%'],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 4,
                borderColor: '#fff',
                borderWidth: 2
              },
              label: {
                show: true,
                position: 'outside',
                formatter: '{b}\n{c}台',
                fontSize: 10,
                color: '#64748B'
              },
              labelLine: {
                show: true,
                length: 8,
                length2: 5
              },
              data
            }
          ]
          : []
      }
      this.chart.setOption(option, true)
    },
    handleResize () {
      this.chart && this.chart.resize()
    },
    handlePanelClick (e) {
      if (e.target.closest('.remote-btn')) return
      this.$router.push('/device/conditioning')
    }
  }
}
</script>

<style lang="scss" scoped>
.ac-stats-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #F1F5F9;

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .icon-box {
    width: 32px;
    height: 32px;
    background: #E0F2FE;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;

    .icon-img {
      width: 18px;
      height: 18px;
      object-fit: contain;
      display: block;
    }
  }

  .title-box {
    h3 {
      font-size: 13px;
      font-weight: 600;
      color: #1E293B;
      margin: 0;
    }

    p {
      font-size: 10px;
      color: #94A3B8;
      margin: 2px 0 0;
    }
  }

  ::v-deep .remote-btn {
    white-space: nowrap;
  }

  ::v-deep .remote-btn > span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .remote-icon-img {
    width: 14px;
    height: 14px;
    object-fit: contain;
    display: block;
  }
}

.panel-body {
  flex: 1;
  overflow: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.stat-item {
  text-align: center;
  padding: 10px 6px;
  background: #F8FAFC;
  border-radius: 8px;

  .stat-icon {
    width: 24px;
    height: 24px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 6px;

    .stat-icon-img {
      width: 14px;
      height: 14px;
      object-fit: contain;
      display: block;
    }

    &.bg-emerald { background: #D1FAE5; }
    &.bg-slate { background: #F1F5F9; }
    &.bg-sky { background: #E0F2FE; }
  }

  .stat-value {
    font-size: 16px;
    font-weight: 700;
    color: #1E293B;
    font-family: 'JetBrains Mono', monospace;
  }

  .stat-label {
    font-size: 9px;
    color: #64748B;
    display: block;
    margin-top: 2px;
  }

  .stat-trend {
    font-size: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    margin-top: 3px;

    &.up {
      color: #059669;
    }

    &.down {
      color: #E11D48;
    }

    i {
      font-size: 8px;
    }
  }
}

.chart-container {
  flex: 1;
  min-height: 150px;
}

.temp-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  margin-top: 10px;
  border-top: 1px solid #F1F5F9;

  .temp-item {
    display: flex;
    align-items: center;
    gap: 6px;

    i {
      font-size: 14px;
      color: #F87171;
    }

    .temp-label {
      font-size: 11px;
      color: #64748B;
    }
  }

  .temp-value-box {
    display: flex;
    align-items: center;
    gap: 8px;

    .temp-value {
      font-size: 13px;
      font-weight: 600;
      color: #1E293B;
    }
  }
}
</style>
