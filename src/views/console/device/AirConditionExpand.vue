<template>
  <div class="ac-exp-wrap">
    <div class="ac-exp-canvas" ref="canvas" @wheel.prevent="onWheel" @mousedown="onMouseDown"
      :style="{ cursor: panState ? 'grabbing' : 'grab' }">
      <div class="canvas-top-tools">
        <div class="canvas-hint">
          {{ $t('deviceConditioning.topoHint') }}
        </div>
        <el-button
          size="small"
          plain
          icon="el-icon-refresh"
          :loading="refreshLoading"
          @click.stop="$emit('refresh')"
        >
          {{ $t('deviceConditioning.topoRefresh') }}
        </el-button>
        <div class="canvas-dir-switch" @click.stop>
          <el-radio-group :value="direction" size="mini" @input="onDirectionChange">
            <el-radio-button label="vertical">
              <i class="el-icon-sort" /> {{ $t('deviceConditioning.topoVertical') }}
            </el-radio-button>
            <el-radio-button label="horizontal">
              <i class="el-icon-sort" /> {{ $t('deviceConditioning.topoHorizontal') }}
            </el-radio-button>
          </el-radio-group>
        </div>
      </div>
      <div class="zoom-indicator">
        <button class="zoom-btn" :title="$t('deviceConditioning.topoZoomOut')" @click.stop="zoomOut">－</button>
        <span class="zoom-val">{{ Math.round(scale * 100) }}%</span>
        <button class="zoom-btn" :title="$t('deviceConditioning.topoZoomIn')" @click.stop="zoomIn">＋</button>
        <span class="zi-sep" />
        <button class="zoom-btn" :title="$t('deviceConditioning.topoFocusRoot')" @click.stop="focusRoot">⌂</button>
        <button class="zoom-btn" :disabled="!selectedId" :title="$t('deviceConditioning.topoFocusSelected')" @click.stop="focusSelected">◎</button>
        <button class="zoom-btn reset-btn" :title="$t('deviceConditioning.topoResetView')" @click.stop="resetView">⊙</button>
      </div>

      <div ref="inner" class="ac-exp-inner" :class="{ 'dir-v': direction === 'vertical' }" :style="canvasStyle">
        <air-condition-tree-node
          v-if="tree && tree.id"
          :node="tree"
          :selected-id="selectedId"
          :direction="direction"
          :max-visible-children="maxVisibleChildren"
          @select="$emit('select', $event)"
          @view-outdoor="$emit('view-outdoor', $event)"
          @view-air="$emit('view-air', $event)"
          @start-canvas-drag="onMouseDown"
          @more-children="$emit('more-children', $event)"
        />
        <el-empty v-else :description="$t('deviceConditioning.topoEmptyData')" />
      </div>
    </div>
  </div>
</template>

<script>
import AirConditionTreeNode from './AirConditionTreeNode.vue'

const ZOOM_STEP = 0.08
const ZOOM_MIN = 0.2
const ZOOM_MAX = 2.5
const ZOOM_MIN_VERTICAL = 0.4

