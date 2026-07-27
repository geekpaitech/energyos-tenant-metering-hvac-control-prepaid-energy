<template>
  <div class="adt-wrap">
    <div class="adt-toolbar">
      <span class="adt-hint">拖拽画布平移 · 滚轮缩放</span>
      <el-button-group>
        <el-button size="mini" icon="el-icon-minus" @click="zoomOut" />
        <el-button size="mini" disabled>{{ Math.round(scale * 100) }}%</el-button>
        <el-button size="mini" icon="el-icon-plus" @click="zoomIn" />
        <el-button size="mini" @click="resetView">重置</el-button>
      </el-button-group>
    </div>
    <div
      ref="canvas"
      class="adt-canvas"
      :class="{ grabbing: !!panState }"
      @wheel.prevent="onWheel"
      @mousedown="onPanStart"
    >
      <div ref="inner" class="adt-inner" :style="innerStyle">
        <div class="adt-topology-col">
          <!-- 外机 -->
          <div class="adt-outdoor tn-common">
            <div class="dev-icon">
              <img :src="iconWj" class="meter-img" alt="" />
            </div>
            <div class="dev-info">
              <div class="dev-name" :title="displayGatewayName">{{ displayGatewayName }}</div>
              <div v-if="meterTags.length" class="dev-meters">
                <span
                  v-for="(m, idx) in meterTags"
                  :key="idx"
                  class="meter-tag"
                  :title="m.title"
                >
                  <img :src="iconMeter" class="meter-tag-icon" alt="" />
                  <span class="meter-tag-text">{{ m.label }}</span>
                </span>
              </div>
              <div v-else-if="outdoorAddr" class="dev-serial" :title="outdoorAddr">{{ outdoorAddr }}</div>
            </div>
          </div>

          <!-- 纵连接线 + 装饰节点 -->
          <div class="tn-conn-v">
            <div class="v-seg" />
            <div class="adt-fake-node" aria-hidden="true">
              <i class="el-icon-minus" />
            </div>
          </div>

          <!-- 内机横排（仅展示，不做任何点击，避免死循环） -->
          <div v-if="airs.length" class="tn-children-wrap-v" :class="{ single: airs.length === 1 }">
            <div v-if="airs.length > 1" class="h-seg-v" :style="hSegStyle" />
            <div v-for="(air, index) in airs" :key="airKey(air, index)" class="child-col">
              <div class="v-seg child" />
              <div class="adt-air-wrap" :class="{ 'adt-air-selected': isAirSelected(air) }">
                <div class="air-panel" :class="{ 'is-offline': !airOnline(air) }" :style="airPanelStyle(air)">
                  <div class="air-head">
                    <div class="air-name" :title="airName(air)">{{ airName(air) }}</div>
                    <div class="air-indicators">
                      <div class="indicator-item">
                        <span class="indicator-dot" :class="airOnline(air) ? 'online' : 'offline'" />
                        <span class="indicator-text">{{ airOnline(air) ? $t('deviceConditioning.online') : $t('deviceConditioning.offline') }}</span>
                      </div>
                      <div class="indicator-item">
                        <span class="indicator-dot" :class="airPower(air) ? 'on' : 'off'" />
                        <span class="indicator-text">{{ airPower(air) ? $t('deviceConditioning.tagAcPowerOn') : $t('deviceConditioning.tagAcPowerOff') }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="air-body">
                    <div class="air-temp-main">
                      <div class="air-temp-row">
                        <span class="air-temp-val">{{ targetTempText(air) }}</span>
                        <span class="air-temp-unit">℃</span>
                      </div>
                      <div class="air-temp-sub">{{ $t('deviceConditioning.treeSetTemp') }}</div>
                    </div>
                    <div class="air-divider" />
                    <div class="air-temp-side">
                      <div class="air-room-label">{{ $t('deviceConditioning.treeRoomTemp') }}</div>
                      <div class="air-room-val">{{ roomTempText(air) }}℃</div>
                    </div>
                  </div>
                  <div class="air-foot">
                    <div class="air-meta">
                      <i :class="getModeIcon(airMode(air))" class="air-mode-icon" />
                      <span class="air-meta-item">{{ modeText(airMode(air)) }}</span>
                      <span class="air-meta-dot">·</span>
                      <span class="air-meta-item">{{ fanText(airFan(air)) }}</span>
                    </div>
                  </div>
                  <div class="air-mini">
                    <div v-if="airSerial(air)" class="air-serial" :title="airSerial(air)">{{ airSerial(air) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const ZOOM_STEP = 0.08
// 最小可缩至约 20%，便于一屏看全；最大约 220%
const ZOOM_MIN = 0.2
const ZOOM_MAX = 2.2

export default {
  name: 'AirDetailTopology',
  props: {
    gatewayName: { type: String, default: '' },
    outdoorAddr: { type: String, default: '' },
    serial: { type: String, default: '' },
    airList: { type: [Array, String], default: () => [] },
    selectedAirId: { type: [String, Number], default: null },
    /** 与详情接口一致，项含 serial、meterName 等 */
    meterData: { type: Array, default: () => [] }
  },
  data () {
    return {
      iconWj: require('@/assets/images/wj.png'),
      iconMeter: require('@/assets/images/szwyIcon2.jpg'),
      scale: 1,
      tx: 0,
      ty: 0,
      panState: null
    }
  },
  computed: {
    displayGatewayName () {
      return this.gatewayName && String(this.gatewayName).trim() ? this.gatewayName : '--'
    },
    airs () {
      if (Array.isArray(this.airList)) return this.airList
      if (typeof this.airList === 'string' && this.airList) {
        try {
          const p = JSON.parse(this.airList)
          return Array.isArray(p) ? p : []
        } catch (e) {
          return []
        }
      }
      return []
    },
    meterTags () {
      const list = Array.isArray(this.meterData) ? this.meterData : []
      if (list.length) {
        return list.map((item) => {
          if (!item) return { label: '', title: '' }
          if (typeof item === 'string') {
            const s = item.trim()
            return { label: s, title: s }
          }
          const label = (item.meterName || item.name || item.serial || '').toString().trim()
          const serial = (item.serial != null ? String(item.serial) : '').trim()
          return { label: label || serial || '--', title: [label, serial].filter(Boolean).join(' ') }
        }).filter((x) => x.label)
      }
      if (!this.serial) return []
      return String(this.serial)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => ({ label: s, title: s }))
    },
    hSegStyle () {
      const c = this.airs.length
      if (c <= 1) return {}
      const pct = (1 / (2 * c)) * 100
      return { left: `${pct}%`, right: `${pct}%` }
    },
    innerStyle () {
      return {
        transform: `translate(${this.tx}px, ${this.ty}px) scale(${this.scale})`,
        transformOrigin: '0 0'
      }
    }
  },
  watch: {
    airs: {
      deep: true,
      handler () {
        this.$nextTick(() => this.fitView())
      }
    },
    gatewayName () {
      this.$nextTick(() => this.fitView())
    }
  },
  mounted () {
    window.addEventListener('resize', this.fitView)
    this.$nextTick(() => this.fitView())
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.fitView)
    this.unbindPan()
  },
  methods: {
    airKey (air, index) {
      const id = air && (air.id != null ? air.id : air.indoorUnitId)
      return id != null ? String(id) : `idx_${index}`
    },
    airId (air) {
      return air && (air.id != null && air.id !== '' ? air.id : air.indoorUnitId)
    },
    isAirSelected (air) {
      const cur = this.selectedAirId
      if (cur == null || cur === '') return false
      const s = String(cur)
      const id = this.airId(air)
      if (id != null && id !== '' && String(id) === s) return true
      const uid = air && air.indoorUnitId != null && air.indoorUnitId !== '' ? String(air.indoorUnitId) : ''
      return !!uid && uid === s
    },
    airName (air) {
      const raw = (air && (air.name || air.indoorUnitId)) || ''
      return this.$displayDynamicName(raw, 120) || '--'
    },
    airSerial (air) {
      return (air && (air.indoorUnitId || air.serial || '')) || ''
    },
    airOnline (air) {
      if (!air) return true
      const code = air.faultCode != null ? String(air.faultCode).trim().toUpperCase() : ''
      if (code === 'LOST') return false
      if (air.state != null) return air.state === 0
      if (air.onlineStatus != null) return air.onlineStatus === 0
      return true
    },
    airPower (air) {
      return air && air.powerStatus === 1
    },
    airMode (air) {
      return air ? air.operationMode : null
    },
    airFan (air) {
      return air ? air.fanSpeed : null
    },
    targetTempText (air) {
      const v = air ? air.targetTemperature : null
      return v === 0 || v ? String(v) : '--'
    },
    roomTempText (air) {
      const v = air ? air.roomTemperature : null
      return v === 0 || v ? String(v) : '--'
    },
    modeText (mode) {
      void this.$i18n.locale
      const k = { 0: 'enumModeAuto', 1: 'enumModeHeat', 2: 'enumModeCool', 4: 'enumModeFan', 8: 'enumModeDry' }[mode]
      return k ? this.$t(`deviceConditioning.${k}`) : '-'
    },
    fanText (fan) {
      void this.$i18n.locale
      const k = { 0: 'enumFanAuto', 1: 'enumFanLow', 2: 'enumFanMid', 3: 'enumFanHigh' }[fan]
      return k ? this.$t(`deviceConditioning.${k}`) : '-'
    },
    getModeIcon (mode) {
      const iconMap = {
        0: 'el-icon-refresh',
        1: 'el-icon-sunny',
        2: 'el-icon-light-rain',
        4: 'el-icon-moon-night',
        8: 'el-icon-sunrise'
      }
      return iconMap[mode] || 'el-icon-info'
    },
    airPanelStyle (air) {
      if (!this.airOnline(air)) {
        return {
          background: 'linear-gradient(135deg, #f5f7fa, #e4e7ed)',
          borderColor: '#dcdfe6'
        }
      }
      if (!this.airPower(air)) {
        return {
          background: 'linear-gradient(135deg, #ffffff, #f2f6fc)',
          borderColor: '#dcdfe6'
        }
      }
      const room = Number(air ? air.roomTemperature : NaN)
      const mode = this.airMode(air)
      if (mode === 1) {
        const hotLv = !Number.isFinite(room) ? 2 : room >= 30 ? 3 : room >= 26 ? 2 : 1
        if (hotLv === 3) return { background: 'linear-gradient(135deg, #ffd180, #ff6d00, #e53935)', borderColor: '#ff6d00' }
        if (hotLv === 2) return { background: 'linear-gradient(135deg, #fff59d, #ffb74d, #ff7043)', borderColor: '#ffb74d' }
        return { background: 'linear-gradient(135deg, #fffde7, #ffe082, #ffcc80)', borderColor: '#ffe082' }
      }
      if (mode === 2) {
        const clamp01 = (v) => Math.min(1, Math.max(0, v))
        const mix = (a, b, t) => Math.round(a + (b - a) * t)
        const mixRGB = (c1, c2, t) => {
          const tt = clamp01(t)
          return { r: mix(c1.r, c2.r, tt), g: mix(c1.g, c2.g, tt), b: mix(c1.b, c2.b, tt) }
        }
        const rgbStr = (c, a = 1) => `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`
        const t = Number.isFinite(room) ? clamp01((room - 22) / 10) : 0.45
        const low = { r: 242, g: 254, b: 255 }
        const mid = { r: 191, g: 239, b: 255 }
        const high = { r: 47, g: 128, b: 255 }
        const cStart = mixRGB(low, mid, t * 0.9)
        const cMid = mixRGB(mid, high, clamp01((t - 0.15) / 0.85) * 0.75)
        const cEnd = mixRGB(mid, high, t)
        return {
          background: `linear-gradient(135deg, ${rgbStr(cStart)}, ${rgbStr(cMid)}, ${rgbStr(cEnd)})`,
          borderColor: rgbStr(cEnd, 0.65)
        }
      }
      if (mode === 4) {
        return { background: 'linear-gradient(135deg, #e0f7fa, #80deea, #26c6da)', borderColor: '#80deea' }
      }
      if (mode === 8) {
        return { background: 'linear-gradient(135deg, #ede7f6, #b39ddb, #673ab7)', borderColor: '#b39ddb' }
      }
      return { background: 'linear-gradient(135deg, #eceff1, #cfd8dc, #90a4ae)', borderColor: '#cfd8dc' }
    },
    getMetrics () {
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
    fitView () {
      const m = this.getMetrics()
      if (!m) return
      const fit = Math.min(m.availW / m.contentW, m.availH / m.contentH, 1) * 0.9
      const nextScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, fit))
      this.scale = nextScale
      let tx = (m.availW - m.contentW * nextScale) / 2
      let ty = (m.availH - m.contentH * nextScale) / 2
      const col = m.inner.querySelector('.adt-topology-col')
      if (col) {
        const cx = col.offsetLeft + col.offsetWidth / 2
        const cy = col.offsetTop + col.offsetHeight / 2
        const targetX = m.availW / 2
        const targetY = m.availH * 0.2
        tx = targetX - cx * nextScale
        ty = targetY - cy * nextScale
      }
      const minTx = m.availW - m.contentW * nextScale - 20
      const maxTx = 20
      const minTy = m.availH - m.contentH * nextScale - 20
      const maxTy = 20
      this.tx = Math.min(maxTx, Math.max(minTx, tx))
      this.ty = Math.min(maxTy, Math.max(minTy, ty))
    },
    resetView () {
      this.fitView()
    },
    applyZoom (nextScale, anchor) {
      const m = this.getMetrics()
      if (!m) return
      const s0 = this.scale
      const s1 = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, nextScale))
      if (Math.abs(s1 - s0) < 1e-6) return
      const ax = anchor && Number.isFinite(anchor.x) ? anchor.x : m.availW / 2
      const ay = anchor && Number.isFinite(anchor.y) ? anchor.y : m.availH / 2
      const wx = (ax - this.tx) / Math.max(0.001, s0)
      const wy = (ay - this.ty) / Math.max(0.001, s0)
      this.scale = s1
      this.tx = ax - wx * s1
      this.ty = ay - wy * s1
      this.clampPan(s1)
    },
    clampPan (scale = this.scale) {
      const m = this.getMetrics()
      if (!m) return
      const minTx = m.availW - m.contentW * scale - 20
      const maxTx = 20
      const minTy = m.availH - m.contentH * scale - 20
      const maxTy = 20
      this.tx = Math.min(maxTx, Math.max(minTx, this.tx))
      this.ty = Math.min(maxTy, Math.max(minTy, this.ty))
    },
    onWheel (e) {
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      const m = this.getMetrics()
      if (!m) return
      const rect = m.canvas.getBoundingClientRect()
      const x = e.clientX - rect.left - m.padL
      const y = e.clientY - rect.top - m.padT
      this.applyZoom(this.scale + delta, { x, y })
    },
    zoomIn () {
      this.applyZoom(this.scale + ZOOM_STEP)
    },
    zoomOut () {
      this.applyZoom(this.scale - ZOOM_STEP)
    },
    onPanStart (e) {
      if (e.button !== 0) return
      this.panState = {
        startX: e.clientX,
        startY: e.clientY,
        startTx: this.tx,
        startTy: this.ty
      }
      document.addEventListener('mousemove', this.onPanMove)
      document.addEventListener('mouseup', this.onPanUp)
    },
    onPanMove (e) {
      if (!this.panState) return
      const dx = e.clientX - this.panState.startX
      const dy = e.clientY - this.panState.startY
      this.tx = this.panState.startTx + dx
      this.ty = this.panState.startTy + dy
    },
    onPanUp () {
      this.panState = null
      this.unbindPan()
      this.clampPan()
    },
    unbindPan () {
      document.removeEventListener('mousemove', this.onPanMove)
      document.removeEventListener('mouseup', this.onPanUp)
    }
  }
}
</script>

