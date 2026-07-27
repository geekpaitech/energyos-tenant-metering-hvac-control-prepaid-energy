<template>
  <div class="stat-metric" :class="{ danger, warn, accent, good: isGood }">
    <div class="stat-metric__label">{{ label }}</div>
    <div class="stat-metric__value">
      {{ value }}<span v-if="unit" class="unit">{{ unit }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatMetric',
  props: {
    label: String,
    value: [String, Number],
    unit: { type: String, default: '' },
    danger: Boolean,
    warn: Boolean,
    accent: Boolean
  },
  computed: {
    isGood () {
      return !this.danger && !this.warn && ['设备在线率'].includes(this.label)
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/design-system.scss';

.stat-metric {
  text-align: center;
  padding: 11px 8px 10px;
  @include ds-glass;

  &__label {
    font-size: 11px;
    color: $ds-label;
    margin-bottom: 6px;
    white-space: nowrap;
  }

  &__value {
    font-size: 22px;
    font-weight: 700;
    color: $ds-cyan-bright;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    .unit { font-size: 12px; font-weight: 500; margin-left: 1px; }
  }

  &.danger .stat-metric__value { color: $ds-red; }
  &.warn .stat-metric__value { color: $ds-orange; }
  &.accent .stat-metric__value { color: $ds-value-text; }
  &.good .stat-metric__value { color: $ds-cyan-bright; }
}
</style>
