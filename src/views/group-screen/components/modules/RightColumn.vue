<template>
  <div class="col-right">
    <panel-box title="项目对标与考核排名" tier="secondary" class="blk-full blk-benchmark">
      <div class="right-stack">
        <section class="sec sec--bench">
          <header class="sec-head">
            <i class="sec-head__bar" aria-hidden="true" />
            <span class="sec-head__title">KPI 达标对标</span>
            <span class="sec-head__note">口径：目标值（率类 100%）</span>
          </header>
          <div class="bench-table">
            <div class="bench-table__head">
              <span class="bt-col bt-col--metric">指标</span>
              <span class="bt-col">实际值</span>
              <span class="bt-col">目标</span>
              <span class="bt-col bt-col--gap">差距</span>
            </div>
            <div
              v-for="r in benchmarkRows"
              :key="r.metric"
              class="bench-table__row"
              :class="{ 'bench-table__row--na': r.gap == null }"
            >
              <span class="bt-col bt-col--metric bench-metric">
                {{ r.metric }}<em v-if="r.unit" class="unit">（{{ r.unit }}）</em>
              </span>
              <span class="bt-col val-proj">{{ r.project }}</span>
              <span class="bt-col val-dim">{{ r.industry }}</span>
              <span class="bt-col bt-col--gap">
                <span v-if="r.gap == null" class="gap-na">--</span>
                <span v-else class="gap-pill" :class="r.gapClass">
                  <i v-if="gapArrow(r)" class="gap-pill__arrow" aria-hidden="true">{{ gapArrow(r) }}</i>{{ gapValueText(r) }}
                </span>
              </span>
            </div>
          </div>
        </section>

        <section class="sec sec--rank">
          <header class="sec-head">
            <i class="sec-head__bar" aria-hidden="true" />
            <span class="sec-head__title">月度综合评分排名</span>
            <button type="button" class="sec-head__link" @click="openMonthlyScoreDetail">
              查看明细 <i class="el-icon-arrow-right" aria-hidden="true" />
            </button>
          </header>
          <monthly-rank-table
            ref="rankTable"
            :items="monthlyRankingList"
            :loading="rankLoading"
          />
        </section>

        <section class="sec sec--rect">
          <header class="sec-head">
            <i class="sec-head__bar" aria-hidden="true" />
            <span class="sec-head__title">安全/品质/专项整改跟踪</span>
            <button type="button" class="sec-head__link" @click="openRectificationDetail({ type: 'pending' })">
              查看明细 <i class="el-icon-arrow-right" aria-hidden="true" />
            </button>
          </header>
          <div class="rect-flow" :class="{ 'rect-flow--all-zero': rectAllZero }">
            <template v-for="(s, i) in rectificationTracking">
              <div
                :key="s.type"
                class="rect-flow__node"
                :class="{ 'rect-flow__node--clickable': ['pending', 'total', 'done'].includes(s.type) }"
                role="button"
                tabindex="0"
                @click="openRectificationDetail(s)"
                @keydown.enter="openRectificationDetail(s)"
                @keydown.space.prevent="openRectificationDetail(s)"
              >
                <span
                  class="rect-flow__circle"
                  :class="['t-' + s.type, { 'has-val': Number(s.count) > 0 }]"
                >{{ s.count }}</span>
                <span class="rect-flow__lbl">{{ s.label }}</span>
              </div>
              <span
                v-if="i < rectificationTracking.length - 1"
                :key="'lk-' + s.type"
                class="rect-flow__link"
                :class="{ 'rect-flow__link--source-split': s.type === 'done' }"
                aria-hidden="true"
              />
            </template>
          </div>
        </section>
      </div>
    </panel-box>
  </div>
</template>

<script>
import PanelBox from '../PanelBox.vue'
import MonthlyRankTable from '../MonthlyRankTable.vue'
import {
  queryMaintenanceSummary,
  queryMonthlyScoreRankings
} from '@/api/groupPropertyMingYuan'
import { buildMingYuanQuery } from '../../utils/mingYuanQuery'
import { buildBenchmarkRows } from '../../utils/screenBenchmark'
import { mapProjectScoreRankings } from '../../utils/monthlyScore'
import { mapRectificationTracking } from '../../utils/workOrderManagement'

