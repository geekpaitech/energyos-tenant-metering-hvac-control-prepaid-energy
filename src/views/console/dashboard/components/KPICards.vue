<template>
  <div class="kpi-cards">
    <div v-for="(card, index) in cards" :key="card.cardId" class="kpi-card"
      :style="{ '--accent': card.accent, '--accentSoft': card.accentSoft, animationDelay: `${index * 0.08}s` }"
      @click="handleCardClick(card.cardId)"
      style="cursor: pointer;">
      <div class="card-left">
        <div class="icon-box">
          <i :class="card.icon"></i>
        </div>
        <div class="meta">
          <span class="label">{{ $t('dashboard.kpi.' + card.cardId) }}</span>
          <div class="value-box">
            <span class="value">{{ card.value }}</span>
            <span v-if="card.unitI18nKey" class="unit">{{ $t('dashboard.units.' + card.unitI18nKey) }}</span>
            <span v-else-if="card.unit" class="unit">{{ card.unit }}</span>
            <span v-if="card.trend !== 0" class="trend-inline">
              <i
                class="trend-ico"
                :class="card.trend >= 0 ? 'el-icon-caret-top' : 'el-icon-caret-bottom'"
              />
              <span :class="['trend-text', card.trend >= 0 ? 'up' : 'down']">
                {{ card.trend >= 0 ? '+' : '' }}{{ Math.abs(card.trend) }}%
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import { getTenantTopStatistics, isDemoManager } from '@/api/newDashboard'

