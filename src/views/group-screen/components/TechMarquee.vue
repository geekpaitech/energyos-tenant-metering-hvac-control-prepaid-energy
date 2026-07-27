<template>
  <div
    ref="root"
    class="tech-marquee"
    :class="[
      'tech-marquee--' + variant,
      { 'tech-marquee--static': isStatic }
    ]"
    :style="{ '--cols': gridCols, '--row-h': rowHeight + 'px', '--row-gap': rowGap + 'px' }"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
  >
    <div class="tech-marquee__head">
      <span
        v-for="col in columns"
        :key="col.key"
        class="tech-marquee__th"
        :class="[col.class, col.align && 'is-' + col.align]"
      >{{ col.label }}</span>
    </div>
    <div class="tech-marquee__viewport" :style="{ height: viewportHeight + 'px' }">
      <i v-if="showScan" class="tech-marquee__scan" aria-hidden="true" />
      <div
        ref="track"
        class="tech-marquee__track"
        :class="{ 'no-transition': !transitionOn }"
        :style="trackStyle"
      >
        <div
          v-for="(item, idx) in items"
          :key="itemKey(item, idx)"
          class="tech-marquee__row"
          :class="itemClass(item)"
        >
          <slot :item="item" :index="idx" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TechMarquee',
  props: {
    items: { type: Array, default: () => [] },
    columns: { type: Array, default: () => [] },
    itemKeyField: { type: String, default: 'id' },
    itemClassField: { type: String, default: 'rowClass' },
    rowHeight: { type: Number, default: 36 },
    rowGap: { type: Number, default: 6 },
    displayRows: { type: Number, default: 0 },
    interval: { type: Number, default: 3500 },
    duration: { type: Number, default: 700 },
    variant: { type: String, default: 'bench' }
  },
  data () {
    return {
      step: 0,
      paused: false,
      transitionOn: true,
      timer: null,
      fitCount: 0,
      resizeObserver: null
    }
  },
  computed: {
    gridCols () {
      return this.columns.map(c => c.width || '1fr').join(' ')
    },
    displayCount () {
      if (this.displayRows > 0) {
        return Math.min(this.displayRows, Math.max(this.items.length, 1))
      }
      const fit = this.fitCount || this.items.length
      return Math.min(this.items.length, Math.max(1, fit))
    },
    viewportHeight () {
      if (this.displayRows > 0) {
        const gaps = Math.max(0, this.displayRows - 1)
        return this.rowHeight * this.displayRows + this.rowGap * gaps
      }
      return this.rowHeight * this.displayCount
    },
    maxStep () {
      if (this.displayRows > 0) {
        return Math.max(0, this.items.length - this.displayRows)
      }
      return Math.max(0, this.items.length - this.displayCount)
    },
    needScroll () {
      if (this.displayRows > 0) {
        return this.items.length > this.displayRows
      }
      return this.items.length > this.displayCount
    },
    isStatic () {
      return !this.needScroll
    },
    offsetY () {
      const stride = this.displayRows > 0
        ? this.rowHeight + this.rowGap
        : this.rowHeight
      return this.step * stride
    },
    trackStyle () {
      if (this.isStatic) {
        return { transform: 'none', transitionDuration: '0ms' }
      }
      return {
        transform: `translate3d(0, -${this.offsetY}px, 0)`,
        transitionDuration: this.transitionOn ? `${this.duration}ms` : '0ms'
      }
    },
    showScan () {
      return this.variant === 'rank'
    }
  },
  watch: {
    items: {
      handler () {
        this.step = 0
        this.measure()
      },
      deep: true
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.measure()
      if (typeof ResizeObserver !== 'undefined' && this.$refs.root) {
        this.resizeObserver = new ResizeObserver(() => this.measure())
        this.resizeObserver.observe(this.$refs.root)
      }
      this.start()
    })
  },
  beforeDestroy () {
    this.stop()
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
  },
  methods: {
    itemKey (item, idx) {
      if (item && item[this.itemKeyField] != null) return item[this.itemKeyField]
      return idx
    },
    itemClass (item) {
      if (!item || !this.itemClassField) return ''
      const cls = item[this.itemClassField]
      if (Array.isArray(cls)) return cls
      if (typeof cls === 'string') return cls
      return ''
    },
    measure () {
      const root = this.$refs.root
      if (!root) return
      const head = root.querySelector('.tech-marquee__head')
      const headH = head ? head.offsetHeight : 0
      const bodyH = root.clientHeight - headH
      this.fitCount = Math.max(1, Math.floor(bodyH / this.rowHeight))
      this.step = 0
      this.restart()
    },
    start () {
      this.stop()
      if (!this.needScroll) return
      this.timer = setInterval(() => this.next(), this.interval)
    },
    restart () {
      this.$nextTick(() => this.start())
    },
    stop () {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },
    next () {
      if (this.paused || !this.needScroll) return

      if (this.step >= this.maxStep) {
        this.transitionOn = false
        this.step = 0
        this.$nextTick(() => {
          requestAnimationFrame(() => {
            this.transitionOn = true
          })
        })
      } else {
        this.transitionOn = true
        this.step += 1
      }
    },
    resizeCharts () {
      this.measure()
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/design-system.scss';

.tech-marquee {
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.tech-marquee__head {
  display: grid;
  grid-template-columns: var(--cols);
  align-items: center;
  flex-shrink: 0;
  padding: 8px 12px 9px;
  margin-bottom: 0;
  background: linear-gradient(90deg, rgba(98, 168, 208, 0.11) 0%, rgba(12, 40, 72, 0.04) 100%);
  border-bottom: 1px solid rgba(109, 193, 192, 0.09);
  border-radius: 0;
}

.tech-marquee__th {
  font-size: 13px;
  font-weight: 600;
  color: rgba(196, 220, 244, 0.9);
  text-align: center;
  padding: 0 4px;
  white-space: nowrap;

  &.is-left { text-align: left; padding-left: 10px; }
}

.tech-marquee--bench {
  flex: 1;
  min-height: 0;
  border-radius: 0;
  overflow: hidden;
  background: transparent;

  .tech-marquee__head {
    background: rgba(98, 168, 208, 0.07);
    border-bottom: 1px solid rgba(109, 193, 192, 0.12);
  }

  .tech-marquee__viewport {
    flex-shrink: 0;
  }

  .tech-marquee__track {
    display: flex;
    flex-direction: column;
    gap: var(--row-gap, 0);
  }

  .tech-marquee__row {
    flex-shrink: 0;
    padding: 0 10px;
    column-gap: 8px;
    border-bottom: 1px solid rgba(109, 193, 192, 0.07);
    border-radius: 0;
    background: transparent;

    &:nth-child(even) {
      background: rgba(98, 168, 208, 0.03);
    }

    &:last-child {
      border-bottom: none;
    }
  }

  /* 短板行：弱红背景 + 左侧 3px 色条（在 metric cell 内通过 .bench-short-bar 实现） */
  .tech-marquee__row.is-short {
    background: linear-gradient(90deg, rgba(212, 138, 106, 0.07) 0%, rgba(98, 168, 208, 0.02) 60%);
    box-shadow: inset 3px 0 0 rgba(212, 168, 106, 0.6);
  }

  &:not(.tech-marquee--static) .tech-marquee__viewport {
    mask-image: none;
  }
}

.tech-marquee--rank {
  .tech-marquee__head {
    padding-bottom: 4px;
  }

  .tech-marquee__th {
    font-size: 13px;
    color: $ds-label;
  }

  .tech-marquee__viewport {
    mask-image: linear-gradient(180deg, transparent 0%, #000 5%, #000 90%, transparent 100%);
  }

  .tech-marquee__track {
    transition-timing-function: cubic-bezier(0.33, 0, 0.2, 1);
  }

  /* 排行：1px 激光扫描线，不用色块聚光灯 */
  .tech-marquee__scan {
    height: 1px;
    margin-top: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(109, 193, 192, 0.06) 18%,
      rgba(122, 214, 212, 0.22) 50%,
      rgba(109, 193, 192, 0.06) 82%,
      transparent 100%
    );
    box-shadow: 0 0 10px rgba(109, 193, 192, 0.08);
    opacity: 0.75;
    animation: tech-marquee-laser 5s linear infinite;
  }
}

.tech-marquee--rank:not(.tech-marquee--static) {
  .tech-marquee__viewport {
    mask-image: linear-gradient(180deg, transparent 0%, #000 5%, #000 90%, transparent 100%);
  }
}

.tech-marquee--rank.tech-marquee--static {
  .tech-marquee__viewport {
    mask-image: linear-gradient(180deg, transparent 0%, #000 5%, #000 90%, transparent 100%);
  }
}

.tech-marquee--static {
  .tech-marquee__viewport {
    overflow: visible;
    mask-image: none;
    flex: 0 0 auto;
  }

  .tech-marquee__track {
    will-change: auto;
  }
}

.tech-marquee__viewport {
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.tech-marquee__scan {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  z-index: 2;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(109, 193, 192, 0.2), transparent);
  animation: tech-marquee-scan 4.5s linear infinite;
}

.tech-marquee__track {
  will-change: transform;
  transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);

  &.no-transition {
    transition: none;
  }
}

.tech-marquee__row {
  display: grid;
  grid-template-columns: var(--cols);
  align-items: center;
  height: var(--row-h);
  box-sizing: border-box;
  font-size: 13.5px;
  color: rgba(245, 250, 255, 0.96);
  font-variant-numeric: tabular-nums;
  transition: background-color 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    background: rgba(109, 193, 192, 0.055);
    box-shadow: inset 2px 0 0 rgba(109, 193, 192, 0.35);
  }
}

.tech-marquee--bench .tech-marquee__th {
  font-size: 14px;
  color: rgba(219, 226, 236, 0.88);
  font-weight: 600;
}

@keyframes tech-marquee-scan {
  0% { top: 0; opacity: 0; }
  8% { opacity: 1; }
  92% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

@keyframes tech-marquee-laser {
  0% { top: 0; opacity: 0.15; }
  6% { opacity: 0.55; }
  94% { opacity: 0.55; }
  100% { top: 100%; opacity: 0.15; }
}
</style>
