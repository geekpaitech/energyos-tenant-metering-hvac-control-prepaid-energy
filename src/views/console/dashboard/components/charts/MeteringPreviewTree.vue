<template>
  <div class="mt-wrap" ref="wrap">
    <!--
      SVG 覆盖整个容器，坐标相对于 .mt-wrap。
      节点坐标在动画结束后才采集，保证精度。
    -->
    <svg class="mt-edges" ref="svg" :width="svgSize.w" :height="svgSize.h">
      <path
        v-for="e in edgePaths"
        :key="e.id"
        class="mt-edge"
        :class="[`is-${e.tone}`, { 'is-drawn': e.drawn }]"
        :d="e.d"
      />
    </svg>

    <!-- 列容器：flex 均分宽度，节点在列内垂直均布 -->
    <div class="mt-cols" ref="cols">
      <div
        v-for="(col, ci) in columns"
        :key="col.id || ci"
        class="mt-col"
        :ref="`col-${ci}`"
      >
        <div
          v-for="n in col.nodes"
          :key="n.id"
          :ref="`node-${n.id}`"
          class="mt-node-wrap"
        >
          <!-- badge：绝对定位在卡片上方 -->
          <div
            v-if="n.badge"
            class="mt-badge"
            :class="[`is-${n.badgeTone || 'good'}`, { 'is-visible': isNodeVisible(n.id) }]"
          >{{ n.badge }}</div>

          <div
            class="mt-card"
            :class="[
              { 'is-visible': isNodeVisible(n.id) },
              { 'mt-root': n.root },
              `tone-${n.tone || 'neutral'}`
            ]"
          >
            <span class="mt-label">{{ n.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// 卡片 transition 时长（ms），边线要等动画结束后再取坐标
const CARD_TRANSITION_MS = 240

export default {
  name: 'MeteringPreviewTree',

  props: {
    model: { type: Object, required: true },
    autoPlay: { type: Boolean, default: true },
    colDelay: { type: Number, default: 360 }, // 列间延迟
    nodeStagger: { type: Number, default: 130 }, // 列内节点错开
    loopPause: { type: Number, default: 5000 } // 展示完毕后暂停再循环
  },

  data () {
    return {
      visibleNodes: new Set(),
      svgSize: { w: 0, h: 0 },
      edgePaths: []
    }
  },

  created () {
    // 不放 data() 里，避免 Vue 响应式代理干扰；
    // watch immediate 触发时 created 已执行，_timers 必然存在
    this._timers = []
    this._resizeDebounce = null
    this._ro = null
  },

  computed: {
    columns () {
      return Array.isArray(this.model?.columns) ? this.model.columns : []
    },
    edges () {
      return Array.isArray(this.model?.edges) ? this.model.edges : []
    }
  },

  watch: {
    model: {
      handler () { this.$nextTick(this.restart) },
      deep: true,
      immediate: true
    }
  },

  mounted () {
    window.addEventListener('resize', this._onResize)
    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(() => this._onResize())
      this._ro.observe(this.$el)
    }
    this._measureSvg()
  },

  beforeDestroy () {
    window.removeEventListener('resize', this._onResize)
    this._clearAllTimers()
    if (this._resizeDebounce) clearTimeout(this._resizeDebounce)
    if (this._ro) this._ro.disconnect()
  },

  methods: {
    // ─── 工具：统一管理定时器，防止内存泄漏 ─────────────────────
    _setTimeout (fn, ms) {
      const id = setTimeout(() => {
        this._timers = this._timers.filter(t => t !== id)
        fn()
      }, ms)
      this._timers.push(id)
      return id
    },

    _clearAllTimers () {
      this._timers.forEach(id => clearTimeout(id))
      this._timers = []
    },

    // ─── 对外 API ─────────────────────────────────────────────────
    isNodeVisible (nodeId) {
      return this.visibleNodes.has(nodeId)
    },

    restart () {
      this._clearAllTimers()
      this.visibleNodes = new Set()
      this.edgePaths = []
      this._measureSvg()
      if (this.autoPlay) {
        this._setTimeout(() => this._playColumn(0), 300)
      }
    },

    // ─── 逐列 → 列内逐节点 播放 ──────────────────────────────────
    _playColumn (ci) {
      const col = this.columns[ci]
      if (!col) return

      const nodes = col.nodes || []

      nodes.forEach((n, ni) => {
        this._setTimeout(() => {
          // 替换 Set 触发 Vue 响应
          const next = new Set(this.visibleNodes)
          next.add(n.id)
          this.visibleNodes = next

          // 等卡片 transition 结束后再量坐标、画边线
          this._setTimeout(() => this._drawEdgesTo(n.id), CARD_TRANSITION_MS + 20)
        }, ni * this.nodeStagger)
      })

      // 这列所有节点出现 + 动画结束所需时间
      const colFinishMs = (nodes.length - 1) * this.nodeStagger + CARD_TRANSITION_MS + 40

      if (ci < this.columns.length - 1) {
        // 推进下一列
        this._setTimeout(() => this._playColumn(ci + 1), colFinishMs + this.colDelay)
      } else {
        // 最后一列展示完毕 → 暂停 loopPause 后重新循环
        this._setTimeout(() => this.restart(), colFinishMs + this.loopPause)
      }
    },

    // ─── 绘制以 targetId 为终点的所有边 ─────────────────────────
    _drawEdgesTo (targetId) {
      this.$nextTick(() => {
        this._measureSvg()
        this.edges.forEach((e, idx) => {
          if (e.to !== targetId) return
          if (!this.visibleNodes.has(e.from) || !this.visibleNodes.has(e.to)) return

          const edgeId = e.id || `${e.from}-${e.to}-${idx}`
          const existing = this.edgePaths.find(p => p.id === edgeId)
          if (existing?.drawn) return

          const d = this._calcEdgePath(e.from, e.to)
          if (!d) return

          const tone = e.tone || 'neutral'

          if (existing) {
            existing.d = d
            existing.drawn = true
          } else {
            // 先 push drawn:false，下一 tick 翻 true，让 CSS transition 触发
            this.edgePaths.push({ id: edgeId, d, tone, drawn: false })
            this.$nextTick(() => {
              const ep = this.edgePaths.find(p => p.id === edgeId)
              if (ep) ep.drawn = true
            })
          }
        })
      })
    },

    // ─── 精确计算折线路径 ────────────────────────────────────────
    //
    //  关键设计：
    //  foldX 取"source 列容器右边界"和"target 列容器左边界"的正中间。
    //  同一 source 出发的所有边共享完全相同的 foldX，
    //  折线在视觉上精确对齐，不受卡片宽度差异影响。
    //
    _calcEdgePath (fromId, toId) {
      const wrap = this.$el
      if (!wrap) return null
      const base = wrap.getBoundingClientRect()

      const fromCard = this._getCardEl(fromId)
      const toCard = this._getCardEl(toId)
      if (!fromCard || !toCard) return null

      const fr = fromCard.getBoundingClientRect()
      const tr = toCard.getBoundingClientRect()

      // 出发：卡片右侧垂直中心
      const x1 = Math.round(fr.right - base.left)
      const y1 = Math.round(fr.top + fr.height / 2 - base.top)
      // 到达：卡片左侧垂直中心
      const x4 = Math.round(tr.left - base.left)
      const y4 = Math.round(tr.top + tr.height / 2 - base.top)

      // foldX：用列容器边界取中，同一 source 所有线共享同一折点 x
      const fromColIdx = this._getNodeColIndex(fromId)
      const toColIdx = this._getNodeColIndex(toId)
      const fromColEl = this._getColEl(fromColIdx)
      const toColEl = this._getColEl(toColIdx)

      let foldX = Math.round((x1 + x4) / 2) // 降级方案
      if (fromColEl && toColEl) {
        const fcr = fromColEl.getBoundingClientRect()
        const tcr = toColEl.getBoundingClientRect()
        foldX = Math.round((fcr.right + tcr.left) / 2 - base.left)
      }

      if (fromColIdx === 0 && toColIdx === 1) {
        foldX += 26
      }
      const minFold = x1 + 16
      const maxFold = x4 - 16
      if (minFold < maxFold) foldX = Math.min(Math.max(foldX, minFold), maxFold)

      // 正交折线：出发右侧 → foldX → foldX → 到达左侧
      return `M${x1},${y1} L${foldX},${y1} L${foldX},${y4} L${x4},${y4}`
    },

    _getCardEl (nodeId) {
      const ref = this.$refs[`node-${nodeId}`]
      const wrap = Array.isArray(ref) ? ref[0] : ref
      return wrap ? wrap.querySelector('.mt-card') : null
    },

    _getColEl (ci) {
      if (ci < 0) return null
      const ref = this.$refs[`col-${ci}`]
      return Array.isArray(ref) ? ref[0] : ref
    },

    _getNodeColIndex (nodeId) {
      for (let ci = 0; ci < this.columns.length; ci++) {
        if ((this.columns[ci].nodes || []).some(n => n.id === nodeId)) return ci
      }
      return -1
    },

    // ─── SVG 尺寸同步 ─────────────────────────────────────────────
    _measureSvg () {
      const el = this.$el
      if (!el) return
      const r = el.getBoundingClientRect()
      this.svgSize = { w: Math.max(1, r.width), h: Math.max(1, r.height) }
    },

    _onResize () {
      if (this._resizeDebounce) clearTimeout(this._resizeDebounce)
      this._resizeDebounce = setTimeout(() => {
        this._resizeDebounce = null
        this._measureSvg()
        // 重新量所有已有边的坐标
        this.edgePaths = this.edgePaths.map(ep => {
          const edge = this.edges.find((e, idx) => (e.id || `${e.from}-${e.to}-${idx}`) === ep.id)
          if (!edge) return ep
          const d = this._calcEdgePath(edge.from, edge.to)
          return d ? { ...ep, d } : ep
        })
      }, 150)
    }
  }
}
</script>

<style lang="scss" scoped>
/* ─── 容器 ───────────────────────────────────────────────────── */
.mt-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

/* ─── SVG 边线层 ─────────────────────────────────────────────── */
.mt-edges {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  overflow: visible;
}

.mt-edge {
  fill: none;
  stroke: rgba(100, 116, 139, 0.4);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1200;
  stroke-dashoffset: 1200;
  transition: stroke-dashoffset 420ms cubic-bezier(0.4, 0, 0.2, 1);

  &.is-drawn { stroke-dashoffset: 0; }
  &.is-good  { stroke: rgba(34, 197, 94, 0.7); }
  &.is-bad   { stroke: rgba(239, 68, 68, 0.7); }
}

/* ─── 列布局 ─────────────────────────────────────────────────── */
.mt-cols {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  padding: 22px 16px 24px;
  gap: 24px;
  box-sizing: border-box;
}

.mt-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
}

