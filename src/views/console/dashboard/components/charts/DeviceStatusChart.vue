<template>
  <div class="device-status-chart" style="cursor: pointer;" @click="handleChartClick">
    <div class="chart-header">
      <div class="header-left">
        <div class="icon-box">
          <img class="icon-img" :src="require('../../image/equipment.png')" alt="设备状态监控" />
        </div>
        <div class="title-box">
          <h3>设备状态监控</h3>
          <p>实时在线状态</p>
        </div>
      </div>
      <el-tag size="mini" type="success">{{ onlineRateText }} 在线</el-tag>
    </div>

    <div class="status-cards">
      <div class="status-card private">
        <div class="status-meta">
          <span class="dot"></span>
          <span class="label">专用表</span>
        </div>
        <div class="status-value">
          <span class="num">{{ stats.private }}</span>
          <span class="unit">台</span>
        </div>
        <div class="status-sub">{{ percentText(stats.private) }}</div>
      </div>
      <div class="status-card public">
        <div class="status-meta">
          <span class="dot"></span>
          <span class="label">公用表</span>
        </div>
        <div class="status-value">
          <span class="num">{{ stats.public }}</span>
          <span class="unit">台</span>
        </div>
        <div class="status-sub">{{ percentText(stats.public) }}</div>
      </div>
      <div class="status-card air">
        <div class="status-meta">
          <span class="dot"></span>
          <span class="label">空调表</span>
        </div>
        <div class="status-value">
          <span class="num">{{ stats.air }}</span>
          <span class="unit">台</span>
        </div>
        <div class="status-sub">{{ percentText(stats.air) }}</div>
      </div>
    </div>

    <div class="chart-wrap">
      <div ref="chartRef" class="chart-container" v-show="!shouldShowEmpty"></div>
      <div class="chart-center" v-show="!shouldShowEmpty">
        <div class="center-title">在线率</div>
        <div class="center-value">{{ onlineRateText }}</div>
        <div class="center-sub">总设备 {{ totalDevices }} 台</div>
      </div>
      <div v-show="shouldShowEmpty" class="chart-empty">
        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 3v18h18" />
          <path d="M7 14l3-3 3 3 4-6" />
        </svg>
        <span>暂无数据</span>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { mapGetters } from 'vuex'
import { getMeterOverview, isDemoManager } from '@/api/newDashboard'

