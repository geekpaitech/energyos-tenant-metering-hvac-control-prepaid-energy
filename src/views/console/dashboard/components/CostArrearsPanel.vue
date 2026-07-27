<template>
  <div class="cost-arrears-panel">
    <div class="panel-header">
      <div class="header-left">
        <div class="icon-box">
          <i class="el-icon-money"></i>
        </div>
        <div class="title-box">
          <h3>费用与欠费</h3>
          <p>费用构成 · 欠费TOP</p>
        </div>
      </div>
    </div>

    <div class="panel-body" v-loading="loading">
      <div class="panel-split">
        <div class="split-left">
          <div class="donut-wrap">
            <div ref="chartRef" class="donut-chart" v-show="hasFeeData"></div>
            <div v-show="!hasFeeData" class="donut-empty">暂无数据</div>
            <div class="donut-center">
              <div class="center-label">总费用</div>
              <div class="center-value">{{ totalFeeText }}</div>
            </div>
          </div>

          <div class="fee-legend">
            <div v-for="item in feeLegend" :key="item.key" class="legend-item">
              <span class="dot" :style="{ background: item.color }"></span>
              <span class="name">{{ item.name }}</span>
              <span class="value">{{ item.valueText }}</span>
            </div>
          </div>
        </div>

        <div class="split-right">
          <div class="rank-header">
            <span class="rank-title">欠费排名</span>
            <span class="rank-total">合计 {{ totalArrearsText }}</span>
          </div>
          <div v-if="tenants.length" class="rank-list">
            <div v-for="(t, idx) in tenants" :key="t.id || t.name || idx" class="rank-item">
              <div class="rank-left">
                <span class="rank-index">{{ idx + 1 }}</span>
                <span class="rank-name" :title="t.name">{{ t.name }}</span>
              </div>
              <div class="rank-amount">{{ formatMoney(t.amount) }}</div>
            </div>
          </div>
          <div v-else class="rank-empty">暂无欠费数据</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { mapGetters } from 'vuex'
import { getTenantFeeComposition, getTenantStatusList, isDemoManager } from '@/api/newDashboard'

