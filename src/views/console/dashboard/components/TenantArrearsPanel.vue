<template>
  <div class="tenant-arrears" @click="goToTenantList">
    <div class="panel-header">
      <div class="header-left">
        <div class="icon-box">
          <i class="el-icon-user"></i>
        </div>
        <div class="title-box">
          <h3>{{ $t('dashboard.arrears.title') }}</h3>
          <p>{{ $t('dashboard.arrears.subtitle') }}</p>
        </div>
      </div>
    </div>

    <div class="panel-body" v-loading="loading">
      <div class="kpi-row">
        <div class="kpi">
          <div class="kpi-title">
            <span class="kpi-icon">⚡</span>
            <span>{{ $t('dashboard.arrears.owingElecTotal') }}</span>
          </div>
          <div class="kpi-value">{{ owingElecText }}</div>
        </div>
        <div class="kpi">
          <div class="kpi-title">
            <span class="kpi-icon">💧</span>
            <span>{{ $t('dashboard.arrears.owingWaterTotal') }}</span>
          </div>
          <div class="kpi-value">{{ owingWaterText }}</div>
        </div>
      </div>

      <div v-if="tenants.length" class="rank-list">
        <div v-for="(t, idx) in tenants" :key="t.id || t.name || idx" class="rank-item">
          <div class="rank-left">
            <div :class="['rank-index', idx < 3 ? 'top-3' : '']">{{ idx + 1 }}</div>
            <div class="rank-name" :title="tenantNameTitle(t.name)">{{ displayTenantName(t.name) }}</div>
          </div>
          <div class="rank-amount">{{ formatMoney(t.amount) }}</div>
        </div>
      </div>
      <div v-else class="rank-empty">{{ $t('dashboard.arrears.empty') }}</div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getManagerOwingFee, getTenantStatusList, isDemoManager } from '@/api/newDashboard'

export default {
  name: 'TenantArrearsPanel',
  data () {
    return {
      loading: false,
      tenants: [],
      owingElecAmt: null,
      owingWaterAmt: null
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    totalArrears () {
      return this.tenants.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
    },
    owingElecText () {
      const v = Number(this.owingElecAmt)
      if (Number.isFinite(v)) return this.formatMoney(v)
      if (!this.tenants.length) return '--'
      return this.formatMoney(this.totalArrears)
    },
    owingWaterText () {
      const v = Number(this.owingWaterAmt)
      if (Number.isFinite(v)) return this.formatMoney(v)
      return '--'
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
    displayTenantName (name) {
      return this.$displayDynamicName(name, 16)
    },
    tenantNameTitle (name) {
      if (this.$i18n.locale !== 'en') return name
      return this.$displayDynamicName(name, 80)
    },
    goToTenantList () {
      this.$router.push({
        path: '/metering/tenant/list',
        query: { fromDashboard: '1' }
      })
    },
    formatMoney (value) {
      if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return '--'
      const n = Number(value)
      // ✅ 保留负号，不用 Math.abs
      const abs = Math.abs(n)
      const loc = this.$i18n.locale === 'en' ? 'en-US' : 'zh-CN'
      const formatted = `¥${abs.toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      return n < 0 ? `-${formatted}` : formatted
    },
    normalizeTenantRows (res) {
      if (!res || res.code !== 200) return []
      const raw = res.data
      const list = Array.isArray(raw) ? raw : (raw && raw.tenantStatusList ? raw.tenantStatusList : [])
      return (Array.isArray(list) ? list : [])
        .filter((i) => (i.tenantBalance || 0) < 0)
        .sort((a, b) => (a.tenantBalance || 0) - (b.tenantBalance || 0))
        .slice(0, 5)
        .map((i, idx) => ({
          id: i.tenantId || i.id || idx,
          name: i.tenantName || i.name || '-',
          // ✅ 保留负值，不取绝对值
          amount: +(i.tenantBalance || 0)
        }))
    },
    normalizeOwingFee (res) {
      if (!res || res.code !== 200) {
        return { owingElecAmt: null, owingWaterAmt: null }
      }
      const dto = res.data || {}
      const owingElecAmt = Number(dto.owingElecAmt)
      const owingWaterAmt = Number(dto.owingWaterAmt)
      return {
        owingElecAmt: Number.isFinite(owingElecAmt) ? owingElecAmt : null,
        owingWaterAmt: Number.isFinite(owingWaterAmt) ? owingWaterAmt : null
      }
    },
    makeDemoTenants () {
      return [
        { id: 1, name: '园区A科技有限公司', amount: -8239.23 },
        { id: 2, name: '科创园B有限公司', amount: -8239.23 },
        { id: 3, name: '科创园C有限公司', amount: -8239.23 },
        { id: 4, name: '达某科技有限公司', amount: -8239.23 },
        { id: 5, name: '智联XYZ科技有限公司', amount: -8239.23 }
      ]
    },
    async fetchData () {
      if (!this.currentManagerId) {
        this.tenants = []
        this.owingElecAmt = null
        this.owingWaterAmt = null
        return
      }
      this.loading = true
      try {
        if (isDemoManager(this.currentManagerId)) {
          this.tenants = this.makeDemoTenants()
          this.owingElecAmt = this.tenants.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
          this.owingWaterAmt = 0
          return
        }
        const [statusRes, owingRes] = await Promise.all([
          getTenantStatusList({ managerId: this.currentManagerId }).catch(() => null),
          getManagerOwingFee({ managerId: this.currentManagerId }).catch(() => null)
        ])
        this.tenants = this.normalizeTenantRows(statusRes)
        const fee = this.normalizeOwingFee(owingRes)
        this.owingElecAmt = fee.owingElecAmt
        this.owingWaterAmt = fee.owingWaterAmt
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.tenant-arrears {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  cursor: pointer;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #F1F5F9;
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
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(226, 232, 240, 0.9);
  flex-shrink: 0;

  i {
    font-size: 16px;
    color: #F59E0B;
  }
}

.title-box {
  min-width: 0;
  h3 {
    font-size: 12px;
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
  padding: 6px 9px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.kpi {
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.82);
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.kpi-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 700;
  color: #64748B;
}

.kpi-icon {
  font-size: 11px;
  line-height: 1;
}

.kpi-value {
  margin-top: 4px;
  font-size: 13px;
  font-weight: 900;
  color: #0F172A;
  font-family: 'JetBrains Mono', monospace;
  white-space: nowrap;
}

.rank-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: space-between;
}

.rank-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 4px 6px 0;
  border-radius: 0;
  background: transparent;
}

.rank-item:not(:last-child) {
  border-bottom: 1px dashed rgba(226, 232, 240, 0.9);
}

.rank-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.rank-index {
  width: 20px;
  height: 20px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid #94A3B8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  color: #64748B;
  flex-shrink: 0;
}

.rank-index.top-3 {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  color: #3B82F6;
}

.rank-name {
  font-size: 11px;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ✅ 红色负数，体现欠费 */
.rank-amount {
  font-size: 11px;
  font-weight: 800;
  color: #EF4444;
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
  .kpi-row {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