export default {
  name: 'AirConditionExpand',
  components: { AirConditionTreeNode },
  props: {
    managerName: { type: String, default: '' },
    dataList: { type: Array, default: () => [] },
    direction: { type: String, default: 'horizontal' },
    selectedId: { type: [String, Number], default: null },
    maxVisibleChildren: { type: Number, default: 8 },
    /** 拓扑「刷新」请求中（由父级传入 outdoorLoading） */
    refreshLoading: { type: Boolean, default: false }
  },
  data () {
    return {
      scale: 1,
      tx: 0,
      ty: 0,
      panState: null,
      tree: null,
      wrapMaxWidth: 960
    }
  },
  computed: {
    canvasStyle () {
      return {
        transform: `translate(${this.tx}px,${this.ty}px) scale(${this.scale})`,
        transformOrigin: '0 0',
        cursor: this.panState ? 'grabbing' : 'default',
        '--tn-wrap-max': `${this.wrapMaxWidth}px`
      }
    }
  },
  watch: {
    dataList: {
      immediate: true,
      handler () {
        this.buildTree()
      }
    },
    managerName () {
      this.buildTree()
    },
    direction () {
      this.$nextTick(() => {
        this.fitView()
      })
    }
  },
  mounted () {
    window.addEventListener('resize', this.fitView)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.fitView)
    this.unbindPanEvents()
  },
  methods: {
    onDirectionChange (val) {
      this.$emit('update:direction', val)
    },
    getZoomMin () {
      return this.direction === 'vertical' ? ZOOM_MIN_VERTICAL : ZOOM_MIN
    },
    getCanvasMetrics () {
      if (!this.$refs.canvas || !this.$refs.inner) return null
      const canvas = this.$refs.canvas
      const inner = this.$refs.inner
      const cs = window.getComputedStyle(canvas)
      const padL = parseFloat(cs.paddingLeft) || 0
      const padR = parseFloat(cs.paddingRight) || 0
      const padT = parseFloat(cs.paddingTop) || 0
      const padB = parseFloat(cs.paddingBottom) || 0
      const availW = Math.max(0, canvas.clientWidth - padL - padR)
      const availH = Math.max(0, canvas.clientHeight - padT - padB)
      const contentW = Math.max(1, inner.scrollWidth)
      const contentH = Math.max(1, inner.scrollHeight)
      return { canvas, inner, padL, padR, padT, padB, availW, availH, contentW, contentH }
    },
    clampTranslation (scale = this.scale) {
      const m = this.getCanvasMetrics()
      if (!m) return
      const minTx = m.availW - m.contentW * scale - 20
      const maxTx = 20
      const minTy = m.availH - m.contentH * scale - 20
      const maxTy = 20
      this.tx = Math.min(maxTx, Math.max(minTx, this.tx))
      this.ty = Math.min(maxTy, Math.max(minTy, this.ty))
    },
    applyZoom (nextScale, anchor) {
      const m = this.getCanvasMetrics()
      if (!m) return
      const s0 = this.scale
      const s1 = Math.max(this.getZoomMin(), Math.min(ZOOM_MAX, nextScale))
      if (Math.abs(s1 - s0) < 1e-6) return
      const ax = anchor && Number.isFinite(anchor.x) ? anchor.x : m.availW / 2
      const ay = anchor && Number.isFinite(anchor.y) ? anchor.y : m.availH / 2
      const wx = (ax - this.tx) / Math.max(0.001, s0)
      const wy = (ay - this.ty) / Math.max(0.001, s0)
      this.scale = s1
      this.tx = ax - wx * s1
      this.ty = ay - wy * s1
      this.updateWrapMaxWidth()
      this.clampTranslation(s1)
      this.$nextTick(() => {
        this.clampTranslation(this.scale)
      })
    },
    updateWrapMaxWidth () {
      const canvas = this.$refs.canvas
      if (!canvas) return
      const cs = window.getComputedStyle(canvas)
      const padL = parseFloat(cs.paddingLeft) || 0
      const padR = parseFloat(cs.paddingRight) || 0
      const availW = Math.max(0, canvas.clientWidth - padL - padR)
      const next = Math.max(520, Math.floor(availW / Math.max(0.001, this.scale)) - 40)
      this.wrapMaxWidth = Math.max(1400, next) // 改为最小1400，让它能尽量展开
    },
    normalizeAirList (airList) {
      if (Array.isArray(airList)) return airList
      if (typeof airList !== 'string') return []
      try {
        const parsed = JSON.parse(airList)
        return Array.isArray(parsed) ? parsed : []
      } catch (e) {
        return []
      }
    },
    normalizeMeterInfoList (row) {
      const result = []
      const rawMeterList = row ? row.meterList : null
      if (Array.isArray(rawMeterList) && rawMeterList.length > 0) {
        rawMeterList.forEach(item => {
          if (!item) return
          if (typeof item === 'string') {
            const s = String(item).trim()
            if (!s) return
            result.push({ name: s, serial: s })
            return
          }
          const serial = item.serial != null ? String(item.serial).trim() : ''
          const name = (item.meterName || item.name || serial || '').toString().trim()
          if (!name && !serial) return
          result.push({ name: name || serial, serial })
        })
      }
      if (row && row.serial) {
        String(row.serial)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean)
          .forEach(s => result.push({ name: s, serial: s }))
      }
      const seen = new Set()
      return result.filter(m => {
        const key = (m.serial || m.name || '').trim()
        if (!key) return false
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    },
    truncate (text, maxLen) {
      const str = String(text || '')
      if (str.length <= maxLen) return str
      return str.slice(0, maxLen - 1) + '…'
    },
    buildTree () {
      const list = Array.isArray(this.dataList) ? this.dataList : []
      const rootName = this.managerName || list[0]?.managerName || this.$t('deviceConditioning.currentProject')
      const root = {
        id: 'root',
        type: 'root',
        name: rootName,
        children: list.map((row, idx) => {
          const id = row.id || row.addr || `outdoor_${idx}`
          const outdoorName = this.$displayBizHybrid(row.name || row.addr || '--', 80)
          const airs = this.normalizeAirList(row.airList).map((a, aIdx) => {
            const airId = a.id != null && a.id !== '' ? a.id : a.indoorUnitId
            return {
              id: airId || `air_${id}_${aIdx}`,
              type: 'device',
              rawType: 'air',
              name: this.truncate(this.$displayDynamicName(a.name || a.indoorUnitId, 120) || '--', 18),
              serial: a.indoorUnitId || '',
              // 详情抽屉内「关系图」依赖外机系统级字段；拓扑里仅 airList 单条会缺 serial/airList
              raw: {
                ...a,
                id: airId,
                serial: row.serial != null && row.serial !== '' ? String(row.serial) : (a.serial != null ? String(a.serial) : ''),
                airList: row.airList != null ? row.airList : a.airList,
                gatewayName: row.name || row.addr || a.gatewayName || ''
              }
            }
          })
          const meters = this.normalizeMeterInfoList(row)
          return {
            id,
            type: 'device',
            rawType: 'outdoor',
            name: outdoorName,
            serial: '',
            raw: row,
            meters,
            children: airs // 内机作为外机的 children
          }
        })
      }
      this.tree = root.children.length ? root : null
      this.$nextTick(() => {
        this.fitView()
      })
    },
    zoomIn () {
      this.applyZoom(this.scale + ZOOM_STEP)
    },
    zoomOut () {
      this.applyZoom(this.scale - ZOOM_STEP)
    },
    resetView () {
      this.fitView()
    },
    focusRoot () {
      this.focusNode('root', { mode: 'root' })
    },
    focusSelected () {
      if (!this.selectedId) return
      this.focusNode(this.selectedId, { mode: 'selected' })
    },
    focusNode (nodeId, opts = {}) {
      if (!nodeId) return
      if (!this.$refs.canvas || !this.$refs.inner) return
      const canvas = this.$refs.canvas
      const inner = this.$refs.inner

      const el = inner.querySelector(`[data-tn-id="${String(nodeId)}"]`)
      if (!el) return

      const cs = window.getComputedStyle(canvas)
      const padL = parseFloat(cs.paddingLeft) || 0
      const padR = parseFloat(cs.paddingRight) || 0
      const padT = parseFloat(cs.paddingTop) || 0
      const padB = parseFloat(cs.paddingBottom) || 0
      const availW = Math.max(0, canvas.clientWidth - padL - padR)
      const availH = Math.max(0, canvas.clientHeight - padT - padB)

      const contentW = Math.max(1, inner.scrollWidth)
      const contentH = Math.max(1, inner.scrollHeight)

      const elCenterX = el.offsetLeft + el.offsetWidth / 2
      const elCenterY = el.offsetTop + el.offsetHeight / 2

      const targetCenterX = availW / 2
      let targetCenterY = availH / 2
      if (opts.mode === 'root' && this.direction === 'vertical') {
        targetCenterY = availH * 0.18
      }

      const nextTx = targetCenterX - elCenterX * this.scale
      const nextTy = targetCenterY - elCenterY * this.scale

      const minTx = availW - contentW * this.scale - 20
      const maxTx = 20
      const minTy = availH - contentH * this.scale - 20
      const maxTy = 20

      this.tx = Math.min(maxTx, Math.max(minTx, nextTx))
      this.ty = Math.min(maxTy, Math.max(minTy, nextTy))
    },
    fitView () {
      if (!this.$refs.canvas || !this.$refs.inner) return
      if (!this.tree || !this.tree.id) return

      const canvas = this.$refs.canvas
      const inner = this.$refs.inner

      const cs = window.getComputedStyle(canvas)
      const padL = parseFloat(cs.paddingLeft) || 0
      const padR = parseFloat(cs.paddingRight) || 0
      const padT = parseFloat(cs.paddingTop) || 0
      const padB = parseFloat(cs.paddingBottom) || 0

      const availW = Math.max(0, canvas.clientWidth - padL - padR)
      const availH = Math.max(0, canvas.clientHeight - padT - padB)

      const contentW = Math.max(1, inner.scrollWidth)
      const contentH = Math.max(1, inner.scrollHeight)

      const fit = Math.min(availW / contentW, availH / contentH, 1) * 0.92
      const nextScale = Math.max(this.getZoomMin(), Math.min(ZOOM_MAX, fit))
      this.scale = nextScale
      let tx = (availW - contentW * nextScale) / 2
      const ty = (availH - contentH * nextScale) / 2
      let nextTy = ty

      if (this.direction === 'horizontal') {
        const rootEl = inner.querySelector('.tn-root')
        if (rootEl) {
          const rootCenter = rootEl.offsetLeft + rootEl.offsetWidth / 2
          const targetCenterX = availW * 0.22
          tx = targetCenterX - rootCenter * nextScale
        }
      } else {
        const rootEl = inner.querySelector('.tn-root')
        if (rootEl) {
          const rootCenterX = rootEl.offsetLeft + rootEl.offsetWidth / 2
          const rootCenterY = rootEl.offsetTop + rootEl.offsetHeight / 2
          const targetCenterX = availW / 2
          const targetCenterY = availH * 0.18
          tx = targetCenterX - rootCenterX * nextScale
          nextTy = targetCenterY - rootCenterY * nextScale
        }
      }

      const minTx = availW - contentW * nextScale - 20
      const maxTx = 20
      const minTy = availH - contentH * nextScale - 20
      const maxTy = 20

      this.tx = Math.min(maxTx, Math.max(minTx, tx))
      if (this.direction === 'horizontal') {
        this.ty = Math.min(maxTy, Math.max(minTy, ty))
      } else {
        this.ty = Math.min(maxTy, Math.max(minTy, nextTy))
      }
      this.updateWrapMaxWidth()
    },
    onWheel (e) {
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      const m = this.getCanvasMetrics()
      if (!m) return
      const rect = m.canvas.getBoundingClientRect()
      const x = e.clientX - rect.left - m.padL
      const y = e.clientY - rect.top - m.padT
      this.applyZoom(this.scale + delta, { x, y })
    },
    onMouseDown (e) {
      if (e.button !== 0) return
      this.panState = {
        startX: e.clientX,
        startY: e.clientY,
        startTx: this.tx,
        startTy: this.ty
      }
      this.bindPanEvents()
    },
    onMouseMove (e) {
      if (!this.panState) return
      const dx = e.clientX - this.panState.startX
      const dy = e.clientY - this.panState.startY
      this.tx = this.panState.startTx + dx
      this.ty = this.panState.startTy + dy
    },
    onMouseUp () {
      this.panState = null
      this.unbindPanEvents()
    },
    bindPanEvents () {
      document.addEventListener('mousemove', this.onMouseMove)
      document.addEventListener('mouseup', this.onMouseUp)
    },
    unbindPanEvents () {
      document.removeEventListener('mousemove', this.onMouseMove)
      document.removeEventListener('mouseup', this.onMouseUp)
    }
  }
}
</script>