export default {
  name: 'CostArrearsPanel',
  data () {
    return {
      chart: null,
      loading: false,
      feeDto: null,
      tenants: []
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    hasFeeData () {
      if (!this.feeDto) return false
      const v = [
        this.feeDto.elecFee,
        this.feeDto.airFee,
        this.feeDto.waterFee,
        this.feeDto.otherFee
      ].map(x => Number(x)).filter(x => Number.isFinite(x))
      return v.length > 0 && v.some(x => x > 0)
    },
    totalFee () {
      if (!this.feeDto) return null
      const elecFee = Number(this.feeDto.elecFee)
      const airFee = Number(this.feeDto.airFee)
      const waterFee = Number(this.feeDto.waterFee)
      const otherFee = Number(this.feeDto.otherFee)
      const parts = [elecFee, airFee, waterFee, otherFee].map(x => (Number.isFinite(x) ? x : 0))
      return parts.reduce((sum, v) => sum + v, 0)
    },
    totalFeeText () {
      if (this.totalFee === null) return '--'
      return this.formatMoney(this.totalFee)
    },
    feeLegend () {
      const dto = this.feeDto || {}
      const items = [
        { key: 'elecFee', name: '电费', color: '#0EA5E9', value: dto.elecFee },
        { key: 'airFee', name: '空调费', color: '#14B8A6', value: dto.airFee },
        { key: 'waterFee', name: '水费', color: '#93C5FD', value: dto.waterFee },
        { key: 'otherFee', name: '其他', color: '#CBD5E1', value: dto.otherFee }
      ]
      return items.map(it => {
        const n = Number(it.value)
        const valueText = Number.isFinite(n) ? this.formatMoney(n) : '--'
        return { ...it, valueText }
      })
    },
    totalArrears () {
      return this.tenants.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
    },
    totalArrearsText () {
      if (!this.tenants.length) return '--'
      return this.formatMoney(this.totalArrears)
    }
  },
  watch: {
    currentManagerId: {
      handler () {
        this.loadAll()
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
      this.chart = null
    }
  },
  methods: {
    formatMoney (value) {
      if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return '--'
      const n = Number(value)
      return `¥${n.toLocaleString()}`
    },
    ensureChart () {
      if (this.chart || !this.$refs.chartRef) return
      this.chart = echarts.init(this.$refs.chartRef)
    },
    buildOption () {
      const dto = this.feeDto || {}
      const elecFee = Number(dto.elecFee || 0)
      const airFee = Number(dto.airFee || 0)
      const waterFee = Number(dto.waterFee || 0)
      const otherFee = Number(dto.otherFee || 0)
      return {
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#E2E8F0',
          borderWidth: 1,
          textStyle: { color: '#1E293B', fontSize: 11 },
          formatter: (p) => {
            const v = Number(p.value || 0)
            const valueText = `¥${v.toLocaleString()}`
            const pct = typeof p.percent === 'number' ? `${p.percent}%` : ''
            return `${p.name}: ${valueText}${pct ? ` (${pct})` : ''}`
          }
        },
        series: [
          {
            type: 'pie',
            radius: ['52%', '74%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 6,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: { show: false },
            labelLine: { show: false },
            data: [
              { value: elecFee, name: '电费', itemStyle: { color: '#0EA5E9' } },
              { value: airFee, name: '空调费', itemStyle: { color: '#14B8A6' } },
              { value: waterFee, name: '水费', itemStyle: { color: '#93C5FD' } },
              { value: otherFee, name: '其他', itemStyle: { color: '#CBD5E1' } }
            ]
          }
        ]
      }
    },
    renderChart () {
      if (!this.hasFeeData) {
        if (this.chart) this.chart.clear()
        return
      }
      this.ensureChart()
      if (!this.chart) return
      this.chart.setOption(this.buildOption(), true)
    },
    handleResize () {
      if (this.chart) this.chart.resize()
    },
    makeDemoFeeDto () {
      return { elecFee: 23200.11, airFee: 6200.32, waterFee: 1800.21, otherFee: 1200.88 }
    },
    makeDemoTenants () {
      return [
        { id: 1, name: '园区A科技有限公司', amount: 8239.23 },
        { id: 2, name: '科创园B有限公司', amount: 8239.23 },
        { id: 3, name: '科创园C有限公司', amount: 8239.23 },
        { id: 4, name: '达某科技有限公司', amount: 8239.23 },
        { id: 5, name: '智联XYZ科技有限公司', amount: 8239.23 }
      ]
    },
    normalizeTenantRows (res) {
      if (!res || res.code !== 200) return []
      const list = Array.isArray(res.data) ? res.data : []
      return list.map(i => ({
        id: i.tenantId || i.id,
        name: i.tenantName || i.name || '-',
        amount: Number(i.arrearsAmount || i.amount || 0)
      })).filter(i => i.name)
    },
    async fetchFee () {
      if (!this.currentManagerId) {
        this.feeDto = null
        return
      }
      if (isDemoManager(this.currentManagerId)) {
        this.feeDto = this.makeDemoFeeDto()
        return
      }
      const res = await getTenantFeeComposition({ managerId: this.currentManagerId }).catch(() => null)
      if (res && res.code === 200) {
        this.feeDto = res.data || null
      } else {
        this.feeDto = null
      }
    },
    async fetchArrears () {
      if (!this.currentManagerId) {
        this.tenants = []
        return
      }
      if (isDemoManager(this.currentManagerId)) {
        this.tenants = this.makeDemoTenants()
        return
      }
      const res = await getTenantStatusList({ managerId: this.currentManagerId }).catch(() => null)
      const rows = this.normalizeTenantRows(res)
      rows.sort((a, b) => (Number(b.amount || 0) - Number(a.amount || 0)))
      this.tenants = rows.slice(0, 6)
    },
    async loadAll () {
      this.loading = true
      try {
        await Promise.all([this.fetchFee(), this.fetchArrears()])
        await this.$nextTick()
        this.renderChart()
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.cost-arrears-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #F1F5F9;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(226, 232, 240, 0.6);
  border: 1px solid rgba(226, 232, 240, 0.9);
  flex-shrink: 0;

  i {
    font-size: 16px;
    color: #0F766E;
  }
}

.title-box {
  min-width: 0;

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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.panel-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  padding: 12px 12px 10px;
}

.panel-split {
  height: 100%;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 12px;
  min-height: 0;
}

.split-left,
.split-right {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.donut-wrap {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  border-radius: 12px;
  background: rgba(241, 245, 249, 0.65);
  border: 1px solid rgba(226, 232, 240, 0.9);
  overflow: hidden;
}

.donut-chart,
.donut-empty {
  width: 100%;
  height: 100%;
}

.donut-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
  font-size: 12px;
  user-select: none;
}

.donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  pointer-events: none;
  gap: 4px;
}

.center-label {
  font-size: 11px;
  color: #64748B;
  font-weight: 600;
}

.center-value {
  font-size: 16px;
  font-weight: 800;
  color: #0F172A;
  font-family: 'JetBrains Mono', monospace;
}

.fee-legend {
  padding: 10px 4px 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.legend-item .dot {
  width: 8px;
  height: 8px;
  border-radius: 99px;
  flex-shrink: 0;
}

.legend-item .name {
  font-size: 11px;
  color: #64748B;
  white-space: nowrap;
}

.legend-item .value {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
  color: #0F172A;
  font-family: 'JetBrains Mono', monospace;
  white-space: nowrap;
}

.rank-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 6px 2px 10px;
  gap: 10px;
}

.rank-title {
  font-size: 12px;
  font-weight: 700;
  color: #0F172A;
}

.rank-total {
  font-size: 11px;
  font-weight: 700;
  color: #B91C1C;
  font-family: 'JetBrains Mono', monospace;
  white-space: nowrap;
}

.rank-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 2px;
}

.rank-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 10px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.82);
}

.rank-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.rank-index {
  width: 22px;
  height: 22px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.10);
  border: 1px solid rgba(239, 68, 68, 0.22);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  color: #B91C1C;
  flex-shrink: 0;
}

.rank-name {
  font-size: 12px;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-amount {
  font-size: 12px;
  font-weight: 800;
  color: #0F172A;
  font-family: 'JetBrains Mono', monospace;
  white-space: nowrap;
}

.rank-empty {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
  font-size: 12px;
  user-select: none;
  border-radius: 12px;
  background: rgba(241, 245, 249, 0.65);
  border: 1px solid rgba(226, 232, 240, 0.9);
}

@media (max-width: 1366px) {
  .panel-split {
    grid-template-columns: 1fr;
  }
}
</style>
