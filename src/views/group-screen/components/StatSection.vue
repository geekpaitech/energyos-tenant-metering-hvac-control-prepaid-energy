<template>
  <div class="stat-section" :class="{ 'stat-section--dense': dense }">
    <div class="stat-section__head">
      <span v-if="iconKey" class="title-ic" :class="'ic-' + iconKey">
        <svg viewBox="0 0 20 20"><path :d="iconPaths[iconKey]" fill="currentColor" /></svg>
      </span>
      <span class="title-txt">{{ title }}</span>
    </div>
    <div class="stat-section__row">
      <div
        v-for="(item, idx) in items"
        :key="item.label"
        class="stat-cell"
        :class="[cellClass(item), { 'stat-cell--last': idx === items.length - 1 }]"
      >
        <div class="lbl">{{ item.label }}</div>
        <div class="val">
          {{ item.value }}<span v-if="item.unit" class="unit">{{ item.unit }}</span>
          <i v-if="item.trendUp" class="trend-up" aria-hidden="true">↑</i>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const iconPaths = {
  fire: 'M10 2c2.2 2.5 4 4.8 4 7.2A4 4 0 016 9.2C6 7.2 7.6 5 10 2zm0 7.8c1.4 1.4 2.4 2.8 2.4 4A2.4 2.4 0 018 13.8c0-1.2 0.9-2.6 2-4z',
  power: 'M11 2L5 12h4l-1 6 7-10h-4l1-6z'
}

export default {
  name: 'StatSection',
  props: {
    title: String,
    items: { type: Array, default: () => [] },
    /** 左栏等紧凑场景：缩小行高与字号 */
    dense: { type: Boolean, default: false }
  },
  data: () => ({ iconPaths }),
  computed: {
    iconKey () {
      if (this.title === '智慧消防') return 'fire'
      if (this.title === '配电运维') return 'power'
      return ''
    }
  },
  methods: {
    cellClass (item) {
      if (item.danger) return 'danger'
      if (item.warn) return 'warn'
      if (item.fault) return 'fault'
      if (item.accent && item.label === '设备在线率') return 'good'
      if (item.accent) return 'accent'
      return ''
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/design-system.scss';

.stat-section {
  flex-shrink: 0;

  & + & {
    margin-top: 6px;
    padding-top: 8px;
    border-top: 1px solid rgba(109, 193, 192, 0.08);
  }

  &--dense {
    & + & {
      margin-top: 4px;
      padding-top: 5px;
    }

    .stat-section__head {
      gap: 6px;
      margin-bottom: 6px;
      padding: 4px 8px;
    }

    .stat-section__row {
      min-height: 52px;
    }

    .stat-cell .lbl {
      font-size: 12.5px;
      margin-bottom: 6px;
    }

    .stat-cell .val {
      font-size: 26px;

      .unit {
        font-size: 13px;
      }

      .trend-up {
        font-size: 13px;
      }
    }

    .title-txt {
      font-size: 13.5px;
    }

    .title-ic {
      width: 16px;
      height: 16px;

      svg {
        width: 16px;
        height: 16px;
      }
    }
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 10px;
    padding: 5px 10px 6px;
    background: linear-gradient(90deg, rgba(98, 168, 208, 0.13) 0%, rgba(16, 42, 72, 0.06) 55%, transparent 100%);
    border-bottom: 1px solid rgba(109, 193, 192, 0.14);
    box-shadow: inset 2px 0 0 rgba(109, 193, 192, 0.36);
    border-radius: 8px 8px 0 0;
  }

  &__row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    align-items: center;
    min-height: 68px;
  }
}

.stat-cell {
  text-align: center;
  padding: 4px 8px;
  min-width: 0;
  border-right: 1px solid rgba(109, 193, 192, 0.08);

  &--last { border-right: none; }

  .lbl {
    font-size: 13px;
    color: $ds-label;
    margin-bottom: 10px;
    line-height: 1.1;
    white-space: nowrap;
  }

  .val {
    display: inline-flex;
    align-items: baseline;
    justify-content: center;
    gap: 4px;
    font-size: 32px;
    font-weight: 700;
    color: rgba(230, 242, 255, 0.96);
    line-height: 1;
    font-family: $ds-font-num;
    font-variant-numeric: tabular-nums;
    text-shadow: none;

    .unit {
      font-size: 15px;
      font-weight: 600;
      margin-left: 1px;
      color: $ds-dim;
    }

    .trend-up {
      font-style: normal;
      font-size: 15px;
      font-weight: 700;
      color: $ds-cyan;
      transform: translateY(-1px);
    }
  }

  &.danger .val {
    color: $ds-red;
    @include ds-glow-num($ds-red);
    animation: ds-alarm-blink 2.5s ease-in-out infinite;
  }
  &.warn .val { color: $ds-orange; @include ds-glow-num($ds-orange); }
  &.fault .val { color: $ds-orange; @include ds-glow-num($ds-orange); }
  &.good .val { color: $ds-green; @include ds-glow-num($ds-green); }
}

.title-txt {
  @include ds-screen-subtitle(15px, 700);
}

.title-ic {
  width: 19px;
  height: 19px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  svg { width: 19px; height: 19px; }
  &.ic-fire { color: $ds-cyan-bright; filter: drop-shadow(0 0 10px rgba(109, 193, 192, 0.12)); }
  &.ic-power { color: $ds-data-energy; filter: drop-shadow(0 0 10px rgba(109, 193, 192, 0.12)); }
}
</style>
