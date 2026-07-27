<template>
  <section class="kpi-strip" aria-label="今日能源核心指标">
    <article v-for="item in items" :key="item.key" class="kpi-card" :class="`is-${item.tone}`">
      <span class="kpi-card__icon"><energy-icon :name="item.icon" /></span>
      <div class="kpi-card__copy">
        <span class="kpi-card__label">{{ item.label }}</span>
        <div class="kpi-card__value">
          <rolling-number-text :text="formatValue(item)" aria-hidden="true" />
          <small aria-hidden="true">{{ item.unit }}</small>
          <span class="energy-sr-only">{{ formatValue(item) }} {{ item.unit }}</span>
        </div>
        <span class="kpi-card__note">{{ item.noteLabel }}：<b>{{ item.note }}</b></span>
      </div>
    </article>
  </section>
</template>

<script>
import RollingNumberText from '@/views/console/dashboard/components/RollingNumberText.vue'
import EnergyIcon from './EnergyIcon.vue'

export default {
  name: 'EnergyKpiStrip',
  components: { RollingNumberText, EnergyIcon },
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
    }
  }
}
</script>
