<template>
  <section class="kpi-strip" aria-label="今日能源核心指标">
    <article
      v-for="item in items"
      :key="item.key"
      class="kpi-card"
      :class="[`is-${item.tone}`, { 'is-drillable': kpiDrillTarget(item.key) }]"
      @click="handleKpiClick(item.key)"
    >
      <span class="kpi-card__icon"><energy-icon :name="item.icon" /></span>
      <div class="kpi-card__copy">
        <span class="kpi-card__label">{{ item.label }}</span>
        <div class="kpi-card__value">
          <rolling-number-text :text="formatValue(item)" aria-hidden="true" />
          <small aria-hidden="true">{{ item.unit }}</small>
          <span class="energy-sr-only">{{ formatValue(item) }} {{ item.unit }}</span>
        </div>
        <span v-if="item.noteLabel && item.note" class="kpi-card__note">{{ item.noteLabel }}：<b>{{ item.note }}</b></span>
      </div>
    </article>
  </section>
</template>

<script>
import RollingNumberText from '@/views/console/dashboard/components/RollingNumberText.vue'
import EnergyIcon from './EnergyIcon.vue'

const KPI_DRILL_MAP = {
  power: 'electricity-report',
  solar: 'photovoltaic',
  green: 'photovoltaic',
  carbon: 'photovoltaic',
  cost: 'electricity-report',
  online: 'dashboard'
}

export default {
  name: 'EnergyKpiStrip',
  components: { RollingNumberText, EnergyIcon },
  inject: ['energyScreenDrilldown'],
  props: { items: { type: Array, required: true } },
  methods: {
    formatValue (item) {
      if (item.value === null || item.value === undefined || item.value === '') return '--'
      const value = Number(item.value)
      if (!Number.isFinite(value)) return '--'
      const digits = Number(item.digits) || 0
      const text = value.toLocaleString('zh-CN', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      })
      return `${item.prefix || ''}${text}`
    },
    kpiDrillTarget (key) {
      return KPI_DRILL_MAP[key] || null
    },
    handleKpiClick (key) {
      const target = KPI_DRILL_MAP[key]
      if (target) this.energyScreenDrilldown(target)
    }
  }
}
</script>
