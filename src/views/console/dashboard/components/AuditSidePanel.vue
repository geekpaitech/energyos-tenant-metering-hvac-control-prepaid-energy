<template>
  <div class="audit-side-panel">
    <div class="panel-header">
      <div class="header-left">
        <div class="icon-box audit">
          <i class="el-icon-document-checked"></i>
        </div>
        <div class="title-box">
          <div class="title-row">
            <h3>核查处理台</h3>
          </div>
          <p v-if="session">{{ periodText }}</p>
          <p v-else>成本管理 ·缩略预览</p>
        </div>
      </div>
      <div class="header-right">
        <el-tag v-if="session" size="mini" type="success">已上传</el-tag>
        <el-button
          v-else
          class="btn-upload"
          type="primary"
          size="mini"
          icon="el-icon-plus"
          circle
          @click="goToVerification"
        />
      </div>
    </div>

    <div class="panel-body" v-loading="loading">
      <div v-if="meterPoints.length" class="meter-table-wrapper">
        <table class="meter-compare-table" :style="{ minWidth: tableMinWidth + 'px' }">
          <thead>
            <tr>
              <th class="row-header">项目 / 计量点</th>
              <th v-for="(point, index) in meterPoints" :key="`h-${index}`" class="col-point">
                计量点 {{ index + 1 }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="row-header">计量点</td>
              <td v-for="(point, index) in meterPoints" :key="`idx-${index}`" class="col-point">
                {{ index + 1 }}
              </td>
            </tr>
            <tr>
              <td class="row-header">功率因数</td>
              <td v-for="(point, index) in meterPoints" :key="`pf-${index}`" class="col-point">
                {{ formatPercent(point.powerFactor) }}
              </td>
            </tr>
            <tr>
              <td class="row-header">增减率</td>
              <td v-for="(point, index) in meterPoints" :key="`cr-${index}`" class="col-point">
                <span :class="getChangeRateClass(point.changeRate)">{{ formatRate(point.changeRate) }}</span>
              </td>
            </tr>
            <tr>
              <td class="row-header">基本电费</td>
              <td v-for="(point, index) in meterPoints" :key="`basic-${index}`" class="col-point">
                ¥{{ formatNumber(point.amount) }}
              </td>
            </tr>
            <tr>
              <td class="row-header">无功力调金额</td>
              <td v-for="(point, index) in meterPoints" :key="`react-${index}`" class="col-point">
                ¥{{ formatNumber(point.adjustAmount) }}
              </td>
            </tr>
            <tr>
              <td class="row-header">有功电量金额</td>
              <td v-for="(point, index) in meterPoints" :key="`active-${index}`" class="col-point">
                ¥{{ formatNumber(point.totalActiveAmount, 4) }}
              </td>
            </tr>
            <tr>
              <td class="row-header">有功力调金额</td>
              <td v-for="(point, index) in meterPoints" :key="`pfAdj-${index}`" class="col-point">
                ¥{{ formatNumber(point.pfAdjustAmount) }}
              </td>
            </tr>
            <tr class="total-row">
              <td class="row-header">小计金额</td>
              <td v-for="(point, index) in meterPoints" :key="`sub-${index}`" class="col-point">
                <span class="total-highlight">¥{{ formatNumber(point.subtotalAmount) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <div class="empty-card">
          <div class="empty-icon">
            <i class="el-icon-document-add"></i>
          </div>
          <div class="empty-text">{{ session ? '核查联暂无可展示数据。' : '未上传过电费核查联。' }}</div>
          <div v-if="!session" class="empty-sub">上传核查联后，自动生成差异定位与复核入口。</div>
          <el-button
            v-if="!session"
            type="primary"
            size="mini"
            icon="el-icon-plus"
            @click="goToVerification"
          >上传核查联</el-button>
        </div>
      </div>

      <div class="table-actions" v-if="session">
        <el-button type="text" icon="el-icon-view" @click="goToCostManagement">查看差异</el-button>
        <el-button type="text" icon="el-icon-refresh" @click="goToVerification">发起复核</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import { getEbvRecordList } from '@/api/ebvRecord'

export default {
  name: 'AuditSidePanel',
  data () {
    return {
      records: [],
      loading: false
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    session () {
      const list = Array.isArray(this.records) ? this.records : []
      if (!list.length) return null

      const normalized = list.map(r => {
        const ref = r || {}
        const dateText = ref.startDate || ref.occurDate || ref.createTime || ''
        const m = moment(dateText)
        const monthKey = m.isValid() ? m.format('YYYY-MM') : ''
        const time = moment(ref.createTime || dateText).valueOf()
        return { raw: ref, monthKey, time }
      }).filter(x => x.raw)

      if (!normalized.length) return null

      const monthKeys = Array.from(new Set(normalized.map(x => x.monthKey).filter(Boolean)))
      if (monthKeys.length > 1) {
        const targetMonth = moment().subtract(1, 'month').format('YYYY-MM')
        const lastMonthHits = normalized.filter(x => x.monthKey === targetMonth)
        if (lastMonthHits.length) {
          lastMonthHits.sort((a, b) => b.time - a.time)
          return lastMonthHits[0].raw
        }
        normalized.sort((a, b) => (b.monthKey || '').localeCompare(a.monthKey || '') || (b.time - a.time))
        return normalized[0].raw
      }

      normalized.sort((a, b) => b.time - a.time)
      return normalized[0].raw
    },
    meterPoints () {
      return (this.session && this.session.billsList) || []
    },
    tableMinWidth () {
      const pointCount = Array.isArray(this.meterPoints) ? this.meterPoints.length : 0
      const leftCol = 168
      const pointCol = 170
      return Math.max(520, leftCol + pointCount * pointCol)
    },
    periodText () {
      if (!this.session) return ''
      const start = this.session.startDate
      const end = this.session.endDate
      if (start && end) {
        return `${String(start).replace(/-/g, '/')} - ${String(end).replace(/-/g, '/')}`
      }
      const occur = this.session.occurDate || this.session.createTime
      const m = moment(occur)
      if (!m.isValid()) return '成本管理 ·缩略预览'
      return `${m.format('YYYY/MM')} 账期`
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
  methods: {
    async fetchData () {
      if (!this.currentManagerId) {
        this.records = []
        return
      }

      this.loading = true
      try {
        const beginTime = moment().subtract(2, 'year').startOf('year').format('YYYY-MM-DD')
        const endTime = moment().endOf('day').format('YYYY-MM-DD')
        const res = await getEbvRecordList({
          managerId: this.currentManagerId,
          beginTime,
          endTime
        }).catch(() => null)

        if (res && res.code === 200 && Array.isArray(res.data)) {
          this.records = res.data
        } else {
          this.records = []
        }
      } catch (e) {
        this.records = []
      } finally {
        this.loading = false
      }
    },
    goToCostManagement () {
      this.$router.push({ path: '/metering/finance/cost-management' })
    },
    goToVerification () {
      this.$router.push({ path: '/ai/verification' })
    },
    formatPercent (value) {
      if (value === null || value === undefined || value === '') return '-'
      const num = Number(value)
      if (Number.isNaN(num)) return '-'
      return `${Math.round(num)}%`
    },
    formatRate (value) {
      if (value === null || value === undefined || value === '') return '-'
      const num = Number(value)
      if (Number.isNaN(num)) return '-'
      const fixed = Math.abs(num) >= 10 ? num.toFixed(1) : num.toFixed(2)
      return `${fixed}%`
    },
    getChangeRateClass (value) {
      const num = Number(value)
      if (Number.isNaN(num)) return 'rate'
      if (num > 0) return 'rate up'
      if (num < 0) return 'rate down'
      return 'rate'
    },
    formatNumber (value, digits = 2) {
      if (value === null || value === undefined || value === '') return '-'
      const num = Number(value)
      if (Number.isNaN(num)) return '-'
      return num.toLocaleString('zh-CN', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.audit-side-panel {
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

  .header-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .btn-upload {
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.18);
  }

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
    background: rgba(124, 58, 237, 0.12);

    i {
      font-size: 16px;
      color: #6D28D9;
    }
  }

  .title-box {
    .title-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .demo-tag {
      height: 18px;
      padding: 0 6px;
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      background: #F8FAFC;
      border: 1px solid rgba(226, 232, 240, 0.9);
      color: #64748B;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.5px;
      flex-shrink: 0;
    }

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

.meter-table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border-radius: 12px;
  background: #FFFFFF;
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.meter-compare-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.meter-compare-table th,
.meter-compare-table td {
  border-bottom: 1px solid #EEF2F7;
  padding: 10px 10px;
  font-size: 11px;
  color: #334155;
  text-align: center;
  white-space: nowrap;
}

.meter-compare-table thead th {
  background: #F8FAFC;
  color: #475569;
  font-weight: 800;
}

.row-header {
  text-align: left !important;
  width: 42%;
  color: #64748B;
  background: #F8FAFC;
  font-weight: 700;
  position: sticky;
  left: 0;
  z-index: 2;
}

.meter-compare-table thead .row-header {
  z-index: 3;
}

.col-point {
  width: 170px;
  min-width: 170px;
}

.rate { font-weight: 800; font-family: 'JetBrains Mono', monospace; color: #64748B; }
.rate.up { color: #E11D48; }
.rate.down { color: #16A34A; }

.total-row td {
  background: #FFFFFF;
}

.total-row .row-header {
  background: #FFFFFF;
  color: #0F172A;
}

.total-highlight {
  font-weight: 900;
  color: #EF4444;
  font-family: 'JetBrains Mono', monospace;
}

.table-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 0 4px;
}

.empty-state {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.9), rgba(255, 255, 255, 1));
  border: 1px dashed rgba(148, 163, 184, 0.7);
}

.empty-card {
  text-align: center;
  padding: 18px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.empty-icon {
  width: 44px;
  height: 44px;
  margin: 0 auto 10px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(37, 99, 235, 0.12);
  border: 1px solid rgba(37, 99, 235, 0.15);

  i {
    font-size: 20px;
    color: #2563EB;
  }
}

.empty-text {
  color: #334155;
  font-size: 12px;
  font-weight: 600;
}

.empty-sub {
  margin-top: 6px;
  margin-bottom: 12px;
  color: #94A3B8;
  font-size: 11px;
}
</style>
