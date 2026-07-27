<template>
  <div class="stat-group">
    <div v-if="title" class="stat-group__title">{{ title }}</div>
    <div class="stat-group__row">
      <div
        v-for="item in items"
        :key="item.label"
        class="stat-cell"
      >
        <div class="stat-cell__icon" :class="{ warn: item.warn, danger: item.danger }">
          <span>{{ cellIcon(item) }}</span>
        </div>
        <div class="stat-cell__label">{{ item.label }}</div>
        <div class="stat-cell__value" :class="{ warn: item.warn, danger: item.danger }">
          {{ item.value }}<small v-if="item.unit">{{ item.unit }}</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatGroup',
  props: {
    title: { type: String, required: true },
    items: { type: Array, default: () => [] }
  },
  methods: {
    cellIcon (item) {
      if (item.danger) return '!'
      if (item.warn) return '△'
      if (item.label.includes('率')) return '%'
      if (item.label.includes('巡检')) return '✓'
      return '●'
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/design-system.scss';

.stat-group {
  & + & {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px dashed $ds-border-soft;
  }

  &__title {
    font-size: 12px;
    font-weight: 600;
    color: $ds-screen-label;
    margin-bottom: 6px;
    padding-left: 8px;
    border-left: 2px solid $ds-cyan-bright;
  }

  &__row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
}

.stat-cell {
  text-align: center;
  padding: 6px 4px 8px;
  background: $ds-cell;
  border: 1px solid $ds-border-soft;

  &__icon {
    width: 22px;
    height: 22px;
    margin: 0 auto 4px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: $ds-cyan-bright;
    background: rgba(12, 34, 62, 0.48);
    border: 1px solid rgba(109, 193, 192, 0.16);

    &.danger { color: $ds-red; border-color: rgba($ds-red, 0.22); }
    &.warn { color: $ds-orange; border-color: rgba($ds-orange, 0.22); }
  }

  &__label {
    font-size: 10px;
    color: $ds-screen-muted;
    margin-bottom: 3px;
    white-space: nowrap;
  }

  &__value {
    font-size: 18px;
    font-weight: 700;
    color: $ds-cyan-bright;
    line-height: 1;

    small {
      font-size: 11px;
      font-weight: 500;
      margin-left: 1px;
    }

    &.danger { color: $ds-red; }
    &.warn { color: $ds-orange; }
  }
}
</style>
