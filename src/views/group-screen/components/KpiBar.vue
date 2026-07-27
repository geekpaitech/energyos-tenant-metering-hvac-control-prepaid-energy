<template>
  <div class="kpi-bar" :style="barStyle">
    <div
      v-for="item in list"
      :key="item.key"
      class="kpi-cell"
      :class="{ 'kpi-cell--alarm': !!item.extra }"
    >
      <div class="kpi-cell__head">
        <i class="kpi-cell__bar" aria-hidden="true" />
        <span class="kpi-cell__label">{{ item.label }}</span>
      </div>
      <div class="kpi-cell__body">
        <div v-if="item.extra" class="kpi-cell__alarm">
          <div class="alarm-stat r" :class="{ 'alarm-stat--on': isAlarmActive(item.extra.high) }">
            <span class="alarm-stat__lbl">高</span>
            <span class="alarm-stat__num" :class="{ 'is-empty': item.extra.high === '--' }">{{ item.extra.high }}</span>
          </div>
          <div class="alarm-stat o" :class="{ 'alarm-stat--on': isAlarmActive(item.extra.mid) }">
            <span class="alarm-stat__lbl">中</span>
            <span class="alarm-stat__num" :class="{ 'is-empty': item.extra.mid === '--' }">{{ item.extra.mid }}</span>
          </div>
          <div class="alarm-stat y" :class="{ 'alarm-stat--on': isAlarmActive(item.extra.low) }">
            <span class="alarm-stat__lbl">低</span>
            <span class="alarm-stat__num" :class="{ 'is-empty': item.extra.low === '--' }">{{ item.extra.low }}</span>
          </div>
        </div>
        <template v-else>
          <div class="kpi-cell__val">
            <span v-if="item.prefix" class="prefix">{{ item.prefix }}</span>
            <span class="num" :class="{ 'is-empty': item.value === '--' }">{{ item.value }}</span>
            <span v-if="item.unit" class="unit">{{ item.unit }}</span>
          </div>
          <div
            v-if="hasTrend(item)"
            class="kpi-cell__compare"
            :class="trendClass(item)"
          >
            <span class="kpi-cell__compare-lbl">{{ item.trendLabel || '较昨日' }}</span>
            <span class="kpi-cell__compare-val">{{ trendText(item) }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { groupScreenOss } from '../image/oss'

export default {
  name: 'KpiBar',
  props: { list: { type: Array, default: () => [] } },
  computed: {
    barStyle () {
      return {
        '--kpi-head-image': `url(${groupScreenOss.titleStripSub})`,
        '--kpi-title-icon-image': `url(${groupScreenOss.panelTitleIcon})`
      }
    }
  },
  methods: {
    hasTrend (item) {
      return item.trend != null && item.trend !== '' && !Number.isNaN(Number(item.trend))
    },
    trendText (item) {
      const n = Math.abs(item.trend)
      const arrow = item.trend >= 0 ? '↑' : '↓'
      if (item.trendIsCount) return `${arrow}${n}${item.unit || ''}`
      return `${arrow}${n}%`
    },
    trendClass (item) {
      const up = item.trend >= 0
      const good = item.trendGood != null ? (item.trendGood ? !up : up) : up
      return good ? 'up' : 'dn'
    },
    isAlarmActive (val) {
      const n = Number(val)
      return !Number.isNaN(n) && n > 0
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/design-system.scss';

$kpi-col-gap: 10px;

.kpi-bar {
  flex-shrink: 0;
  margin: 0 24px;
  padding: 0;
  box-sizing: border-box;
  display: grid;
  column-gap: 14px;
  grid-template-columns: 1.05fr 1.32fr 0.98fr 1.1fr 1.02fr 1.05fr 1.08fr;
  align-items: stretch;
  min-height: 104px;
}

.kpi-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border-radius: 8px;
  overflow: hidden;
  background:
    radial-gradient(circle at 42% 0%, rgba(82, 145, 182, 0.035), transparent 52%),
    linear-gradient(180deg, rgba(17, 40, 72, 0.94) 0%, rgba(8, 27, 54, 0.97) 100%);
  border: 1px solid rgba(82, 145, 182, 0.38);
  box-shadow:
    0 9px 18px rgba(2, 8, 16, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.035),
    inset 0 0 12px rgba(82, 145, 182, 0.025);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: $ds-card-radius;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.01) 0%, transparent 26%),
      radial-gradient(circle at 50% 0%, rgba(82, 145, 182, 0.025) 0%, transparent 58%);
    pointer-events: none;
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: $ds-card-radius;
    box-shadow:
      inset 0 0 0 1px rgba(118, 163, 203, 0.08),
      inset 0 2px 0 rgba(82, 145, 182, 0.18);
    pointer-events: none;
    z-index: 2;
  }

  &__head {
    position: relative;
    z-index: 1;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    min-height: 34px;
    padding: 0 14px;
    background: linear-gradient(90deg, rgba(65, 112, 154, 0.3) 0%, rgba(22, 52, 86, 0.38) 44%, rgba(12, 31, 58, 0.12) 100%);
    border-bottom: 1px solid rgba(82, 145, 182, 0.16);

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--kpi-head-image) left center / 100% 100% no-repeat;
      opacity: 0.14;
      filter: brightness(0.96) saturate(0.78) hue-rotate(-8deg);
      pointer-events: none;
    }
  }

  &__bar {
    position: relative;
    z-index: 1;
    flex-shrink: 0;
    width: 8px;
    height: 12px;
    margin-right: 8px;
    border-radius: 2px;
    background: var(--kpi-title-icon-image) center / contain no-repeat;
    opacity: 0.86;
    filter: drop-shadow(0 0 3px rgba(150, 187, 213, 0.18));
  }

  &__label {
    position: relative;
    z-index: 1;
    flex: 1;
    min-width: 0;
    font-size: 15px;
    font-family: $ds-font-panel;
    font-weight: 600;
    color: rgba(230, 242, 255, 0.95);
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.2px;
    text-shadow: none;
  }

  &__body {
    position: relative;
    z-index: 1;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 6px;
    padding: 0 17px;
  }

  &__val {
    display: inline-flex;
    align-items: baseline;
    flex-wrap: nowrap;
    white-space: nowrap;
    min-width: 0;
    line-height: 1;
    gap: 4px;

    .prefix {
      font-size: 15px;
      font-weight: 600;
      color: rgba(219, 226, 236, 0.86);
    }

    .num {
      @include ds-data-major(36px, #e6f2ff);
      text-shadow:
        0 0 7px rgba(230, 242, 255, 0.16),
        0 0 10px rgba(82, 145, 182, 0.12);

      &.is-empty {
        opacity: 0.22;
        text-shadow: none;
      }
    }

    .unit {
      font-size: 13px;
      font-weight: 500;
      color: rgba(219, 226, 236, 0.85);
      transform: translateY(-1px);
    }
  }

  &__compare {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    line-height: 1.2;
    white-space: nowrap;
    opacity: 0.85;

    &-lbl {
      font-size: 11.5px;
      color: rgba(160, 182, 208, 0.85);
      font-weight: 400;
    }

    &-val {
      font-size: 12.5px;
      font-weight: 600;
    }

    &.up .kpi-cell__compare-val { color: rgba(92, 184, 168, 0.88); }
    &.dn .kpi-cell__compare-val { color: rgba(232, 106, 106, 0.88); }
  }

  &__alarm {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    width: 100%;
  }

  &--alarm &__head {
    background: linear-gradient(90deg, rgba(185, 176, 124, 0.08) 0%, rgba(98, 168, 208, 0.08) 48%, transparent 100%);
    border-bottom-color: rgba(109, 193, 192, 0.08);
  }

  &--alarm &__body {
    padding: 8px 12px;
    gap: 0;
  }
}