/** 月度综合评分排名明细：跳回明源 BI 可视化（地址由明源提供，固定写死） */
const MINGYUAN_MONTHLY_SCORE_DETAIL_URL = 'https://yewu.wzjkzg.com/dp/bi-visual/app_preview/pc_portal/3a1070a3-daa7-d052-299e-1260c76c9f3c/3a22d7bc-eb3b-ce17-993c-7b9387d221ea?source_from=mip&source_func=3a22d7bc-eb3b-ce17-993c-7b9387d221ea&code=wzjkzg'

export default {
  name: 'RightColumn',
  components: { PanelBox, MonthlyRankTable },
  props: {
    activeScope: { type: String, default: '全部' },
    activeTime: { type: String, default: '本月' },
    energyManagement: { type: Object, default: null },
    deviceManagement: { type: Object, default: null },
    collectionManagement: { type: Object, default: null },
    parkingManagement: { type: Object, default: null },
    workOrderManagement: { type: Object, default: null }
  },
  data () {
    return {
      monthlyRankingList: [],
      maintenanceData: null,
      rankLoading: false,
      benchmarkRequestId: 0,
      rankRequestId: 0
    }
  },
  computed: {
    rectificationTracking () {
      return mapRectificationTracking(this.workOrderManagement)
    },
    benchmarkRows () {
      return buildBenchmarkRows({
        energy: this.energyManagement,
        device: this.deviceManagement,
        collection: this.collectionManagement,
        parking: this.parkingManagement,
        maintenance: this.maintenanceData
      })
    },
    /** 整改三项全为 0 时，流转管道整体弱化 */
    rectAllZero () {
      const list = this.rectificationTracking
      if (!list.length) return false
      return list.every(s => !(Number(s.count) > 0))
    }
  },
  watch: {
    activeScope () {
      this.fetchBenchmarkSources()
      this.fetchProjectScoreRankings()
    },
    activeTime () {
      this.fetchBenchmarkSources()
    }
  },
  mounted () {
    this.fetchBenchmarkSources()
    this.fetchProjectScoreRankings()
  },
  beforeDestroy () {},
  methods: {
    async fetchBenchmarkSources () {
      const requestId = ++this.benchmarkRequestId
      const scope = this.activeScope
      const periodDto = buildMingYuanQuery({ scope, period: this.activeTime })

      await this.fetchMaintenanceForBenchmark(periodDto, requestId)
    },
    async fetchMaintenanceForBenchmark (periodDto, requestId) {
      try {
        const data = await queryMaintenanceSummary(periodDto)
        if (requestId !== this.benchmarkRequestId) return
        this.maintenanceData = {
          completionRate: data.rate,
          plannedTasks: data.total,
          completedTasks: data.completed
        }
      } catch (e) {
        if (requestId !== this.benchmarkRequestId) return
        console.error('[group-screen] queryMaintenanceSummary failed', e)
        this.maintenanceData = null
      }
    },
    async fetchProjectScoreRankings () {
      const requestId = ++this.rankRequestId
      this.rankLoading = true
      try {
        // 月度综合评分排名本身就是月度口径：时间固定「本月」，业态仍跟随顶栏切换
        const rows = await queryMonthlyScoreRankings(buildMingYuanQuery({ scope: this.activeScope, period: '本月' }))
        if (requestId !== this.rankRequestId) return
        this.monthlyRankingList = mapProjectScoreRankings(rows)
      } catch (e) {
        if (requestId !== this.rankRequestId) return
        console.error('[group-screen] queryMonthlyScoreRankings failed', e)
        this.monthlyRankingList = mapProjectScoreRankings([])
      } finally {
        if (requestId === this.rankRequestId) this.rankLoading = false
      }
      this.$nextTick(() => {
        const table = this.$refs.rankTable
        if (table && table.resizeCharts) table.resizeCharts()
      })
    },
    gapArrow (r) {
      if (r.gapClass === 'gap-good') return '▴'
      if (r.gapClass === 'gap-bad') return '▾'
      return ''
    },
    /** 差距幅度：箭头已表达方向，数字只显示绝对值（避免负号被误读为圆点） */
    gapValueText (r) {
      if (r.gap == null) return '--'
      return Math.abs(r.gap).toFixed(1)
    },
    openRectificationDetail (item) {
      if (!item) return
      if (['pending', 'total', 'done'].includes(item.type)) this.$emit('open-property-detail', 'rectification')
      if (item.type === 'overdue') this.$emit('open-property-detail', 'hazard')
    },
    openMonthlyScoreDetail () {
      const win = window.open(MINGYUAN_MONTHLY_SCORE_DETAIL_URL, 'group-monthly-score-detail')
      if (win) {
        win.focus()
      } else if (this.$message) {
        this.$message.warning('浏览器已拦截跳转窗口，请允许弹出窗口后重试')
      }
    },
    resizeCharts () {
      this.$nextTick(() => {
        const table = this.$refs.rankTable
        if (table && table.resizeCharts) table.resizeCharts()
      })
    }
  }
}
</script>