export default {
  name: 'KPICards',
  data () {
    return {
      cards: []
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId'])
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
    formatNumber (value, digits = 2) {
      const n = Number(value)
      if (!Number.isFinite(n)) return '0'
      const fixed = digits > 0 ? Number(n.toFixed(digits)) : Math.round(n)
      return fixed.toLocaleString()
    },
    formatMoney (value, digits = 2) {
      const n = Number(value)
      if (!Number.isFinite(n)) return '¥0'
      const fixed = digits > 0 ? Number(n.toFixed(digits)) : Math.round(n)
      return `¥${fixed.toLocaleString()}`
    },
    makeDemoCards () {
      return [
        {
          cardId: 'yesterdayElec',
          value: '12,458',
          unit: 'kWh',
          unitI18nKey: null,
          trend: 3.2,
          icon: 'el-icon-lightning',
          accent: '#0369A1',
          accentSoft: 'rgba(14, 165, 233, 0.14)'
        },
        {
          cardId: 'yesterdayWater',
          value: '2,340',
          unit: 'm³',
          unitI18nKey: null,
          trend: -1.5,
          icon: 'el-icon-water-cup',
          accent: '#0E7490',
          accentSoft: 'rgba(6, 182, 212, 0.14)'
        },
        {
          cardId: 'yesterdayFee',
          value: '¥8,560',
          unit: '',
          unitI18nKey: null,
          trend: 2.8,
          icon: 'el-icon-bank-card',
          accent: '#0F766E',
          accentSoft: 'rgba(16, 185, 129, 0.14)'
        },
        {
          cardId: 'tenantTotal',
          value: '156',
          unit: '',
          unitI18nKey: 'households',
          trend: 0,
          icon: 'el-icon-user',
          accent: '#475569',
          accentSoft: 'rgba(148, 163, 184, 0.16)'
        },
        {
          cardId: 'acRunning',
          value: '668',
          unit: '',
          unitI18nKey: 'devices',
          trend: 5.8,
          icon: 'el-icon-wind-power',
          accent: '#0369A1',
          accentSoft: 'rgba(14, 165, 233, 0.14)',
          action: true
        },
        {
          cardId: 'pendingAlerts',
          value: '4',
          unit: '',
          unitI18nKey: 'alerts',
          trend: 0,
          icon: 'el-icon-warning',
          accent: '#B91C1C',
          accentSoft: 'rgba(239, 68, 68, 0.12)'
        }
      ]
    },
    makeDemoDto () {
      return {
        useElec: 12458,
        useWater: 2340,
        useFee: 8560,
        tenantCount: 156,
        airRunningCount: 668
      }
    },
    makeCardsFromDto (dto) {
      const data = dto || {}
      return [
        {
          cardId: 'yesterdayElec',
          value: this.formatNumber(data.useElec, 2),
          unit: 'kWh',
          unitI18nKey: null,
          trend: 0,
          icon: 'el-icon-lightning',
          accent: '#0369A1',
          accentSoft: 'rgba(14, 165, 233, 0.14)'
        },
        {
          cardId: 'yesterdayWater',
          value: this.formatNumber(data.useWater, 2),
          unit: 'm³',
          unitI18nKey: null,
          trend: 0,
          icon: 'el-icon-water-cup',
          accent: '#0E7490',
          accentSoft: 'rgba(6, 182, 212, 0.14)'
        },
        {
          cardId: 'yesterdayFee',
          value: this.formatMoney(data.useFee, 2),
          unit: '',
          unitI18nKey: null,
          trend: 0,
          icon: 'el-icon-bank-card',
          accent: '#0F766E',
          accentSoft: 'rgba(16, 185, 129, 0.14)'
        },
        {
          cardId: 'tenantTotal',
          value: this.formatNumber(data.tenantCount, 0),
          unit: '',
          unitI18nKey: 'households',
          trend: 0,
          icon: 'el-icon-user',
          accent: '#475569',
          accentSoft: 'rgba(148, 163, 184, 0.16)'
        },
        {
          cardId: 'acRunning',
          value: this.formatNumber(data.airRunningCount, 0),
          unit: '',
          unitI18nKey: 'devices',
          trend: 0,
          icon: 'el-icon-wind-power',
          accent: '#0369A1',
          accentSoft: 'rgba(14, 165, 233, 0.14)',
          action: true
        },
        {
          cardId: 'pendingAlerts',
          value: '0',
          unit: '',
          unitI18nKey: 'alerts',
          trend: 0,
          icon: 'el-icon-warning',
          accent: '#B91C1C',
          accentSoft: 'rgba(239, 68, 68, 0.12)'
        }
      ]
    },
    async fetchData () {
      if (!this.currentManagerId) {
        this.cards = this.makeCardsFromDto({})
        this.$emit('top-statistics', {})
        return
      }

      if (isDemoManager(this.currentManagerId)) {
        this.cards = this.makeDemoCards()
        this.$emit('top-statistics', this.makeDemoDto())
        return
      }

      const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD')
      const res = await getTenantTopStatistics({
        beginTime: yesterday,
        endTime: yesterday,
        managerId: this.currentManagerId
      }).catch(() => null)

      const dto = res && res.data ? res.data : {}
      this.cards = this.makeCardsFromDto(dto)
      this.$emit('top-statistics', dto || {})
    },
    handleCardClick (cardId) {
      if (cardId === 'yesterdayElec') {
        this.$router.push('/energy/equipmentPower')
      } else if (cardId === 'yesterdayWater') {
        this.$router.push('/energy/charging-water')
      } else if (cardId === 'yesterdayFee') {
        this.$router.push('/metering/bill/energy-bill-tenant')
      } else if (cardId === 'tenantTotal') {
        this.$router.push('/metering/tenant/list')
      } else if (cardId === 'acRunning') {
        this.$router.push('/device/conditioning')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.kpi-cards {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  position: relative;
}

.kpi-card {
  background: white;
  border-radius: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
  min-height: 74px;
  animation: fadeInUp 0.3s ease-out forwards;
  opacity: 0;
  transform: translateY(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  position: relative;
}

.kpi-card:hover {
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.10);
  transform: translateY(0);
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accentSoft);
  border: 1px solid rgba(226, 232, 240, 0.9);
  flex-shrink: 0;
}

.icon-box i {
  font-size: 18px;
  color: var(--accent);
}

.trend-inline {
  display: inline-flex;
  align-items: center;
  gap: 2px;

  .trend-ico.el-icon-caret-top {
    color: #0f766e;
  }

  .trend-ico.el-icon-caret-bottom {
    color: #b91c1c;
  }
}

.trend-ico {
  font-size: 14px;
  line-height: 1;
}

.trend-text {
  font-weight: 600;
  font-size: 11px;
  line-height: 16px;
}

.trend-text.up {
  color: #0F766E;
}

.trend-text.down {
  color: #B91C1C;
}

.meta {
  min-width: 0;
}

.meta .label {
  font-size: 12px;
  color: #64748B;
  display: block;
  line-height: 16px;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta .value-box {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta .value-box .value {
  font-size: 18px;
  font-weight: 800;
  color: #0F172A;
  font-family: 'JetBrains Mono', monospace;
  line-height: 22px;
}

.meta .value-box .unit {
  font-size: 11px;
  color: #94A3B8;
  line-height: 16px;
}

@media (max-width: 1366px) {
  .kpi-cards {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .kpi-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
