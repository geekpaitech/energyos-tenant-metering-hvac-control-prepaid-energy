<template>
  <div class="energy-side-panel" style="cursor: pointer;" @click="handlePanelClick">
    <div class="panel-header">
      <div class="header-left">
        <div class="icon-box energy">
          <i class="el-icon-data-analysis"></i>
        </div>
        <div class="title-box">
          <h3>能耗摘要</h3>
          <p>昨日关键指标</p>
        </div>
      </div>
      <el-tag size="mini" :type="loading ? 'info' : 'success'">{{ loading ? '加载中' : '实时' }}</el-tag>
    </div>

    <div class="panel-body" v-loading="loading">
      <div class="summary-cards">
        <div class="summary-card">
          <div class="label">峰段占比</div>
          <div class="value">
            {{ formatPercent(metrics.peakSharePct, 0) }}<span v-if="metrics.peakSharePct !== null && metrics.peakSharePct !== undefined" class="unit">%</span>
          </div>
          <div :class="['meta', getTrendClass(metrics.peakShareDeltaPct)]">
            <i :class="getTrendIcon(metrics.peakShareDeltaPct)"></i>
            {{ formatSignedNumber(metrics.peakShareDeltaPct, 1) }}<span v-if="metrics.peakShareDeltaPct !== null && metrics.peakShareDeltaPct !== undefined">pp</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="label">用电较上月</div>
          <div class="value">
            {{ formatSignedNumber(metrics.elecDelta, 1) }}<span v-if="metrics.elecDelta !== null && metrics.elecDelta !== undefined" class="unit">度</span>
          </div>
          <div :class="['meta', getTrendClass(metrics.elecDelta)]">
            <i :class="getTrendIcon(metrics.elecDelta)"></i>
            {{ getTrendText(metrics.elecDelta) }}
          </div>
        </div>
        <div class="summary-card">
          <div class="label">用水较上月</div>
          <div class="value">
            {{ formatSignedNumber(metrics.waterDelta, 1) }}<span v-if="metrics.waterDelta !== null && metrics.waterDelta !== undefined" class="unit">m³</span>
          </div>
          <div :class="['meta', getTrendClass(metrics.waterDelta)]">
            <i :class="getTrendIcon(metrics.waterDelta)"></i>
            {{ getTrendText(metrics.waterDelta) }}
          </div>
        </div>
      </div>

      <div class="tips">
        <div class="tips-title">
          <i class="el-icon-magic-stick"></i>
          <span>建议</span>
        </div>
        <div class="tips-item" v-for="(tip, index) in tips" :key="index">
          <span class="dot"></span>
          <span class="text">{{ tip }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import { mapGetters } from 'vuex'
import { queryTenantWaterUseStatis, useReportQueryTenantUseStatis } from '@/api/useReport'
import { tenantPageTenant } from '@/api/tenant'

export default {
  name: 'EnergySidePanel',
  data () {
    return {
      loading: false,
      metrics: {
        peakSharePct: null,
        peakShareDeltaPct: null,
        elecDelta: null,
        waterDelta: null,
        airSharePct: null
      },
      tips: []
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId'])
  },
  watch: {
    currentManagerId: {
      handler () {
        this.fetchMetrics()
      },
      immediate: true
    }
  },
  methods: {
    formatPercent (value, digits = 0) {
      if (value === undefined || value === null || Number.isNaN(Number(value))) return '-'
      return Number(value).toFixed(digits)
    },
    formatSignedNumber (value, digits = 1) {
      if (value === undefined || value === null || Number.isNaN(Number(value))) return '-'
      const n = Number(value)
      const sign = n > 0 ? '+' : ''
      return sign + n.toFixed(digits)
    },
    getTrendClass (value) {
      if (value === undefined || value === null || Number.isNaN(Number(value))) return 'up'
      return Number(value) >= 0 ? 'up' : 'down'
    },
    getTrendIcon (value) {
      if (value === undefined || value === null || Number.isNaN(Number(value))) return 'el-icon-top'
      return Number(value) >= 0 ? 'el-icon-top' : 'el-icon-bottom'
    },
    getTrendText (value) {
      if (value === undefined || value === null || Number.isNaN(Number(value))) return '暂无对比'
      const n = Number(value)
      if (n > 0) return '趋势上行'
      if (n < 0) return '趋势回落'
      return '持平'
    },
    parseNumberOrNull (value) {
      if (value === undefined || value === null || value === '') return null
      const n = Number(value)
      if (Number.isNaN(n)) return null
      return n
    },
    computeDelta (current, previous) {
      const c = this.parseNumberOrNull(current)
      const p = this.parseNumberOrNull(previous)
      if (c === null || p === null) return null
      return c - p
    },
    computePeakSharePct (record) {
      if (!record) return null
      const total = Number(record.useElec) || 0
      if (total <= 0) return 0
      const peak = (Number(record.useElecPeak) || 0) + (Number(record.useElecTop) || 0)
      return (peak / total) * 100
    },
    computeAirSharePct (record) {
      if (!record) return null
      const total = Number(record.useElec) || 0
      if (total <= 0) return 0
      const air = Number(record.airUseElec) || 0
      return (air / total) * 100
    },
    buildTips (m) {
      const list = []
      const peakShare = m.peakSharePct
      const elecDelta = m.elecDelta
      const waterDelta = m.waterDelta
      const airShare = m.airSharePct
      const hasAir = airShare !== null && airShare >= 1

      if (peakShare !== null && peakShare >= 45) {
        if (hasAir && airShare >= 15) {
          list.push('峰段占比偏高，优先执行错峰策略与空调分区/温控优化')
        } else {
          list.push('峰段占比偏高，优先执行错峰策略与大功率设备分时启停')
        }
      } else if (peakShare !== null && peakShare <= 30) {
        list.push('峰段占比较低，可评估将部分可移负荷进一步转移至谷段')
      }

      if (elecDelta !== null && elecDelta > 0) {
        if (hasAir && airShare >= 15) {
          list.push('用电较上月增加，优先排查夜间长开与空调运行策略')
        } else {
          list.push('用电较上月增加，优先排查夜间长开与照明/动力设备策略')
        }
      } else if (elecDelta !== null && elecDelta < 0) {
        list.push('用电较上月减少，关注生产停机、设备离线或数据缺失导致的偏差')
      }

      if (waterDelta !== null && waterDelta > 0) {
        list.push('用水较上月增加，排查泄漏与冲洗')
      } else if (waterDelta !== null && waterDelta < 0) {
        list.push('用水较上月减少，关注水表离线')
      }

      if (list.length === 0) {
        if (hasAir && airShare >= 15) {
          list.push('优先关注峰段负荷：空调、照明与生产设备的启停策略')
        } else {
          list.push('优先关注峰段负荷：照明、动力设备与生产设备的启停策略')
        }
        list.push('建议定期核对计量点在线率，避免数据缺失影响分析')
      }

      return list.slice(0, 3)
    },
    normalizeList (res) {
      if (!res || res.code !== 200) return []
      return res.data || []
    },
    sortByOccurDateAsc (list) {
      return [...(list || [])].sort((a, b) => new Date(a.occurDate) - new Date(b.occurDate))
    },
    pickLatest (list) {
      const sorted = this.sortByOccurDateAsc(list)
      return sorted.length ? sorted[sorted.length - 1] : null
    },
    pickByOccurDate (list, date) {
      const target = String(date || '')
      if (!target) return null
      return (list || []).find(i => String(i.occurDate) === target) || null
    },
    async fetchMetrics () {
      if (!this.currentManagerId) {
        this.metrics = { peakSharePct: null, peakShareDeltaPct: null, elecDelta: null, waterDelta: null, airSharePct: null }
        this.tips = this.buildTips(this.metrics)
        return
      }

      const thisMonthStartMoment = moment().startOf('month')
      const yesterdayMoment = moment().subtract(1, 'day')
      const thisMonthStart = thisMonthStartMoment.format('YYYY-MM-DD')
      const endThisMonth = (yesterdayMoment.isBefore(thisMonthStartMoment, 'day') ? thisMonthStartMoment : yesterdayMoment).format('YYYY-MM-DD')
      const lastMonthStart = moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD')
      const lastMonthEnd = moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD')

      this.loading = true
      try {
        const tenantIds = await this.fetchTenantIds()
        const [elecThisMonthRes, elecLastMonthRes, waterThisMonthRes, waterLastMonthRes] = await Promise.all([
          useReportQueryTenantUseStatis({
            managerId: this.currentManagerId,
            startDate: thisMonthStart,
            endDate: endThisMonth,
            dataType: 2,
            useType: 1,
            selectType: 2,
            tenantIdList: tenantIds
          }).catch(() => ({})),
          useReportQueryTenantUseStatis({
            managerId: this.currentManagerId,
            startDate: lastMonthStart,
            endDate: lastMonthEnd,
            dataType: 2,
            useType: 1,
            selectType: 2,
            tenantIdList: tenantIds
          }).catch(() => ({})),
          queryTenantWaterUseStatis({
            managerId: this.currentManagerId,
            startDate: thisMonthStart,
            endDate: endThisMonth,
            dataType: 2,
            useType: 0,
            tenantIdList: tenantIds
          }).catch(() => ({})),
          queryTenantWaterUseStatis({
            managerId: this.currentManagerId,
            startDate: lastMonthStart,
            endDate: lastMonthEnd,
            dataType: 2,
            useType: 0,
            tenantIdList: tenantIds
          }).catch(() => ({}))
        ])

        const elecThisMonthList = this.normalizeList(elecThisMonthRes)
        const elecLastMonthList = this.normalizeList(elecLastMonthRes)
        const waterThisMonthList = this.normalizeList(waterThisMonthRes)
        const waterLastMonthList = this.normalizeList(waterLastMonthRes)

        const elecCurrent = this.pickLatest(elecThisMonthList)
        const waterCurrent = this.pickLatest(waterThisMonthList)

        const currentOccurDate = elecCurrent && elecCurrent.occurDate ? elecCurrent.occurDate : null
        const lastMonthSameDay = currentOccurDate ? moment(currentOccurDate).subtract(1, 'month').format('YYYY-MM-DD') : null

        const elecLastMonth =
          (lastMonthSameDay && this.pickByOccurDate(elecLastMonthList, lastMonthSameDay)) ||
          this.pickLatest(elecLastMonthList)
        const waterLastMonth =
          (lastMonthSameDay && this.pickByOccurDate(waterLastMonthList, lastMonthSameDay)) ||
          this.pickLatest(waterLastMonthList)

        const peakShareToday = this.computePeakSharePct(elecCurrent)
        const peakShareLastMonth = this.computePeakSharePct(elecLastMonth)
        const airShareToday = this.computeAirSharePct(elecCurrent)

        const metrics = {
          peakSharePct: peakShareToday,
          peakShareDeltaPct:
            peakShareToday === null || peakShareLastMonth === null ? null : peakShareToday - peakShareLastMonth,
          elecDelta: this.computeDelta(elecCurrent && elecCurrent.useElec, elecLastMonth && elecLastMonth.useElec),
          waterDelta: this.computeDelta(waterCurrent && waterCurrent.waterUse, waterLastMonth && waterLastMonth.waterUse),
          airSharePct: airShareToday
        }

        this.metrics = metrics
        this.tips = this.buildTips(metrics)
      } catch (e) {
        this.metrics = { peakSharePct: null, peakShareDeltaPct: null, elecDelta: null, waterDelta: null, airSharePct: null }
        this.tips = this.buildTips(this.metrics)
      } finally {
        this.loading = false
      }
    },
    async fetchTenantIds () {
      const payload = {
        id: '',
        managerId: this.currentManagerId,
        labelIds: '',
        balanceStatus: null,
        tenantStatus: 0,
        page: {
          current: 1,
          size: 150,
          orders: [
            { asc: false, column: 'createTime' }
          ]
        }
      }
      try {
        const res = await tenantPageTenant(payload)
        if (res && res.code === 200 && res.data && Array.isArray(res.data.dataList)) {
          return res.data.dataList.map(i => i.id).filter(Boolean)
        }
      } catch (e) {}
      return []
    },
    handlePanelClick () {
      this.$router.push('/energy/electricity-report')
    }
  }
}
</script>

<style lang="scss" scoped>
.energy-side-panel {
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
    min-width: 0;
  }

  .icon-box {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(226, 232, 240, 0.9);
    background: rgba(14, 165, 233, 0.12);

    i {
      font-size: 16px;
      color: #0369A1;
    }
  }

  .title-box {
    h3 {
      font-size: 13px;
      font-weight: 600;
      color: #1E293B;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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
}

.panel-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 12px;
}

.summary-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-card {
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.75);
  padding: 10px 10px;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: 4px 8px;
  min-width: 0;
}

.label {
  grid-column: 1 / 2;
  grid-row: 1;
  font-size: 11px;
  color: #64748B;
}

.value {
  grid-column: 2 / 3;
  grid-row: 1 / 3;
  align-self: center;
  font-size: 18px;
  font-weight: 800;
  color: #0F172A;
  font-family: 'JetBrains Mono', monospace;
  white-space: nowrap;
}

.unit {
  font-size: 11px;
  font-weight: 700;
  color: #94A3B8;
  margin-left: 2px;
}

.meta {
  grid-column: 1 / 2;
  grid-row: 2;
  font-size: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #94A3B8;

  i {
    font-size: 10px;
  }
}

.meta.up { color: #059669; }
.meta.down { color: #E11D48; }

.tips {
  flex: 1;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.75);
  padding: 10px 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tips-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #1E293B;

  i {
    color: #7C3AED;
    font-size: 12px;
  }
}

.tips-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(14, 165, 233, 0.85);
  margin-top: 6px;
  flex-shrink: 0;
}

.text {
  font-size: 11px;
  color: #64748B;
  line-height: 16px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