<style scoped lang="scss">
@import '../../styles/design-system.scss';

.col-right {
  height: 100%;
  min-height: 0;
}

.blk-full {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.blk-benchmark ::v-deep.ds-panel {
  border-color: rgba(82, 145, 182, 0.24);
  box-shadow:
    0 16px 34px rgba(2, 8, 16, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.035),
    inset 0 0 22px rgba(109, 193, 192, 0.035);
}

.blk-full ::v-deep .ds-panel__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: $ds-panel-body-pad;
  box-sizing: border-box;
  overflow: hidden;
}

.right-stack {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* 扁平分区：区块间渐变分隔线 + 加大留白 */
.sec {
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 2px 2px 14px;

  & + & {
    position: relative;
    padding-top: 15px;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 10px;
      right: 10px;
      height: 1px;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(109, 193, 192, 0.18) 16%,
        rgba(109, 193, 192, 0.18) 84%,
        transparent
      );
    }
  }

  &--bench { flex: 0 0 auto; }
  &--rank { flex: 1 1 0; min-height: 0; }
  &--rect { flex: 0 0 auto; }
}

.sec-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  margin-bottom: 2px;

  &__bar {
    flex-shrink: 0;
    width: 3px;
    height: 12px;
    border-radius: 1px;
    background: linear-gradient(180deg, rgba(122, 214, 212, 0.95) 0%, rgba(98, 168, 208, 0.55) 100%);
    box-shadow: 0 0 6px rgba(109, 193, 192, 0.35);
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: rgba(226, 239, 252, 0.94);
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  &__note {
    margin-left: auto;
    font-size: 11.5px;
    color: rgba(168, 192, 220, 0.5);
    white-space: nowrap;
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin-left: auto;
    padding: 2px 0;
    border: 0;
    background: transparent;
    color: rgba(145, 207, 242, 0.9);
    font-family: inherit;
    font-size: 12px;
    cursor: pointer;

    &:hover,
    &:focus-visible {
      color: #e8f7ff;
      outline: none;
    }
  }

}

/* ── KPI 达标对标：5 条平铺，淡底面板成一整体 ── */
.bench-table {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin-top: 6px;
  padding: 2px 10px 4px;
  border-radius: 8px;
  background: rgba(98, 168, 208, 0.045);
  border: 1px solid rgba(98, 168, 208, 0.09);
  box-sizing: border-box;
}

.bench-table__head,
.bench-table__row {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) 66px 58px 86px;
  align-items: center;
  column-gap: 6px;
  box-sizing: border-box;
}

.bench-table__head {
  flex-shrink: 0;
  padding: 4px 4px 7px;
  border-bottom: 1px solid rgba(109, 193, 192, 0.14);
}

.bt-col {
  text-align: center;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &--metric {
    text-align: left;
  }

  &--gap {
    text-align: right;
    padding-right: 2px;
  }
}

.bench-table__head .bt-col {
  font-size: 12px;
  font-weight: 600;
  color: rgba(168, 192, 220, 0.68);
  letter-spacing: 0.02em;
}

.bench-table__row {
  padding: 9px 2px;
  border-bottom: 1px solid rgba(109, 193, 192, 0.08);

  &:last-of-type {
    border-bottom: none;
  }

  /* 无目标行（能耗/停车营收）：占位符弱化降噪，数据本体保持可读 */
  &--na .val-dim {
    color: rgba(168, 192, 220, 0.32);
  }
}

