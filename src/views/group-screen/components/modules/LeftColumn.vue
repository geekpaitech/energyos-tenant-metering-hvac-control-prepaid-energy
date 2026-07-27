<template>
  <div class="col-left">
    <panel-box title="安全风控与运维" tier="secondary" class="blk blk-safety">
      <stat-section :title="fireSafety.title" :items="fireSafety.metrics" dense />
      <stat-section :title="powerSafety.title" :items="powerSafety.metrics" dense />
    </panel-box>

    <panel-box title="视频AI风控" tier="secondary" class="blk blk-video">
      <div class="video-module">
        <div class="video-tv">
          <div class="video-tv__shell">
            <span class="video-tv__led" aria-hidden="true" />
            <span class="video-tv__live">LIVE</span>
            <div class="video-tv__screen">
              <i class="video-tv__corner video-tv__corner--tl" aria-hidden="true" />
              <i class="video-tv__corner video-tv__corner--tr" aria-hidden="true" />
              <i class="video-tv__corner video-tv__corner--bl" aria-hidden="true" />
              <i class="video-tv__corner video-tv__corner--br" aria-hidden="true" />
              <div class="video-stage__media">
                <img
                  v-for="(url, idx) in videoSnapshots"
                  :key="url"
                  class="video-stage__img"
                  :class="{ 'video-stage__img--active': idx === videoSlideIndex }"
                  :src="url"
                  alt=""
                />
              </div>
              <div class="video-stage__shade video-stage__shade--top" aria-hidden="true" />
              <div class="video-stage__scan" aria-hidden="true" />
              <div class="video-stage__meta">
                <span class="video-stage__cam">{{ cameraName }}</span>
              </div>
              <span class="video-stage__time">{{ nowTime }}</span>
              <div v-if="videoSnapshots.length > 1" class="video-stage__dots" aria-hidden="true">
                <i
                  v-for="(_, idx) in videoSnapshots"
                  :key="idx"
                  class="video-stage__dot"
                  :class="{ 'video-stage__dot--active': idx === videoSlideIndex }"
                />
              </div>
            </div>
            <div class="video-tv__chin" aria-hidden="true">
              <i class="video-tv__chin-bar" />
            </div>
          </div>
        </div>
        <aside class="video-side">
          <div class="video-side__stat video-side__stat--alert">
            <span class="video-side__lbl">今日触发告警</span>
            <span class="video-side__val">{{ videoAi.alertCount }}<i>次</i></span>
          </div>
          <div class="video-side__stat">
            <span class="video-side__lbl">已处置</span>
            <span class="video-side__val">{{ videoAi.handledCount }}<i>次</i></span>
          </div>
          <div class="video-side__stat video-side__stat--rate">
            <span class="video-side__lbl">处置率</span>
            <span class="video-side__val">{{ videoAi.handleRate }}<i>%</i></span>
          </div>
          <div class="video-side__stat video-side__stat--cam">
            <span class="video-side__lbl">监控点位</span>
            <span class="video-side__val">{{ videoSnapshots.length }}<i>路</i></span>
          </div>
        </aside>
      </div>
    </panel-box>

    <panel-box title="仓库管理" tier="secondary" class="blk blk-warehouse">
      <div class="warehouse-module">
        <div class="warehouse-kpi">
          <div class="warehouse-kpi__item">
            <span class="warehouse-kpi__lbl">物料总量</span>
            <span class="warehouse-kpi__val">{{ formatCount(warehouse.materialCount) }}<i>种</i></span>
          </div>
          <div class="warehouse-kpi__item">
            <span class="warehouse-kpi__lbl">物料类别</span>
            <span class="warehouse-kpi__val">{{ formatCount(warehouse.categoryCount) }}<i>类</i></span>
          </div>
          <div class="warehouse-kpi__item warehouse-kpi__item--price">
            <span class="warehouse-kpi__lbl">库存总价值</span>
            <span class="warehouse-kpi__val">{{ formatMoneyBrief(warehouse.totalPrice) }}</span>
          </div>
        </div>

        <div class="warehouse-ratio">
          <header class="warehouse-ratio__head">
            <span class="warehouse-ratio__title">类别价值占比</span>
            <span class="warehouse-ratio__info" title="仅展示占比前5的类别，其余合并为「其他」">i</span>
          </header>

          <div class="warehouse-ratio__body">
            <div class="warehouse-ratio__chart">
              <div
                class="warehouse-donut"
                :style="warehouseDonutStyle"
                @mouseleave="donutHover = null"
              >
                <svg class="warehouse-donut__svg" viewBox="0 0 100 100" aria-hidden="true">
                  <path
                    v-for="slice in warehouseDonutSlices"
                    :key="slice.name"
                    :d="slice.path"
                    class="warehouse-donut__slice"
                    @mouseenter="donutHover = slice"
                  >
                    <title>{{ slice.name }} {{ slice.pct }}%</title>
                  </path>
                </svg>
                <div
                  v-if="donutHover"
                  class="warehouse-donut__tip"
                  :style="donutHover.tipStyle"
                >
                  <span class="warehouse-donut__tip-name">{{ donutHover.name }}</span>
                  <span class="warehouse-donut__tip-meta">{{ donutHover.pct }}% · ¥{{ formatMoney(donutHover.amount) }}</span>
                </div>
                <div class="warehouse-donut__hole">
                  <span class="warehouse-donut__lbl">总价值</span>
                  <span class="warehouse-donut__total">{{ formatMoneyBrief(warehouse.totalPrice) }}</span>
                  <span class="warehouse-donut__unit">元</span>
                </div>
              </div>
            </div>

            <div class="warehouse-ratio__table">
              <div class="wh-table__hd">
                <span>类别</span>
                <span>占比</span>
                <span>金额 (元)</span>
              </div>
              <ul class="wh-table__rows">
                <li
                  v-for="(cat, catIdx) in warehouseCategoryList"
                  :key="cat.name + catIdx"
                  class="wh-table__row"
                >
                  <span class="wh-table__name">
                    <i class="wh-table__dot" :style="{ background: warehouseColors[cat.colorIndex] }" />
                    {{ cat.name }}
                  </span>
                  <span
                    class="wh-table__pct"
                    :style="{ color: warehouseColors[cat.colorIndex] }"
                  >{{ formatPct(cat.pct) }}</span>
                  <span class="wh-table__amt">¥{{ formatMoney(cat.amount) }}</span>
                </li>
              </ul>
            </div>
          </div>

          <p class="warehouse-ratio__note">注：仅展示占比前5的类别，其余合并为「其他」</p>
        </div>
      </div>
    </panel-box>
  </div>