<style lang="scss" scoped>
.adt-wrap {
  width: 100%;
}

.adt-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.adt-hint {
  font-size: 12px;
  color: #909399;
}

.adt-canvas {
  position: relative;
  width: 100%;
  height: 420px;
  overflow: hidden;
  padding: 28px 24px;
  background: #f7f8fa;
  background-image: radial-gradient(circle, #d6dae4 1px, transparent 1px);
  background-size: 20px 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  cursor: grab;
  user-select: none;
}

.adt-canvas.grabbing {
  cursor: grabbing;
}

.adt-inner {
  display: inline-block;
  min-width: min-content;
}

.adt-topology-col {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tn-common {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 7px;
  background: #fff;
  border: 1px solid #dcdfe6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  min-width: 200px;
}

.dev-icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.meter-img {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.dev-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dev-name {
  font-size: 14px;
  font-weight: 700;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 220px;
}

.dev-meters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.meter-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 200px;
  font-size: 10px;
  color: #303133;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  padding: 2px 6px 2px 4px;
  border-radius: 10px;
  overflow: hidden;
}

.meter-tag-icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
  flex-shrink: 0;
  border-radius: 3px;
}

.meter-tag-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dev-serial {
  font-size: 10px;
  color: #909399;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tn-conn-v {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
}

.v-seg {
  width: 2px;
  height: 18px;
  background: #dcdfe6;
}

.v-seg.child {
  height: 18px;
}

.adt-fake-node {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1.5px solid #dcdfe6;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  pointer-events: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  margin-top: 0;
}

.tn-children-wrap-v {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 26px;
  padding-top: 18px;
  margin-top: 4px;
}

.tn-children-wrap-v.single {
  gap: 0;
  padding-top: 0;
}

.h-seg-v {
  position: absolute;
  top: 0;
  height: 2px;
  background: #dcdfe6;
  z-index: 0;
}

.child-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex-shrink: 0;
  z-index: 1;
}