.alarm-stat {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px 6px 9px;
  border-radius: 10px;
  background: rgba(10, 31, 60, 0.86);
  border: 1px solid rgba(82, 145, 182, 0.14);
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;

  &__lbl {
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    color: $ds-screen-muted;
    letter-spacing: 0.6px;
  }

  &__num {
    font-size: 24px;
    font-weight: 700;
    line-height: 1;
    font-family: $ds-font-num;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.2px;

    &.is-empty {
      opacity: 0.22;
      text-shadow: none;
    }
  }

  &.r {
    border-color: rgba(232, 106, 106, 0.18);
    background: rgba(232, 106, 106, 0.045);

    .alarm-stat__lbl { color: rgba(240, 160, 160, 0.88); }
    .alarm-stat__num {
      color: $ds-red;
      @include ds-glow-num($ds-red);
    }

    &.alarm-stat--on {
      background: rgba(232, 106, 106, 0.1);
      border-color: rgba(232, 106, 106, 0.3);
      box-shadow: inset 0 0 0 1px rgba(232, 106, 106, 0.06);
    }
  }

  &.o {
    border-color: rgba(212, 168, 106, 0.18);
    background: rgba(212, 168, 106, 0.045);

    .alarm-stat__lbl { color: rgba(240, 200, 140, 0.88); }
    .alarm-stat__num {
      color: $ds-orange;
      @include ds-glow-num($ds-orange);
    }

    &.alarm-stat--on {
      background: rgba(212, 168, 106, 0.1);
      border-color: rgba(212, 168, 106, 0.3);
      box-shadow: inset 0 0 0 1px rgba(212, 168, 106, 0.06);
    }
  }

  &.y {
    border-color: rgba(185, 176, 124, 0.18);
    background: rgba(185, 176, 124, 0.045);

    .alarm-stat__lbl { color: rgba(220, 210, 170, 0.86); }
    .alarm-stat__num {
      color: $ds-gold;
      @include ds-glow-num($ds-gold);
    }

    &.alarm-stat--on {
      background: rgba(185, 176, 124, 0.1);
      border-color: rgba(185, 176, 124, 0.28);
      box-shadow: inset 0 0 0 1px rgba(209, 190, 137, 0.05);
    }
  }
}
</style>