</template>

<script>
import PanelBox from '../PanelBox.vue'
import StatSection from '../StatSection.vue'
import { groupScreenOss } from '../../image/oss'
import { fireSafety, powerSafety, videoAi } from '../../mock'
import { getWarehouseManagement } from '@/api/groupScreen'
import { buildWarehouseScreenDto } from '../../utils/screenQuery'
import { EMPTY_WAREHOUSE, mapWarehouseManagement } from '../../utils/warehouseManagement'

const VIDEO_CAROUSEL_INTERVAL = 5000
const DESIGN_WIDTH = 1920
const DESIGN_HEIGHT = 1080
const WAREHOUSE_COLORS = [
  'rgba(74, 159, 232, 0.72)',
  'rgba(62, 200, 184, 0.68)',
  'rgba(212, 196, 144, 0.66)',
  'rgba(176, 168, 208, 0.64)',
  'rgba(120, 200, 232, 0.62)',
  '#1C3D5E'
]
const WAREHOUSE_ACCENT_COLORS = [
  '#5EB0F0',
  '#3EC8B8',
  '#D4C490',
  '#B0A8D0',
  '#78C8E8',
  '#1C3D5E'
]

export default {
  name: 'LeftColumn',
  components: { PanelBox, StatSection },
  props: {
    activeScope: { type: String, default: '全部' },
    activeTime: { type: String, default: '本月' }
  },
  data () {
    return {
      fireSafety,
      powerSafety,
      videoAi,
      warehouse: { ...EMPTY_WAREHOUSE, categories: [] },
      warehouseColors: WAREHOUSE_ACCENT_COLORS,
      warehouseDonutScaleX: 1,
      warehouseDonutScaleY: 1,
      videoSnapshots: groupScreenOss.cameraCarousel,
      videoSlideIndex: 0,
      cameraName: '南都广场1F大厅',
      nowTime: '',
      donutHover: null,
      warehouseRequestId: 0,
      clockTimer: null,
      carouselTimer: null
    }
  },
  computed: {
    warehouseDonutStyle () {
      let acc = 0
      const stops = (this.warehouse.categories || []).map((cat, i) => {
        const start = acc
        acc += Number(cat.pct) || 0
        return `${WAREHOUSE_COLORS[i % WAREHOUSE_COLORS.length]} ${start}% ${acc}%`
      })
      return {
        background: stops.length ? `conic-gradient(${stops.join(', ')})` : 'rgba(109,193,192,0.12)',
        transform: `scale(${this.warehouseDonutScaleX}, ${this.warehouseDonutScaleY})`,
        transformOrigin: 'center center'
      }
    },
    warehouseCategoryList () {
      return (this.warehouse.categories || []).map((cat, i) => ({
        ...cat,
        colorIndex: i % WAREHOUSE_ACCENT_COLORS.length
      }))
    },
    /** 环图扇区热区（悬停显示中文名） */
    warehouseDonutSlices () {
      let acc = 0
      const rOut = 50
      const rIn = 28
      return (this.warehouse.categories || []).map(cat => {
        const pct = Number(cat.pct) || 0
        const start = acc
        acc += pct
        const item = this.buildDonutItem(cat, start + pct / 2, 38)
        return {
          ...item,
          path: this.describeDonutSlice(50, 50, rOut, rIn, start, acc)
        }
      })
    }
  },
  watch: {
    activeScope () {
      this.fetchWarehouseManagement()
    }
  },
  methods: {
    async fetchWarehouseManagement () {
      const requestId = ++this.warehouseRequestId
      try {
        const dto = buildWarehouseScreenDto({ scope: this.activeScope })
        const res = await getWarehouseManagement(dto)
        if (requestId !== this.warehouseRequestId) return
        if (res && res.code === 200 && res.data) {
          this.warehouse = mapWarehouseManagement(res.data)
        } else {
          this.warehouse = { ...EMPTY_WAREHOUSE, categories: [] }
        }
      } catch (e) {
        if (requestId !== this.warehouseRequestId) return
        console.error('[group-screen] getWarehouseManagement failed', e)
        this.warehouse = { ...EMPTY_WAREHOUSE, categories: [] }
      }
    },
    polarToCartesian (cx, cy, r, angleDeg) {
      const rad = ((angleDeg - 90) * Math.PI) / 180
      return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad)
      }
    },
    describeDonutSlice (cx, cy, rOut, rIn, startPct, endPct) {
      const start = startPct * 3.6
      const end = endPct * 3.6
      const large = end - start > 180 ? 1 : 0
      const p1 = this.polarToCartesian(cx, cy, rOut, end)
      const p2 = this.polarToCartesian(cx, cy, rOut, start)
      const p3 = this.polarToCartesian(cx, cy, rIn, start)
      const p4 = this.polarToCartesian(cx, cy, rIn, end)
      return [
        `M ${p1.x} ${p1.y}`,
        `A ${rOut} ${rOut} 0 ${large} 0 ${p2.x} ${p2.y}`,
        `L ${p3.x} ${p3.y}`,
        `A ${rIn} ${rIn} 0 ${large} 1 ${p4.x} ${p4.y}`,
        'Z'
      ].join(' ')
    },
    buildDonutItem (cat, midPct, ringR) {
      const pct = Number(cat.pct) || 0
      const deg = midPct * 3.6
      const rad = ((deg - 90) * Math.PI) / 180
      const x = 50 + ringR * Math.cos(rad)
      const y = 50 + ringR * Math.sin(rad)
      return {
        name: cat.name,
        pct,
        amount: cat.amount,
        style: { left: `${x}%`, top: `${y}%` },
        tipStyle: { left: `${x}%`, top: `${Math.max(8, y - 14)}%` }
      }
    },
    buildDonutItems (ringR) {
      let acc = 0
      return (this.warehouse.categories || []).map(cat => {
        const pct = Number(cat.pct) || 0
        const mid = acc + pct / 2
        acc += pct
        return this.buildDonutItem(cat, mid, ringR)
      })
    },
    tickClock () {
      const d = new Date()
      this.nowTime = this.formatTime(d)
    },
    formatTime (d) {
      const p = n => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
    },
    formatCount (val) {
      if (val == null || val === '') return '--'
      const n = Number(val)
      if (Number.isNaN(n)) return '--'
      return n.toLocaleString()
    },
    formatMoney (val) {
      if (val == null || val === '') return '--'
      const n = Number(val)
      if (Number.isNaN(n)) return '--'
      return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    formatMoneyBrief (val) {
      if (val == null || val === '') return '--'
      const n = Number(val)
      if (Number.isNaN(n)) return '--'
      if (n >= 10000) {
        return `¥${(n / 10000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}万`
      }
      return `¥${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    },
    formatPct (val) {
      if (val == null || val === '') return '--'
      const n = Number(val)
      if (Number.isNaN(n)) return '--'
      return `${n % 1 === 0 ? n : n.toFixed(1)}%`
    },
    resizeCharts () {
      this.updateWarehouseDonutScale()
    },
    updateWarehouseDonutScale () {
      const vw = window.innerWidth || DESIGN_WIDTH
      const vh = window.innerHeight || DESIGN_HEIGHT
      const scaleX = vw / DESIGN_WIDTH
      const scaleY = vh / DESIGN_HEIGHT
      if (!scaleX || !scaleY) {
        this.warehouseDonutScaleX = 1
        this.warehouseDonutScaleY = 1
        return
      }
      if (scaleX > scaleY) {
        this.warehouseDonutScaleX = Number((scaleY / scaleX).toFixed(4))
        this.warehouseDonutScaleY = 1
      } else if (scaleY > scaleX) {
        this.warehouseDonutScaleX = 1
        this.warehouseDonutScaleY = Number((scaleX / scaleY).toFixed(4))
      } else {
        this.warehouseDonutScaleX = 1
        this.warehouseDonutScaleY = 1
      }
    }
  },
  mounted () {
    this.updateWarehouseDonutScale()
    this.tickClock()
    window.addEventListener('resize', this.updateWarehouseDonutScale)
    this.clockTimer = setInterval(() => this.tickClock(), 1000)
    this.carouselTimer = setInterval(() => {
      const len = this.videoSnapshots.length
      if (len <= 1) return
      this.videoSlideIndex = (this.videoSlideIndex + 1) % len
    }, VIDEO_CAROUSEL_INTERVAL)
    this.fetchWarehouseManagement()
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.updateWarehouseDonutScale)
    if (this.clockTimer) {
      clearInterval(this.clockTimer)
      this.clockTimer = null
    }
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer)
      this.carouselTimer = null
    }
  }
}
</script>

<style scoped lang="scss">
@import '../../styles/design-system.scss';

.col-left {
  display: grid;
  grid-template-rows: auto minmax(0, 0.88fr) minmax(0, 1.22fr);
  gap: 16px;
  height: 100%;
  min-height: 0;
}

.blk {
  min-height: 0;
  overflow: hidden;
}

.blk-safety {
  ::v-deep .ds-panel__body {
    padding: 6px 10px 8px;
  }

  ::v-deep .ds-panel__head-scan::after {
    animation-delay: -2.7s;
  }

  ::v-deep .ds-panel__bar {
    animation-delay: -1.3s;
  }
}

.blk-video {
  min-height: 0;
  display: flex;
  flex-direction: column;

  ::v-deep .ds-panel__body {
    flex: 1 1 0;
    min-height: 0;
    padding: $ds-panel-body-pad;
    box-sizing: border-box;
    overflow: hidden;
  }
}

.blk-warehouse {
  min-height: 0;
  display: flex;
  flex-direction: column;

  ::v-deep .ds-panel__body {
    flex: 1 1 0;
    min-height: 0;
    padding: $ds-panel-body-pad;
    box-sizing: border-box;
    overflow: hidden;
  }
}

/* ── 视频 AI：画面 + 侧栏指标 ── */
.video-module {
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  align-items: stretch;
  gap: 12px;
  box-sizing: border-box;
}

.video-tv {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  width: auto;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  &__shell {
    position: relative;
    flex: 1;
    min-height: 0;
    width: 100%;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    padding: 0;
    box-sizing: border-box;
    background: none;
    border: none;
    box-shadow: none;
  }

  &__led {
    position: absolute;
    top: 8px;
    left: 8px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: $ds-cyan-bright;
    box-shadow: 0 0 10px rgba(109, 193, 192, 0.16);
    z-index: 5;
    animation: video-tv-led 2.4s ease-in-out infinite;
  }

  &__live {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 5;
    padding: 2px 6px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0;
    color: rgba(255, 230, 230, 0.96);
    background: rgba($ds-red, 0.48);
    border: 1px solid rgba($ds-red, 0.18);
    border-radius: 2px;
  }

  &__screen {
    position: relative;
    flex: 1;
    min-height: 120px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    border-radius: 12px;
    overflow: hidden;
    background: rgba(8, 18, 31, 0.92);
    border: none;
    box-shadow: none;
  }

  &__corner {
    position: absolute;
    width: 12px;
    height: 12px;
    z-index: 3;
    pointer-events: none;
    border-color: rgba(109, 193, 192, 0.16);
    border-style: solid;
    border-width: 0;

    &--tl {
      top: 6px;
      left: 6px;
      border-top-width: 1px;
      border-left-width: 1px;
    }

    &--tr {
      top: 6px;
      right: 6px;
      border-top-width: 1px;
      border-right-width: 1px;
    }

    &--bl {
      bottom: 6px;
      left: 6px;
      border-bottom-width: 1px;
      border-left-width: 1px;
    }

    &--br {
      bottom: 6px;
      right: 6px;
      border-bottom-width: 1px;
      border-right-width: 1px;
    }
  }

  &__chin {
    display: none;
  }
}

.video-stage {
  &__media {
    position: absolute;
    inset: 0;
  }

  &__img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    filter: brightness(1.1) contrast(1.06) saturate(1.02);
    opacity: 0;
    transition: opacity 0.85s ease;

    &--active {
      opacity: 1;
    }
  }

  &__shade {
    position: absolute;
    left: 0;
    right: 0;
    height: 32px;
    pointer-events: none;
    z-index: 2;

    &--top {
      top: 0;
      background: linear-gradient(180deg, rgba(12, 34, 62, 0.62) 0%, transparent 100%);
    }
  }

  &__scan {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(255, 255, 255, 0.02) 2px,
      rgba(255, 255, 255, 0.02) 4px
    );
    opacity: 0.35;
  }

  &__meta {
    position: absolute;
    top: 8px;
    left: 22px;
    right: 68px;
    z-index: 3;
    pointer-events: none;
  }

  &__cam {
    display: inline-block;
    max-width: 100%;
    padding: 2px 7px;
    border-radius: 2px;
    font-size: 11px;
    line-height: 1.3;
    color: rgba(245, 250, 255, 0.96);
    background: rgba(16, 42, 72, 0.16);
    border: 1px solid rgba(109, 193, 192, 0.12);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__time {
    position: absolute;
    top: 30px;
    right: 10px;
    z-index: 3;
    padding: 2px 6px;
    border-radius: 2px;
    font-size: 10px;
    line-height: 1.3;
    color: rgba(245, 250, 255, 0.92);
    background: rgba(16, 42, 72, 0.14);
    border: 1px solid rgba(109, 193, 192, 0.1);
    font-variant-numeric: tabular-nums;
    pointer-events: none;
  }

  &__dots {
    position: absolute;
    bottom: 9px;
    left: 0;
    right: 0;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    pointer-events: none;
  }

  &__dot {
    width: 8px;
    height: 3px;
    border-radius: 2px;
    background: rgba(200, 220, 240, 0.22);
    box-shadow: inset 0 0 0 1px rgba(180, 210, 235, 0.08);
    transition: background 0.3s ease, transform 0.3s ease, width 0.3s ease, box-shadow 0.3s ease;

    &--active {
      background: $ds-cyan-bright;
      width: 14px;
      box-shadow: 0 0 10px rgba(109, 193, 192, 0.16);
      transform: none;
    }
  }
}

@keyframes video-tv-led {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

.video-side {
  flex: 0 0 128px;
  min-width: 128px;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;

  &__stat {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    column-gap: 8px;
    padding: 7px 2px 7px 0;
    border-radius: 0;
    background: transparent;
    border: none;
    box-shadow: none;

    & + & {
      border-top: 1px solid rgba(109, 193, 192, 0.12);
    }
  }

  &__lbl {
    min-width: 0;
    font-size: 12.5px;
    font-weight: 600;
    color: rgba(220, 236, 252, 0.96);
    line-height: 1.2;
    white-space: normal;
  }

  &__val {
    justify-self: end;
    font-size: 22px;
    font-weight: 700;
    line-height: 1;
    color: rgba(245, 250, 255, 0.98);
    font-variant-numeric: tabular-nums;
    font-family: $ds-font-num;

    i {
      font-style: normal;
      font-size: 11.5px;
      font-weight: 500;
      margin-left: 3px;
      color: $ds-screen-unit;
    }
  }

  &__stat--alert {
    .video-side__val {
      color: $ds-red;
      @include ds-glow-num($ds-red);
    }
  }

  &__stat--rate {
    .video-side__val {
      color: $ds-cyber;
      @include ds-glow-num($ds-cyber);
    }
  }

  &__stat--cam {
    .video-side__val {
      color: rgba(220, 236, 252, 0.96);
    }
  }
}

/* ── 仓库管理：KPI + 类别价值占比 ── */
.warehouse-module {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  overflow: hidden;
}

.warehouse-kpi {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  border: 1px solid rgba(109, 193, 192, 0.18);
  border-radius: 4px;
  background: linear-gradient(180deg, rgba(18, 52, 86, 0.36) 0%, rgba(5, 23, 52, 0.46) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 0 16px rgba(109, 193, 192, 0.06);
  overflow: hidden;

  &__item {
    min-width: 0;
    padding: 4px 6px 5px;
    text-align: center;
    border-right: 1px solid rgba(109, 193, 192, 0.12);

    &:last-child {
      border-right: none;
    }
  }

  &__lbl {
    display: block;
    font-size: 11px;
    color: rgba(219, 226, 236, 0.9);
    margin-bottom: 2px;
    white-space: nowrap;
  }

  &__val {
    display: block;
    font-size: 16px;
    font-weight: 700;
    color: $ds-value-text;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    i {
      font-size: 11px;
      font-style: normal;
      font-weight: 500;
      margin-left: 1px;
      color: rgba(169, 201, 223, 0.88);
    }
  }

  &__item--price {
    background: linear-gradient(180deg, rgba(30, 68, 114, 0.22) 0%, rgba(14, 34, 67, 0.1) 100%);
    box-shadow: inset 0 0 12px rgba(109, 193, 192, 0.05);
  }

  &__item--price &__lbl {
    color: rgba(219, 226, 236, 0.94);
    font-weight: 600;
  }

  &__item--price &__val {
    font-size: 16px;
    @include ds-value-highlight;
  }
}

.warehouse-ratio {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px 5px;
  border: 1px solid rgba(109, 193, 192, 0.16);
  border-radius: 4px;
  background: linear-gradient(180deg, rgba(18, 52, 86, 0.3) 0%, rgba(5, 23, 52, 0.42) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 0 14px rgba(109, 193, 192, 0.055);
  overflow: hidden;

  &__head {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 0;
  }

  &__title {
    font-size: 13px;
    font-weight: 700;
    color: rgba(247, 251, 255, 0.96);
    line-height: 1.3;
  }

  &__info {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 1px solid rgba(109, 193, 192, 0.26);
    font-size: 9px;
    font-style: italic;
    font-weight: 600;
    color: rgba(169, 201, 223, 0.82);
    cursor: help;
    flex-shrink: 0;
  }

  &__body {
    flex: 1 1 0;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 0.82fr) minmax(0, 1.18fr);
    gap: 6px;
    align-items: center;
  }

  &__chart {
    min-width: 0;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__table {
    min-width: 0;
    min-height: 0;
    align-self: stretch;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__note {
    flex-shrink: 0;
    margin: 0;
    font-size: 10px;
    color: rgba(169, 201, 223, 0.85);
    line-height: 1.35;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.warehouse-donut {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
  box-shadow:
    inset 0 0 0 1px rgba(109, 193, 192, 0.18),
    0 0 18px rgba(109, 193, 192, 0.12);

  &__svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 3;
  }

  &__slice {
    fill: transparent;
    stroke: none;
    pointer-events: all;
    cursor: pointer;

    &:hover {
      fill: rgba(255, 255, 255, 0.1);
    }
  }

  &__tip {
    position: absolute;
    z-index: 5;
    transform: translate(-50%, -100%);
    padding: 4px 6px;
    border-radius: 4px;
    background: rgba(12, 34, 62, 0.96);
    border: 1px solid rgba(109, 193, 192, 0.22);
    box-shadow: 0 0 12px rgba(109, 193, 192, 0.12);
    pointer-events: none;
    white-space: nowrap;
    text-align: center;
  }

  &__tip-name {
    display: block;
    font-size: 10px;
    font-weight: 600;
    color: rgba(245, 250, 255, 0.98);
    line-height: 1.3;
  }

  &__tip-meta {
    display: block;
    margin-top: 1px;
    font-size: 9px;
    color: $ds-label;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
  }

  &__hole {
    position: absolute;
    inset: 28%;
    border-radius: 50%;
    background: rgba(14, 34, 67, 0.9);
    border: 1px solid rgba(109, 193, 192, 0.2);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    padding: 2px;
    box-sizing: border-box;
    z-index: 2;
    box-shadow:
      inset 0 0 10px rgba(109, 193, 192, 0.08),
      0 0 12px rgba(109, 193, 192, 0.1);
  }

  &__lbl {
    font-size: 9px;
    color: rgba(219, 226, 236, 0.9);
    line-height: 1;
    white-space: nowrap;
  }

  &__total {
    font-size: 12px;
    font-weight: 700;
    text-align: center;
    line-height: 1.2;
    white-space: nowrap;
    @include ds-value-highlight;
  }

  &__unit {
    font-size: 8px;
    color: rgba(169, 201, 223, 0.86);
    line-height: 1;
  }
}

.wh-table {
  &__hd {
    display: grid;
    grid-template-columns: 1.1fr 0.55fr 0.85fr;
    gap: 5px;
    padding: 0 2px 4px;
    border-bottom: 1px solid rgba(109, 193, 192, 0.12);
    font-size: 12px;
    color: rgba(225, 234, 248, 0.94);
    line-height: 1.3;

    span:nth-child(2) {
      text-align: center;
    }

    span:nth-child(3) {
      text-align: right;
    }
  }

  &__rows {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
    min-height: 0;
    overflow: hidden;
  }

  &__row {
    display: grid;
    grid-template-columns: 1.1fr 0.55fr 0.85fr;
    gap: 5px;
    align-items: center;
    min-height: 24px;
    padding: 3px 2px;
    border-bottom: 1px solid rgba(109, 193, 192, 0.08);
    font-size: 12px;
    line-height: 1.3;

    &:last-child {
      border-bottom: none;
    }
  }

  &__name {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    color: rgba(247, 251, 255, 0.97);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__dot {
    flex-shrink: 0;
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  &__pct {
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  &__amt {
    text-align: right;
    font-size: 12px;
    color: rgba(247, 251, 255, 0.96);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
