<template>
  <div class="kpi-cell" :class="[variant, { compact }]">
    <span class="kpi-cell__label">{{ label }}</span>
    <strong class="kpi-cell__val">{{ value }}</strong>
  </div>
</template>

<script>
export default {
  name: 'KpiCell',
  props: {
    label: String,
    value: [String, Number],
    variant: { type: String, default: '' }, // red | cyan | white
    compact: Boolean
  }
}
</script>

<style scoped lang="scss">
@import '../styles/design-system.scss';

.kpi-cell {
  @include ds-kpi-cell;
  height: 100%;
  box-sizing: border-box;

  &.compact {
    padding: 8px 10px;
    .kpi-cell__label { font-size: 10px; margin-bottom: 5px; }
    .kpi-cell__val { font-size: 18px; }
  }

  &.red .kpi-cell__val { color: $ds-red; }
  &.cyan .kpi-cell__val { color: $ds-cyan-bright; }
  &.white .kpi-cell__val { color: $ds-value-text; }
}
</style>