<style scoped>
.ac-exp-wrap {
  width: 100%;
}

.ac-exp-canvas {
  position: relative;
  width: 100%;
  height: calc(100vh - 240px);
  min-height: 600px;
  overflow: hidden;
  padding: 40px 50px;
  background: #f7f8fa;
  background-image: radial-gradient(circle, #d6dae4 1px, transparent 1px);
  background-size: 20px 20px;
  border-color: transparent;
  border-radius: 4px;
  overflow: hidden;
  user-select: none;
}

.ac-exp-inner {
  display: inline-flex;
  align-items: center;
  min-width: max-content;
  min-height: max-content;
}

.ac-exp-inner.dir-v {
  flex-direction: column;
  align-items: center;
}

.zoom-indicator {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(255, 255, 255, .92);
  border: 1px solid #e0e3e8;
  border-radius: 20px;
  padding: 4px 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .08);
  backdrop-filter: blur(4px);
}

.canvas-top-tools {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.canvas-dir-switch {
  /* 不再包第二层白底/描边，避免与 el-radio-button 分段边框叠成「双层框」 */
  line-height: 0;

  /* 勿对全部 inner 设统一 border-radius，否则会破坏分段边框，整组糊成一块蓝 */
  ::v-deep .el-radio-group {
    display: inline-flex;
    vertical-align: middle;
  }

  ::v-deep .el-radio-button__inner {
    height: 28px;
    line-height: 26px;
    padding: 0 10px;
    font-size: 12px;
    box-sizing: border-box;
  }

  ::v-deep .el-radio-button:first-child .el-radio-button__inner {
    border-radius: 6px 0 0 6px;
  }

  ::v-deep .el-radio-button:last-child .el-radio-button__inner {
    border-radius: 0 6px 6px 0;
  }
}

.canvas-hint {
  font-size: 12px;
  color: rgba(17, 24, 39, .72);
  background: rgba(255, 255, 255, .82);
  border: 1px solid rgba(224, 227, 232, .9);
  border-radius: 10px;
  padding: 6px 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, .06);
  backdrop-filter: blur(4px);
  user-select: none;
  pointer-events: none;
  white-space: nowrap;
}

.zoom-btn {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  padding: 2px 5px;
  border-radius: 4px;
  line-height: 1;
  transition: all .15s;
}

.zoom-btn:hover {
  background: #f0f0f0;
  color: #1890ff;
}

.zoom-btn:disabled {
  cursor: not-allowed;
  opacity: .45;
}

.zoom-val {
  min-width: 38px;
  text-align: center;
  font-size: 11px;
  font-weight: 500;
  color: #666;
}

.zi-sep {
  width: 1px;
  height: 14px;
  background: #e0e3e8;
  margin: 0 4px;
}
</style>