export default {
  name: 'DeviceStatusChart',
  data () {
    return {
      chart: null,
      loading: false,
      stats: {
        private: 0,
        public: 0,
        air: 0,
        online: 0,
        offline: 0
      }
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    totalDevices () {
      const byType = (this.stats.private || 0) + (this.stats.public || 0) + (this.stats.air || 0)
      if (byType > 0) return byType
      return (this.stats.online || 0) + (this.stats.offline || 0)
    },
    onlineRate () {
      if (!this.totalDevices) return 0
      return (this.stats.online || 0) / this.totalDevices
    },
    onlineRateText () {
      return (this.onlineRate * 100).toFixed(1) + '%'
    },
    shouldShowEmpty () {
      return !this.loading && this.totalDevices === 0
    }
  },
  watch: {
    currentManagerId: {
      handler () {
        this.fetchData()
      },
      immediate: true
    }
  },
  mounted () {
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.handleResize)
    if (this.chart) {
      this.chart.dispose()
    }
  },
  methods: {
    emitMetrics () {
      this.$emit('metrics', {
        onlineRate: this.onlineRate,
        totalDevices: this.totalDevices,
        stats: { ...this.stats }
      })
    },
    percentText (value) {
      if (!this.totalDevices) return '0.0%'
      return ((value || 0) / this.totalDevices * 100).toFixed(1) + '%'
    },
    ensureChart () {
      if (this.chart) return
      const el = this.$refs.chartRef
      if (!el) return
      this.chart = echarts.init(el)

      this.chart.on('click', (params) => {
        if (params.componentType === 'series') {
          this.$router.push('/device/electricity')
        }
      })
    },
    renderChart () {
      if (this.shouldShowEmpty) {
        if (this.chart) this.chart.clear()
        return
      }

      this.ensureChart()
      if (!this.chart) return
      const totalByType = (this.stats.private || 0) + (this.stats.public || 0) + (this.stats.air || 0)
      const typeData = [
        { value: this.stats.private, name: '专用表', itemStyle: { color: '#14B8A6' } },
        { value: this.stats.public, name: '公用表', itemStyle: { color: '#94A3B8' } },
        { value: this.stats.air, name: '空调表', itemStyle: { color: '#F59E0B' } }
      ]
      const statusData = [
        { value: this.stats.online, name: '在线', itemStyle: { color: '#14B8A6' } },
        { value: this.stats.offline, name: '离线', itemStyle: { color: '#94A3B8' } }
      ]
      const option = {
        tooltip: {
          trigger: 'item',
          confine: true,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#E2E8F0',
          textStyle: { color: '#1E293B', fontSize: 11 },
          formatter: '{b}: {c}台 ({d}%)',
          position (pos, params, dom, rect, size) {
            const viewWidth = size.viewSize[0]
            const viewHeight = size.viewSize[1]
            const contentWidth = size.contentSize[0]
            const contentHeight = size.contentSize[1]

            const margin = 8
            const reserveBottom = 40

            let x = pos[0] + margin
            let y = pos[1] - contentHeight / 2

            const maxX = Math.max(margin, viewWidth - contentWidth - margin)
            const maxY = Math.max(margin, viewHeight - contentHeight - reserveBottom)

            x = Math.min(Math.max(margin, x), maxX)
            y = Math.min(Math.max(margin, y), maxY)

            return [x, y]
          }
        },
        series: [
          {
            type: 'pie',
            radius: ['55%', '80%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 6,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 12,
                fontWeight: 'bold',
                formatter: '{b}\n{d}%'
              }
            },
            data: totalByType > 0 ? typeData : statusData
          }
        ]
      }

      this.chart.setOption(option)
    },
    async fetchData () {
      if (!this.currentManagerId) {
        this.stats = { private: 0, public: 0, air: 0, online: 0, offline: 0 }
        this.renderChart()
        this.emitMetrics()
        return
      }

      this.loading = true
      try {
        if (isDemoManager(this.currentManagerId)) {
          this.stats = { private: 780, public: 120, air: 40, online: 928, offline: 12 }
          await this.$nextTick()
          this.renderChart()
          this.emitMetrics()
          return
        }
        const res = await getMeterOverview({ managerId: this.currentManagerId }).catch(() => ({}))
        const d = res && res.code === 200 ? (res.data || {}) : {}

        const toNumber = (val) => {
          const n = Number(val)
          return Number.isFinite(n) ? n : 0
        }
        const privateMeter = toNumber(d.privateMeter)
        const publicMeter = toNumber(d.publicMeter)
        const airMeter = toNumber(d.airMeter)
        const totalByType = privateMeter + publicMeter + airMeter

        const online = toNumber(d.onlineMeter)
        const offlineMeterRaw = d.offlineMeter
        const hasOfflineMeter = offlineMeterRaw !== null && offlineMeterRaw !== undefined && offlineMeterRaw !== ''
        const offline = hasOfflineMeter
          ? toNumber(offlineMeterRaw)
          : Math.max(totalByType - online, 0)

        this.stats = {
          private: privateMeter,
          public: publicMeter,
          air: airMeter,
          online,
          offline
        }

        await this.$nextTick()
        this.renderChart()
        this.emitMetrics()
      } catch (e) {
        this.stats = { private: 0, public: 0, air: 0, online: 0, offline: 0 }
        this.renderChart()
        this.emitMetrics()
      } finally {
        this.loading = false
      }
    },
    handleResize () {
      this.chart && this.chart.resize()
    },
    handleChartClick () {
      this.$router.push('/device/electricity')
    }
  }
}
</script>

<style lang="scss" scoped>
.device-status-chart {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-header {
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
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid rgba(226, 232, 240, 0.9);

    i {
      font-size: 16px;
      color: #059669;
    }

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
}

.status-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 12px 16px;
}

.status-card {
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.75);
  padding: 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.status-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .label {
    font-size: 11px;
    color: #64748B;
    font-weight: 600;
    letter-spacing: -0.2px;
  }
}

.status-value {
  display: flex;
  align-items: baseline;
  gap: 4px;

  .num {
    font-size: 18px;
    font-weight: 800;
    color: #0F172A;
    font-family: 'JetBrains Mono', monospace;
    line-height: 22px;
  }

  .unit {
    font-size: 10px;
    color: #94A3B8;
  }
}

.status-sub {
  font-size: 10px;
  color: #94A3B8;
}

.status-card.private {
  .status-meta .dot { background: #14B8A6; }
  .status-sub { color: rgba(20, 184, 166, 0.9); }
}

.status-card.public {
  .status-meta .dot { background: #94A3B8; }
}

.status-card.air {
  .status-meta .dot { background: #F59E0B; }
  .status-sub { color: rgba(245, 158, 11, 0.95); }
}

.chart-wrap {
  flex: 1;
  min-height: 0;
  position: relative;
  padding: 6px 8px 10px;
}

.chart-container {
  height: 100%;
  min-height: 150px;
}

.chart-center {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.center-title {
  font-size: 10px;
  color: #94A3B8;
  letter-spacing: 0.2px;
}

.center-value {
  margin-top: 2px;
  font-size: 22px;
  font-weight: 900;
  color: #0F172A;
  font-family: 'JetBrains Mono', monospace;
  line-height: 26px;
}

.center-sub {
  margin-top: 2px;
  font-size: 10px;
  color: #64748B;
}

.chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #94A3B8;
  background: rgba(248, 250, 252, 0.7);
  border: 1px dashed rgba(226, 232, 240, 1);
  border-radius: 10px;

  svg {
    opacity: 0.9;
  }

  span {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.2px;
  }
}
</style>