.bench-metric {
  color: rgba(219, 226, 236, 0.95);
  font-size: 14px;
  font-weight: 600;

  .unit {
    font-style: normal;
    font-size: 11.5px;
    font-weight: 400;
    color: $ds-label;
  }
}

.val-proj {
  color: rgba(226, 239, 252, 0.98);
  font-size: 16px;
  font-weight: 700;
  font-family: $ds-font-num;
  font-variant-numeric: tabular-nums;
}

.val-dim {
  color: rgba(168, 192, 220, 0.58);
  font-size: 13px;
  font-family: $ds-font-num;
  font-variant-numeric: tabular-nums;
}

/* 差距徽章：唯一的视觉锚点，替代整行色条/红底 */
.gap-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-width: 62px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 13.5px;
  font-weight: 700;
  font-family: $ds-font-num;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  box-sizing: border-box;

  &__arrow {
    font-style: normal;
    font-size: 9px;
    line-height: 1;
  }

  &.gap-good {
    color: $ds-cyber;
    background: rgba(122, 214, 212, 0.08);
    border: 1px solid rgba(122, 214, 212, 0.22);
  }

  &.gap-bad {
    color: #d49e6a;
    background: rgba(212, 158, 106, 0.1);
    border: 1px solid rgba(212, 158, 106, 0.24);
  }

  &.gap-zero {
    color: rgba(168, 192, 220, 0.55);
    background: rgba(98, 168, 208, 0.06);
    border: 1px solid rgba(98, 168, 208, 0.14);
  }
}

/* 无目标行的差距占位符：弱化降噪 */
.gap-na {
  font-size: 13px;
  font-family: $ds-font-num;
  color: rgba(168, 192, 220, 0.3);
}

/* ── 整改跟踪：流转管道 ── */
.rect-flow {
  flex: 0 0 auto;
  display: flex;
  align-items: flex-start;
  padding: 6px 8px 2px;
  transition: opacity 0.35s ease;

  &--all-zero {
    opacity: 0.45;
  }
}

.rect-flow__node {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.rect-flow__node--clickable {
  cursor: pointer;

  &:hover .rect-flow__circle,
  &:focus-visible .rect-flow__circle {
    border-color: rgba(212, 158, 106, 0.9);
    background: rgba(212, 158, 106, 0.1);
  }

  &:focus-visible { outline: none; }
}

.rect-flow__circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1.5px solid rgba(98, 168, 208, 0.32);
  background: rgba(8, 28, 53, 0.3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  font-family: $ds-font-num;
  font-variant-numeric: tabular-nums;
  color: rgba(219, 232, 246, 0.9);
  line-height: 1;
  box-sizing: border-box;

  &.has-val.t-pending {
    border-color: rgba(98, 168, 208, 0.75);
    color: #9cc8ec;
    box-shadow: 0 0 10px rgba(98, 168, 208, 0.28);
  }

  &.has-val.t-total {
    border-color: rgba(212, 158, 106, 0.75);
    color: #d49e6a;
    box-shadow: 0 0 10px rgba(212, 158, 106, 0.28);
  }

  &.has-val.t-done {
    border-color: rgba(122, 214, 212, 0.75);
    color: #7ad6d4;
    box-shadow: 0 0 10px rgba(122, 214, 212, 0.28);
  }

  &.has-val.t-overdue {
    border-color: rgba(212, 122, 106, 0.75);
    color: #d47a6a;
    box-shadow: 0 0 10px rgba(212, 122, 106, 0.28);
  }
}

.rect-flow__lbl {
  font-size: 12px;
  color: rgba(196, 214, 234, 0.82);
  white-space: nowrap;
}

.rect-flow__link {
  flex: 1 1 0;
  min-width: 12px;
  height: 1px;
  margin-top: 19px;
  background: linear-gradient(90deg, rgba(98, 168, 208, 0.32), rgba(98, 168, 208, 0.14));

  &--source-split {
    background: repeating-linear-gradient(
      90deg,
      rgba(168, 192, 220, 0.34),
      rgba(168, 192, 220, 0.34) 4px,
      transparent 4px,
      transparent 8px
    );
  }
}
</style>
