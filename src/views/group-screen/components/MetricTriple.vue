<template>
  <div class="metric-triple">
    <div v-for="item in items" :key="item.label" class="metric-triple__cell">
      <div class="metric-triple__label">{{ item.label }}</div>
      <div class="metric-triple__value" :class="{ warn: item.warn, danger: item.danger }">
        {{ item.value }}<span v-if="item.unit" class="unit">{{ item.unit }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MetricTriple',
  props: {
    items: { type: Array, default: () => [] }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/design-system.scss';

.metric-triple {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;

  &__cell {
    text-align: center;
    padding: 8px 4px;
    background: rgba(16, 42, 72, 0.22);
    border: 1px solid $ds-border;
    border-radius: 10px;
  }

  &__label {
    font-size: 11px;
    color: $ds-screen-muted;
    margin-bottom: 6px;
    white-space: nowrap;
  }

  &__value {
    font-size: 20px;
    font-weight: 700;
    color: $ds-cyber;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;

    &.warn { color: $ds-orange; }
    &.danger { color: $ds-red; }

    .unit {
      font-size: 12px;
      font-weight: 500;
      margin-left: 2px;
      color: $ds-screen-unit;
    }
  }
}
</style>