/* ====== 1:1 复刻 conditioning.vue 的卡片样式 ====== */
/* 轻量卡片（上一版）：用于展示 + 高亮，不含任何业务按钮 */
.adt-air-wrap {
  padding: 2px;
  border-radius: 14px;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.adt-air-wrap.adt-air-selected {
  box-shadow: 0 0 0 3px #409eff, 0 8px 24px rgba(64, 158, 255, 0.35);
  transform: translateY(-2px);
}

.air-panel {
  width: 220px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.6);
  color: #111827;
  transition: border-color 0.2s ease;
}

.air-panel.is-offline {
  opacity: 0.72;
}

.air-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px 6px;
}

.air-name {
  font-size: 14px;
  font-weight: 800;
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.air-indicators {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.indicator-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.indicator-dot.online {
  background-color: #10b981;
}

.indicator-dot.offline {
  background-color: #9ca3af;
}

.indicator-dot.on {
  background-color: #3b82f6;
}

.indicator-dot.off {
  background-color: #9ca3af;
}

.indicator-text {
  font-size: 11px;
  font-weight: 600;
  color: rgba(17, 24, 39, 0.65);
}

.air-body {
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  align-items: center;
  padding: 6px 12px 10px;
}

.air-divider {
  width: 1px;
  height: 44px;
  background: rgba(0, 0, 0, 0.12);
  justify-self: center;
}

.air-temp-main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.air-temp-row {
  display: flex;
  align-items: flex-start;
}

.air-temp-val {
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
}

.air-temp-unit {
  font-size: 12px;
  font-weight: 700;
  margin-left: 2px;
  margin-top: 2px;
}

.air-temp-sub {
  font-size: 11px;
  color: rgba(17, 24, 39, 0.72);
}

.air-temp-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.air-room-label {
  font-size: 11px;
  color: rgba(17, 24, 39, 0.72);
}

.air-room-val {
  font-size: 16px;
  font-weight: 700;
}

.air-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px 8px;
  background: rgba(255, 255, 255, 0.35);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.air-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(17, 24, 39, 0.85);
}

.air-mode-icon {
  font-size: 14px;
  opacity: 0.8;
}

.air-meta-dot {
  color: rgba(17, 24, 39, 0.45);
}

.air-mini {
  padding: 6px 10px 8px;
  background: rgba(255, 255, 255, 0.35);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.air-serial {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 700;
  color: rgba(17, 24, 39, 0.82);
}
</style>
