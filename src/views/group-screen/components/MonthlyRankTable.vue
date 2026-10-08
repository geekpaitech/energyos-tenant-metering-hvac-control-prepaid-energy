<template>
  <div ref="root" class="monthly-rank">
    <div class="monthly-rank__head">
      <span class="th th--rank">序号</span>
      <span class="th th--name">项目</span>
      <span class="th">巡检</span>
      <span class="th">维保</span>
      <span class="th">三关</span>
      <span class="th">安全</span>
      <span class="th">品质</span>
      <span class="th th--total">得分</span>
    </div>
    <div v-if="loading" class="monthly-rank__body monthly-rank__body--loading" aria-busy="true">
      <div
        v-for="i in minDisplayRows"
        :key="'sk-' + i"
        class="monthly-rank__row monthly-rank__row--skeleton"
      >
        <span class="td td--rank"><i class="sk sk--badge" /></span>
        <span class="td td--name"><i class="sk sk--line sk--name" /></span>
        <span v-for="c in 5" :key="c" class="td"><i class="sk sk--line sk--cell" /></span>
        <span class="td td--total"><i class="sk sk--line sk--num" /></span>
      </div>
      <div class="monthly-rank__loading-tip">
        <i aria-hidden="true" />
        <span>评分加载中…</span>
      </div>
    </div>
    <div v-else class="monthly-rank__body monthly-rank__body--scrollable">
      <div v-if="!rankedRows.length" class="monthly-rank__empty">暂无月度综合评分排名数据</div>
      <div
        v-for="(r, index) in rankedRows"
        :key="r.projectGuid || r.businessUnitGuid || index"
        class="monthly-rank__row"
      >
        <span class="td td--rank">
          <span class="rank-badge">{{ r.rank }}</span>
        </span>
        <span class="td td--name" :title="r.name">{{ r.name }}</span>
        <span
          class="td td--score"
          :class="scoreCellClass(r.workOrders.inspection.score)"
          :title="r.workOrders.inspection.tip"
        >{{ r.workOrders.inspection.score }}</span>
        <span
          class="td td--score"
          :class="scoreCellClass(r.workOrders.maintenance.score)"
          :title="r.workOrders.maintenance.tip"
        >{{ r.workOrders.maintenance.score }}</span>
        <span
          class="td td--score"
          :class="scoreCellClass(r.workOrders.threeClose.score)"
          :title="r.workOrders.threeClose.tip"
        >{{ r.workOrders.threeClose.score }}</span>
        <span
          class="td td--score"
          :class="scoreCellClass(r.rectification.safety.score)"
          :title="r.rectification.safety.tip"
        >{{ r.rectification.safety.score }}</span>
        <span
          class="td td--score"
          :class="scoreCellClass(r.rectification.quality.score)"
          :title="r.rectification.quality.tip"
        >{{ r.rectification.quality.score }}</span>
        <span class="td td--total">{{ r.score }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { MONTHLY_RANK_MIN_ROWS } from '../utils/monthlyScore'

export default {
  name: 'MonthlyRankTable',
  props: {
    items: { type: Array, default: () => [] },
    minDisplayRows: { type: Number, default: MONTHLY_RANK_MIN_ROWS },
    loading: { type: Boolean, default: false }
  },
  computed: {
    rankedRows () {
      const rows = Array.isArray(this.items) ? this.items : []
      return rows
        .map((row, sourceIndex) => ({ row, sourceIndex, score: Number(row.score) }))
        .sort((a, b) => {
          const aValid = Number.isFinite(a.score)
          const bValid = Number.isFinite(b.score)
          if (aValid && bValid && a.score !== b.score) return b.score - a.score
          if (aValid !== bValid) return aValid ? -1 : 1
          return a.sourceIndex - b.sourceIndex
        })
        .map(({ row }, index) => ({ ...row, rank: index + 1 }))
    }
  },
  methods: {
    /**
     * 条件着色：满分 100 弱化退后；低分（<20）琥珀跳出；'--' 占位降噪
     * 数据全保留，用视觉权重代替逐格阅读
     */
    scoreCellClass (score) {
      const n = Number(score)
      if (score === '--' || score == null || Number.isNaN(n)) return 'score--empty'
      if (n >= 100) return 'score--perfect'
      if (n < 20) return 'score--low'
      return ''
    },
    resizeCharts () {}
  }
}
</script>

<style scoped lang="scss">
@import '../styles/design-system.scss';

.monthly-rank {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 0;
  background: transparent;
}

/* 8 列：排名/项目/巡检/维保/三关/安全/品质/综合 */
.monthly-rank__head,
.monthly-rank__row {
  display: grid;
  grid-template-columns: 30px minmax(62px, 1.1fr) repeat(5, minmax(28px, 0.55fr)) 64px;
  align-items: center;
  column-gap: 4px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.monthly-rank__head {
  flex-shrink: 0;
  padding: 4px 8px 8px;
  border-bottom: 1px solid rgba(109, 193, 192, 0.12);

  .th {
    font-size: 12px;
    font-weight: 600;
    color: rgba(168, 192, 220, 0.72);
    text-align: center;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &--name {
      text-align: left;
      padding-left: 2px;
    }

    &--total {
      color: rgba(196, 220, 244, 0.95);
    }
  }
}

.monthly-rank__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;

  &--scrollable {
    overflow-x: hidden;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(98, 168, 208, 0.38) transparent;

    &::-webkit-scrollbar { width: 5px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { border-radius: 5px; background: rgba(98, 168, 208, 0.38); }
  }
}

.monthly-rank__row {
  flex: 1 1 0;
  min-height: 44px;
  max-height: 56px;
  padding: 0 8px;
  border-bottom: 1px solid rgba(109, 193, 192, 0.07);
  font-size: 12.5px;
  color: rgba(245, 250, 255, 0.96);
  font-variant-numeric: tabular-nums;

  &:nth-child(even) {
    background: rgba(98, 168, 208, 0.035);
  }

  &:last-child {
    border-bottom: none;
  }

}

.monthly-rank__empty {
  display: grid;
  flex: 1;
  place-items: center;
  color: rgba(168, 192, 220, 0.46);
  font-size: 12px;
}

.td {
  text-align: center;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &--rank {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &--name {
    text-align: left;
    padding-left: 2px;
    font-weight: 600;
    font-size: 13px;
    color: rgba(228, 238, 250, 0.95);
  }

  &--score {
    font-family: $ds-font-num;
    font-variant-numeric: tabular-nums;
    font-size: 12.5px;
    color: rgba(228, 238, 250, 0.94);
    text-overflow: clip;
  }

  &--total {
    font-weight: 700;
    font-size: 13px;
    color: $ds-cyber;
    font-family: $ds-font-num;
    text-shadow: 0 0 8px rgba(122, 214, 212, 0.25);
    text-overflow: clip;
  }
}

/* 条件着色：满分退后 / 低分跳出 / 占位降噪 */
.score--perfect {
  color: rgba(139, 165, 194, 0.48);
}

.score--low {
  color: #d49e6a;
  font-weight: 700;
  text-shadow: 0 0 6px rgba(212, 158, 106, 0.3);
}

.score--empty {
  color: rgba(168, 192, 220, 0.22);
}

/* ── 加载骨架 ── */
.monthly-rank__row--skeleton {
  cursor: default;

  .td {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: default;
  }

  .td--name {
    justify-content: flex-start;
  }

  .sk {
    display: inline-block;
    height: 12px;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      rgba(98, 168, 208, 0.08) 0%,
      rgba(122, 214, 212, 0.16) 50%,
      rgba(98, 168, 208, 0.08) 100%
    );
    background-size: 220% 100%;
    animation: monthly-rank-shimmer 1.5s linear infinite;

    &--badge {
      width: 22px;
      height: 22px;
      border-radius: 50%;
    }

    &--name {
      width: 56%;
      max-width: 110px;
    }

    &--cell {
      width: 20px;
    }

    &--num {
      width: 26px;
      height: 14px;
    }
  }
}

.monthly-rank__loading-tip {
  position: absolute;
  left: 50%;
  bottom: 8px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 26px;
  padding: 0 13px;
  border-radius: 999px;
  border: 1px solid rgba(109, 193, 192, 0.28);
  background: rgba(7, 22, 39, 0.88);
  box-shadow: 0 6px 16px rgba(2, 8, 16, 0.28);
  color: rgba(230, 242, 255, 0.88);
  font-size: 12px;
  letter-spacing: 0.4px;
  transform: translateX(-50%);
  pointer-events: none;

  i {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    border: 2px solid rgba(109, 193, 192, 0.22);
    border-top-color: rgba(122, 214, 212, 0.95);
    animation: monthly-rank-spin 0.9s linear infinite;
  }
}

@keyframes monthly-rank-shimmer {
  0% { background-position: 120% 0; }
  100% { background-position: -120% 0; }
}

@keyframes monthly-rank-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .monthly-rank__row--skeleton .sk,
  .monthly-rank__loading-tip i {
    animation: none;
  }
}

.rank-badge {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  font-family: $ds-font-num;
  border: none;
  color: rgba(184, 216, 234, 0.82);
  background: rgba(98, 168, 208, 0.12);
}

</style>