/* ─── 节点包裹 ───────────────────────────────────────────────── */
.mt-node-wrap {
  position: relative;
  padding-top: 20px;
  padding-bottom: 10px;
}

/* ─── 卡片 ───────────────────────────────────────────────────── */
.mt-card {
  width: 82px;
  padding: 6px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  text-align: center;

  opacity: 0;
  transform: translateX(-10px);
  // transition 时长必须与 CARD_TRANSITION_MS 常量一致
  transition: opacity 240ms ease, transform 240ms ease;

  &.is-visible {
    opacity: 1;
    transform: translateX(0);
  }

  &.mt-root {
    width: 70px;
    background: linear-gradient(135deg, #3B82F6, #1D4ED8);
    border-color: rgba(59, 130, 246, 0.3);
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);

    .mt-label { color: #fff; }
  }

  &.tone-good { border-color: rgba(34, 197, 94, 0.45); }
  &.tone-bad  { border-color: rgba(239, 68, 68, 0.4); }
}

.mt-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #0F172A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

/* ─── Badge ───────────────────────────────────────────────────── */
.mt-badge {
  position: absolute;
  top: -4px;
  left: 50%;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 700;
  white-space: nowrap;
  z-index: 3;
  opacity: 0;
  transform: translate(-50%, 0);
  transition: opacity 200ms ease 80ms, transform 200ms ease 80ms;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);

  &.is-visible {
    opacity: 1;
    transform: translate(-50%, 0);
  }

  &:not(.is-bad) {
    background: rgba(34, 197, 94, 0.13);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #15803D;
  }

  &.is-bad {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #B91C1C;
  }
}
</style>
