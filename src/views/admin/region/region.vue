<template>
  <div class="fp-root">

    <!-- 左侧：地址目录 -->
    <aside class="fp-sidebar">
      <div class="sidebar-card">
        <div class="sidebar-header">
        <span class="sidebar-title-icon">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="1" fill="#0170FE" opacity=".9"/>
            <rect x="8" y="1" width="5" height="5" rx="1" fill="#0170FE" opacity=".5"/>
            <rect x="1" y="8" width="5" height="5" rx="1" fill="#0170FE" opacity=".5"/>
            <rect x="8" y="8" width="5" height="5" rx="1" fill="#0170FE" opacity=".2"/>
          </svg>
        </span>
        <span class="sidebar-title-text">地址选择</span>
        </div>

        <div class="sidebar-body">
          <div class="tree-node">
          <div class="tree-node-inner" @click="buildingOpen = !buildingOpen">
            <i class="tree-arrow" :class="{ open: buildingOpen }">›</i>
            <svg class="tree-icon" width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="4" width="12" height="10" rx="1" stroke="#606266" stroke-width="1.3"/>
              <path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="#606266" stroke-width="1.3"/>
              <line x1="6" y1="9" x2="6" y2="14" stroke="#606266" stroke-width="1.3"/>
              <line x1="10" y1="9" x2="10" y2="14" stroke="#606266" stroke-width="1.3"/>
              <line x1="2" y1="9" x2="14" y2="9" stroke="#606266" stroke-width="1.3"/>
            </svg>
            <span class="tree-label">南都科技园</span>
            <span class="floor-badge">{{ activeFloor }}</span>
          </div>

          <div class="tree-children" v-show="buildingOpen">
            <div
              v-for="f in floors"
              :key="f.key"
              class="floor-item"
              :class="{ active: activeFloor === f.key }"
              @click="activeFloor = f.key"
            >
              <span class="floor-num">{{ f.label }}</span>
              <span class="floor-count" :class="{ lit: f.onCount > 0 }">
                <span class="count-on">{{ f.onCount }}</span><span class="slash">/</span>{{ f.total }}
              </span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </aside>

    <!-- 右侧主区 -->
    <main class="fp-main">

      <!-- 顶栏：落位 + 统计 -->
      <header class="main-header">
        <div class="header-left">
          <h2 class="page-title">落位</h2>
          <span class="floor-tag">{{ activeFloorLabel }}</span>
        </div>
        <div v-if="isDisplayOnlyFloor" class="header-stats header-stats--plain">
          <span class="stat-plain-tip">仅平面图展示（本层无照明落位）</span>
        </div>
        <div v-else-if="!editMode" class="header-stats">
          <div class="stat-chip on-chip">
            <i class="chip-dot" />开启 <b>{{ onCount }}</b>
          </div>
          <div class="stat-chip off-chip">
            <i class="chip-dot" />关闭 <b>{{ offCount }}</b>
          </div>
          <div class="stat-total">共 <b>{{ lights.length }}</b> 台</div>
        </div>
        <el-button
          v-if="!editMode"
          size="mini"
          type="primary"
          class="header-zone-btn"
          @click="enterEditMode"
        >区域管理</el-button>
        <el-button
          v-else
          size="mini"
          type="success"
          class="header-zone-btn"
          @click="exitEditMode"
        >完成编辑</el-button>
      </header>

      <div class="fp-main-body" :class="{ 'fp-main-body--edit': editMode }">

      <!-- 地图 -->
      <div
        ref="mapWrap"
        class="map-wrap"
        :class="{
          'map-wrap--plan-canvas': usePlanCanvas,
          'edit-draw-mode': editMode && editTool === 'draw',
        }"
        :style="mapWrapPlanStyle"
        @wheel.prevent="onWheel"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="isPanning = false"
        @click="onMapClick"
      >
        <region-floor-loading
          :visible="loading"
          :floor-label="activeFloorLabel"
          :title="mapLoadingText"
        />

        <div v-if="editMode" class="map-edit-hint">
          <i class="el-icon-info" />
          {{ editHintText }}
          <span class="map-edit-hint-sub">按住 Alt 可拖动画布</span>
        </div>

        <div v-if="editMode && !zones.length && editTool === 'draw' && !isDrawingZone" class="map-empty-guide">
          <div class="map-empty-guide-inner">
            <i class="el-icon-crop" />
            <p>在地图上按住并拖拽，框选第一个合并区域</p>
            <span>松开后自动创建，可在右侧修改名称</span>
          </div>
        </div>

        <region-map-toolbar
          v-if="editMode"
          :edit-tool="editTool"
          @tool="setEditTool"
        />

        <div
          class="map-stage"
          :class="{ 'map-stage--busy': loading || !mapReady }"
          :style="mapStageStyle"
        >
          <div
            class="map-transform"
          :style="{
            transform: `translate(${ox}px,${oy}px) scale(${scale})`,
            transformOrigin: '0 0',
            willChange: 'transform'
          }"
        >
          <img
            :key="activeFloor"
            ref="mapImg"
            class="map-bg"
            :class="{ 'map-bg--seamless': usePlanCanvas }"
            :src="mapUrl"
            @load="onImgLoad"
            draggable="false"
          />

          <region-zone-layer
            :map-ready="mapReady"
            :map-n-w="mapNW"
            :map-n-h="mapNH"
            :zones="zones"
            :edit-mode="editMode"
            :selected-zone-id="selectedZoneId"
            :highlight-zone-id="highlightZoneId"
            :draft-rect="zoneDraftRect"
            @zone-click="onZoneClick"
            @zone-drag-start="onZoneDragStart"
            @zone-resize-start="onZoneResizeStart"
          />

          <div
            v-for="light in lights"
            v-show="mapReady && !editMode"
            :key="light.id"
            class="light-pin"
            :class="[light.status, {
              'is-active': selectedId === light.id,
              'is-dim': !isLightHighlighted(light),
            }]"
            :style="{ left: light.px + 'px', top: light.py + 'px' }"
            @click.stop="onPinClick(light)"
            @mouseenter="hoverId = light.id"
            @mouseleave="hoverId = null"
          >
            <div v-if="light.status === 'on'" class="pin-halo" />
            <div class="pin-body">
              <svg viewBox="0 0 20 20" width="15" height="15" fill="none">
                <path d="M10 3C7.24 3 5 5.24 5 8c0 1.85.98 3.47 2.45 4.38V14a.5.5 0 0 0 .5.5h4.1a.5.5 0 0 0 .5-.5v-1.62A5 5 0 0 0 15 8c0-2.76-2.24-5-5-5z" fill="white" opacity=".92"/>
                <rect x="7.6" y="14.8" width="4.8" height=".9" rx=".45" fill="white" opacity=".65"/>
                <rect x="8.2" y="16" width="3.6" height=".9" rx=".45" fill="white" opacity=".45"/>
              </svg>
            </div>
            <div class="pin-tip" v-if="hoverId === light.id && selectedId !== light.id">
              {{ light.name }}
            </div>
          </div>
          </div>
        </div>

        <!-- 连线：点位 → 详情卡 -->
        <svg
          v-if="dialogVisible && cardPos"
          class="card-connector"
          :width="mapWrapW"
          :height="mapWrapH"
        >
          <line
            :x1="cardPos.pinX"
            :y1="cardPos.pinY"
            :x2="cardPos.lineX"
            :y2="cardPos.lineY"
            stroke="#0170FE"
            stroke-width="1.5"
            stroke-dasharray="4 3"
            opacity="0.55"
          />
          <circle :cx="cardPos.pinX" :cy="cardPos.pinY" r="4" fill="#0170FE" opacity="0.7"/>
        </svg>

        <!-- 跟随点位的详情卡 -->
        <transition name="card-pop">
          <div
            v-if="dialogVisible && cardPos"
            class="detail-card"
            :style="{ left: cardPos.left + 'px', top: cardPos.top + 'px' }"
            @mousedown.stop
            @click.stop
          >
            <div class="card-header" :class="dialogData.status">
              <div class="card-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                  <path d="M12 4C9.24 4 7 6.24 7 9c0 1.85.98 3.47 2.45 4.38V16c0 .28.22.5.5.5h4.1c.28 0 .5-.22.5-.5v-2.62A5 5 0 0 0 17 9c0-2.76-2.24-5-5-5z" fill="white"/>
                  <rect x="9.5" y="17" width="5" height="1.1" rx=".55" fill="white" opacity=".7"/>
                  <rect x="10.2" y="18.5" width="3.6" height="1.1" rx=".55" fill="white" opacity=".5"/>
                </svg>
              </div>
              <div class="card-title-block">
                <div class="card-name">{{ dialogData.name }}</div>
                <div class="card-sn">{{ dialogData.serial }}</div>
              </div>
              <div class="card-header-right">
                <span class="status-tag" :class="dialogData.status">
                  {{ dialogData.status === 'on' ? '已开启' : '已关闭' }}
                </span>
                <button class="card-close" @click="closeCard">×</button>
              </div>
            </div>

            <!-- 照明控制 -->
            <div class="control-bar" :class="dialogData.status">
              <div class="control-label">
                <span class="control-title">照明控制</span>
                <span class="control-hint">{{ switchLoading ? '操作中…' : (dialogData.status === 'on' ? '点击关闭' : '点击开启') }}</span>
              </div>
              <el-switch
                :value="dialogData.status === 'on'"
                :disabled="switchLoading"
                active-color="#00C9B7"
                inactive-color="#DCDFE6"
                @change="onLightToggle"
              />
            </div>

            <div class="card-body">
              <div class="info-row">
                <span class="info-k">控制区域</span>
                <span class="info-v">{{ dialogData.area }}</span>
              </div>
              <div class="info-row">
                <span class="info-k">设备编号</span>
                <span class="info-v">{{ dialogData.deviceNo || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-k">设备类型</span>
                <span class="info-v">专用照明</span>
              </div>
              <div class="info-row last">
                <span class="info-k">最新数据</span>
                <span class="info-v muted">{{ dialogData.updatedAt }}</span>
              </div>
            </div>
          </div>
        </transition>

        <!-- 工具栏 -->
        <div class="tool-group">
          <button class="tool-btn" title="放大" @mousedown.stop @click.stop="zoomBy(1.25)">
            <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
              <path d="M8 3.5a.5.5 0 0 1 .5.5v3.5H12a.5.5 0 0 1 0 1H8.5V12a.5.5 0 0 1-1 0V8.5H4a.5.5 0 0 1 0-1h3.5V4a.5.5 0 0 1 .5-.5z"/>
            </svg>
          </button>
          <button class="tool-btn" title="缩小" @mousedown.stop @click.stop="zoomBy(0.8)">
            <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
              <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/>
            </svg>
          </button>
          <div class="tool-sep" />
          <button class="tool-btn" title="重置视图" @mousedown.stop @click.stop="resetView">
            <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
              <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
              <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
            </svg>
          </button>
        </div>

        <!-- 图例（仅照明楼层） -->
        <div v-if="!isDisplayOnlyFloor && !editMode" class="legend-wrap">
          <div class="legend-btn" @click.stop="legendOpen = !legendOpen">
            图例
            <svg viewBox="0 0 10 10" width="8" height="8" fill="currentColor" style="margin-left:3px">
              <path d="M5 1L9 5H1L5 1z" :transform="legendOpen ? 'rotate(180,5,5)' : ''"/>
            </svg>
          </div>
          <transition name="fade-up">
            <div v-if="legendOpen" class="legend-panel">
              <div class="legend-row"><div class="lg-dot on"/><span>照明开启</span></div>
              <div class="legend-row"><div class="lg-dot off"/><span>照明关闭</span></div>
            </div>
          </transition>
        </div>

        <div class="zoom-pill">{{ Math.round(scale * 100) }}%</div>
      </div>
      <region-edit-panel
        ref="editPanel"
        v-if="editMode"
        :floor-label="activeFloorLabel"
        :zones="zones"
        :selected-zone-id="selectedZoneId"
        :selected-zone="selectedZone"
        :edit-tool="editTool"
        :light-count="countLightsInZone(selectedZone)"
        @start-draw="startDrawZone"
        @rename="renameSelectedZoneInline"
        @status-change="updateZoneRentStatus"
        @split="applyVisualSplit"
        @delete="deleteSelectedZone"
        @rename-focus="clearRenameNewFlag"
        @select="selectZoneFromList"
        @save="persistFloorZones"
        @exit="exitEditMode"
        @clear-all="clearAllFloorZones"
      />
      </div>
    </main>
  </div>
</template>

<script>
import { loadRegionPageData } from './region-api'
import { mergePlacementsWithDevices, applyMapScale } from './region-utils'
import { sampleMapCanvasBackground, measureMapContentBounds } from './region-map-canvas'
import RegionFloorLoading from './region-floor-loading.vue'
import RegionZoneLayer from './region-zone-layer.vue'
import RegionEditPanel from './region-edit-panel.vue'
import RegionMapToolbar from './region-map-toolbar.vue'
import regionZoneEditMixin from './region-zone-edit'
import { listFloorProfiles, getFloorProfile, isDisplayOnlyFloor } from './floors'
import { mapPxToDesign } from './region-zones'

const CARD_W = 296
const CARD_H = 310

function formatNow () {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export default {
  name: 'AdminDeviceRegion',
  components: { RegionFloorLoading, RegionZoneLayer, RegionEditPanel, RegionMapToolbar },
  mixins: [regionZoneEditMixin],
  data () {
    const initialFloor = listFloorProfiles()[0]
    const initialProfile = initialFloor ? getFloorProfile(initialFloor.key) : null
    return {
      mapUrl: initialProfile ? initialProfile.mapConfig.resolveLocalMapUrl() : '',
      currentMapConfig: initialProfile ? initialProfile.mapConfig : null,
      mapNW: 0,
      mapNH: 0,
      mapWrapW: 0,
      mapWrapH: 0,
      scale: 1,
      ox: 0,
      oy: 0,
      minScale: 0.15,
      maxScale: 8,
      isPanning: false,
      panSX: 0,
      panSY: 0,
      panSOX: 0,
      panSOY: 0,
      panMoved: 0,
      _raf: null,
      _resizeObs: null,
      loading: false,
      mapReady: false,
      floorLoadId: 0,
      _pendingRawLights: null,
      lights: [],
      buildingOpen: true,
      activeFloor: initialFloor ? initialFloor.key : '10F',
      floors: listFloorProfiles().map(f => ({
        key: f.key,
        label: f.label,
        onCount: 0,
        total: 0
      })),
      legendOpen: false,
      selectedId: null,
      hoverId: null,
      dialogVisible: false,
      dialogData: {},
      cardPos: null,
      switchLoading: false,
      /** 底图边缘采样色，与 PNG 实际底色对齐 */
      planCanvasBg: null,
      /** 仅展示层：按不透明区域适配缩放（4F/负1F 共用） */
      mapViewBox: null,
      _floorLoadSince: 0
    }
  },
  computed: {
    onCount () { return this.lights.filter(l => l.status === 'on').length },
    offCount () { return this.lights.filter(l => l.status === 'off').length },
    isDisplayOnlyFloor () { return isDisplayOnlyFloor(this.activeFloor) },
    activeFloorLabel () {
      const p = getFloorProfile(this.activeFloor)
      return (p && p.label) || this.activeFloor
    },
    mapLoadingText () {
      return this.isDisplayOnlyFloor ? '正在载入平面图' : '正在载入落位数据'
    },
    usePlanCanvas () {
      return !!(this.currentMapConfig && this.currentMapConfig.MAP_CANVAS_BG)
    },
    planCanvasResolved () {
      if (!this.usePlanCanvas) return ''
      const fallback = (this.currentMapConfig && this.currentMapConfig.MAP_CANVAS_BG) || '#F2F2F2'
      return this.planCanvasBg || fallback
    },
    planCanvasCssVars () {
      if (!this.usePlanCanvas) return {}
      const bg = this.planCanvasResolved
      return { background: bg, '--plan-canvas-bg': bg }
    },
    mapWrapPlanStyle () {
      return this.usePlanCanvas ? this.planCanvasCssVars : {}
    },
    mapStageStyle () {
      return this.usePlanCanvas ? this.planCanvasCssVars : {}
    }
  },
  watch: {
    scale () { this.$nextTick(this.updateCardPosition) },
    ox () { this.$nextTick(this.updateCardPosition) },
    oy () { this.$nextTick(this.updateCardPosition) },
    activeFloor () { this.onFloorChange() }
  },
  mounted () {
    window.addEventListener('mouseup', this.onMouseUp)
    this.loadFloorZones()
    this.loadPageData()
    this.prefetchFloorCounts()
    this.$nextTick(() => {
      this.measureMapWrap()
      if (window.ResizeObserver && this.$refs.mapWrap) {
        this._resizeObs = new ResizeObserver(() => {
          this.measureMapWrap()
          this.resetView()
          this.updateCardPosition()
        })
        this._resizeObs.observe(this.$refs.mapWrap)
      }
    })
  },
  beforeDestroy () {
    window.removeEventListener('mouseup', this.onMouseUp)
    if (this._raf) cancelAnimationFrame(this._raf)
    if (this._resizeObs) this._resizeObs.disconnect()
  },
  methods: {
    measureMapWrap () {
      const wrap = this.$refs.mapWrap
      if (!wrap) return
      this.mapWrapW = wrap.clientWidth
      this.mapWrapH = wrap.clientHeight
    },

    onFloorChange () {
      const profile = getFloorProfile(this.activeFloor)
      if (!profile) return
      this.floorLoadId += 1
      const loadId = this.floorLoadId
      this.mapReady = false
      this.loading = true
      this._floorLoadSince = Date.now()
      this.lights = []
      this.closeCard()
      this.currentMapConfig = profile.mapConfig
      this.mapUrl = profile.mapConfig.resolveLocalMapUrl()
      this.mapNW = 0
      this.mapNH = 0
      this.planCanvasBg = null
      this.mapViewBox = null
      this.initZoneEditOnFloorChange()
      this.loadPageData(loadId)
    },

    syncMapViewBox () {
      this.mapViewBox = null
      if (!this.isDisplayOnlyFloor) return
      const img = this.$refs.mapImg
      if (!img || !img.complete || !img.naturalWidth) return
      const box = measureMapContentBounds(img)
      if (box && box.w > 0 && box.h > 0) this.mapViewBox = box
    },

    syncPlanCanvasBg () {
      if (!this.usePlanCanvas) {
        this.planCanvasBg = null
        return
      }
      const img = this.$refs.mapImg
      const cfg = this.currentMapConfig
      const fallback = (cfg && cfg.MAP_CANVAS_BG) || '#F2F2F2'
      const cornersOnly = !!(cfg && cfg.MAP_CANVAS_BG_CORNERS_ONLY)
      this.planCanvasBg = sampleMapCanvasBackground(img, fallback, { cornersOnly })
    },

    async prefetchFloorCounts () {
      const tasks = this.floors
        .filter(f => f.key !== this.activeFloor)
        .map(async (f) => {
          if (isDisplayOnlyFloor(f.key)) {
            f.total = 0
            f.onCount = 0
            return
          }
          try {
            const { placements, deviceGroups } = await loadRegionPageData(f.key)
            const merged = mergePlacementsWithDevices(placements, deviceGroups, f.label)
            f.total = merged.length
            f.onCount = merged.filter(l => l.status === 'on').length
          } catch (e) {
            console.warn('[region] 预取楼层统计失败', f.key, e)
          }
        })
      await Promise.all(tasks)
    },

    updateFloorStats (merged) {
      const floor = this.floors.find(f => f.key === this.activeFloor)
      if (!floor || !merged) return
      floor.total = merged.length
      floor.onCount = merged.filter(l => l.status === 'on').length
    },

    tryApplyFloorPlacements (loadId, rawLights) {
      if (loadId !== this.floorLoadId) return
      const img = this.$refs.mapImg
      if (!img || !img.complete || !img.naturalWidth) return

      this.mapNW = img.naturalWidth
      this.mapNH = img.naturalHeight
      this.syncPlanCanvasBg()
      this.syncMapViewBox()
      this.lights = applyMapScale(
        rawLights,
        this.mapNW,
        this.mapNH,
        this.currentMapConfig
      )
      this._pendingRawLights = null
      this.finishFloorLoad(loadId, () => {
        this.mapReady = true
        this.$nextTick(() => {
          this.resetView()
          this.updateCardPosition()
        })
      })
    },

    finishFloorLoad (loadId, done) {
      if (loadId !== this.floorLoadId) return
      const minMs = 320
      const elapsed = Date.now() - (this._floorLoadSince || 0)
      const delay = Math.max(0, minMs - elapsed)
      const run = () => {
        if (loadId !== this.floorLoadId) return
        this.loading = false
        if (typeof done === 'function') done()
      }
      if (delay) setTimeout(run, delay)
      else run()
    },

    async loadPageData (loadId) {
      const id = loadId != null ? loadId : ++this.floorLoadId
      const profile = getFloorProfile(this.activeFloor)
      if (!profile) {
        this.loading = false
        return
      }

      if (loadId == null) {
        this.mapReady = false
        this.loading = true
        this._floorLoadSince = Date.now()
      }

      try {
        const { placements, deviceGroups } = await loadRegionPageData(this.activeFloor)
        if (id !== this.floorLoadId) return

        const rawLights = mergePlacementsWithDevices(placements, deviceGroups, profile.label)
        this._pendingRawLights = rawLights
        this.updateFloorStats(rawLights)
        this.tryApplyFloorPlacements(id, rawLights)
      } catch (e) {
        if (id !== this.floorLoadId) return
        console.error('[region] 加载失败', e)
        this.$message.error('落位数据加载失败')
        this.loading = false
        this.mapReady = false
      }
    },

    onImgLoad () {
      this.syncPlanCanvasBg()
      if (this._pendingRawLights != null) {
        this.tryApplyFloorPlacements(this.floorLoadId, this._pendingRawLights)
      } else if (this.isDisplayOnlyFloor && !this.mapReady) {
        this.tryApplyFloorPlacements(this.floorLoadId, [])
      }
    },

    resetView () {
      const wrap = this.$refs.mapWrap
      if (!wrap || !this.mapNW) return
      const cw = wrap.clientWidth
      const ch = wrap.clientHeight
      const cfg = this.currentMapConfig
      const pad = (cfg && cfg.MAP_VIEW_PADDING != null) ? cfg.MAP_VIEW_PADDING : 40
      const box = this.isDisplayOnlyFloor && this.mapViewBox ? this.mapViewBox : null
      const fitW = box ? box.w : this.mapNW
      const fitH = box ? box.h : this.mapNH
      const s = Math.min((cw - pad * 2) / fitW, (ch - pad * 2) / fitH)
      this.scale = s
      this.ox = (cw - fitW * s) / 2 - (box ? box.x * s : 0)
      this.oy = (ch - fitH * s) / 2 - (box ? box.y * s : 0)
    },

    getPinScreenPos (light) {
      return {
        x: this.ox + light.px * this.scale,
        y: this.oy + light.py * this.scale
      }
    },

    updateCardPosition () {
      if (!this.dialogVisible || !this.selectedId) return
      const light = this.lights.find(l => l.id === this.selectedId)
      if (!light) return
      const wrap = this.$refs.mapWrap
      if (!wrap) return

      const cw = wrap.clientWidth
      const ch = wrap.clientHeight
      const pin = this.getPinScreenPos(light)
      const gap = 20
      const pinR = 16

      let left = pin.x + pinR + gap
      let top = pin.y - CARD_H / 2

      if (left + CARD_W > cw - 12) {
        left = pin.x - pinR - gap - CARD_W
      }
      if (left < 12) left = 12
      if (top < 12) top = 12
      if (top + CARD_H > ch - 12) top = ch - CARD_H - 12

      const cardCenterY = top + CARD_H / 2
      const placeRight = left > pin.x
      const lineX = placeRight ? left : left + CARD_W
      const lineY = Math.max(top + 48, Math.min(top + CARD_H - 48, cardCenterY))

      this.cardPos = {
        left,
        top,
        pinX: pin.x,
        pinY: pin.y,
        lineX,
        lineY
      }
    },

    applyZoom (factor, cx, cy) {
      const wrap = this.$refs.mapWrap
      if (!wrap) return
      const rect = wrap.getBoundingClientRect()
      const mx = cx !== undefined ? cx - rect.left : wrap.clientWidth / 2
      const my = cy !== undefined ? cy - rect.top : wrap.clientHeight / 2
      const ns = Math.max(this.minScale, Math.min(this.maxScale, this.scale * factor))
      const wx = (mx - this.ox) / this.scale
      const wy = (my - this.oy) / this.scale
      this.scale = ns
      this.ox = mx - wx * ns
      this.oy = my - wy * ns
    },

    zoomBy (f) {
      this.applyZoom(f)
      this.$nextTick(this.updateCardPosition)
    },

    onWheel (e) {
      this.applyZoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY)
    },

    onMouseDown (e) {
      if (e.button !== 0 && e.button !== 1) return
      this.mapPanModifier = !!e.altKey
      if (this.editMode && e.button === 0 && this.editTool === 'draw' && !e.altKey) {
        if (!this.mapNW || !this.mapNH) return
        const local = this.getMapLocalFromEvent(e)
        const design = mapPxToDesign(local.px, local.py, this.mapNW, this.mapNH)
        this.isDrawingZone = true
        this.zoneDrawStart = design
        this.zoneDraftRect = { x: design.x, y: design.y, w: 0, h: 0 }
        return
      }
      if (this.zoneResize || this.zoneDrag) return
      const canPan = e.button === 1 || e.altKey || !this.editMode
      if (!canPan) return
      this.isPanning = true
      this.panMoved = 0
      this.panSX = e.clientX
      this.panSY = e.clientY
      this.panSOX = this.ox
      this.panSOY = this.oy
    },

    onMouseMove (e) {
      this.mapPanModifier = !!e.altKey
      if (this.isDrawingZone) {
        this.handleZoneDrawMove(e)
        return
      }
      if (this.zoneResize) {
        this.handleZoneResizeMove(e)
        this.panMoved = Math.max(this.panMoved, 1)
        return
      }
      if (this.zoneDrag) {
        this.handleZoneDragMove(e)
        this.panMoved = Math.max(this.panMoved, 1)
        return
      }
      if (!this.isPanning) return
      const dx = e.clientX - this.panSX
      const dy = e.clientY - this.panSY
      this.panMoved = Math.max(this.panMoved, Math.abs(dx), Math.abs(dy))
      if (this._raf) return
      const nx = this.panSOX + dx
      const ny = this.panSOY + dy
      this._raf = requestAnimationFrame(() => {
        this.ox = nx
        this.oy = ny
        this._raf = null
        if (this.dialogVisible) this.updateCardPosition()
      })
    },

    onMouseUp () {
      if (this.isDrawingZone) {
        this.finishZoneDraw()
      }
      if (this.zoneResize) {
        this.zoneResize = null
        this.persistFloorZones(true)
      }
      if (this.zoneDrag) {
        this.zoneDrag = null
        this.persistFloorZones(true)
      }
      this.isPanning = false
      if (this._raf) {
        cancelAnimationFrame(this._raf)
        this._raf = null
      }
    },

    onMapClick () {
      if (this.panMoved > 4) return
      if (this.editMode) {
        this.selectedZoneId = null
        return
      }
      this.highlightZoneId = null
      this.closeCard()
    },

    onPinClick (light) {
      if (this.panMoved > 4) return
      if (this.editMode) return
      this.selectedId = light.id
      this.dialogData = { ...light, updatedAt: formatNow() }
      this.dialogVisible = true
      this.$nextTick(this.updateCardPosition)
    },

    closeCard () {
      this.dialogVisible = false
      this.selectedId = null
      this.cardPos = null
    },

    syncFloorCount () {
      const floor = this.floors.find(f => f.key === this.activeFloor)
      if (floor) {
        floor.onCount = this.onCount
        floor.total = this.lights.length
      }
    },

    onLightToggle (val) {
      const deviceId = this.dialogData.deviceId
      if (!deviceId) return

      this.switchLoading = true
      const status = val ? 'on' : 'off'

      setTimeout(() => {
        this.lights.forEach(l => {
          if (l.deviceId === deviceId) {
            l.status = status
            l.power = status === 'on' ? '-' : '0 W'
          }
        })
        this.dialogData = {
          ...this.dialogData,
          status,
          power: status === 'on' ? '-' : '0 W',
          updatedAt: formatNow()
        }
        this.syncFloorCount()
        this.switchLoading = false
      }, 280)
    }
  }
}
</script>

<style lang="scss" scoped>
$on:   #00C9B7;
$off:  #8A919F;
$blue: #0170FE;
$bd:   #E8EAED;
$c1:   #1A1A2E;
$c2:   #606266;
$c3:   #909399;

* { box-sizing: border-box; }

.fp-root {
  position: absolute;
  inset: 0;
  display: flex;
  background: #EEF0F5;
  font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  overflow: hidden;
}

/* ── 左侧边栏 ── */
.fp-sidebar {
  width: 252px;
  flex-shrink: 0;
  background: #EEF0F5;
  border-right: 1px solid $bd;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, .05);
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 28px 22px 24px;
  margin-bottom: 6px;
  border-bottom: 1px solid #F0F2F5;
  flex-shrink: 0;
}

.sidebar-title-text {
  font-size: 13px;
  font-weight: 600;
  color: $c2;
  letter-spacing: .3px;
}

.sidebar-body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 16px 28px;
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
}

.tree-node-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 13px 14px;
  border-radius: 10px;
  cursor: pointer;
  user-select: none;
  transition: background .12s;
  &:hover { background: #F7F8FA; }
}

.tree-arrow {
  font-size: 16px;
  color: $c3;
  line-height: 1;
  display: inline-block;
  transition: transform .2s;
  &.open { transform: rotate(90deg); }
}

.tree-icon { flex-shrink: 0; opacity: .7; }
.tree-label { flex: 1; font-size: 14px; font-weight: 600; color: $c1; }

.floor-badge {
  font-size: 11px;
  color: $c3;
  background: #F2F3F5;
  padding: 2px 8px;
  border-radius: 10px;
}

.tree-children {
  padding: 10px 0 4px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.floor-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px 13px 28px;
  border-radius: 10px;
  cursor: pointer;
  transition: background .12s, border-color .12s;
  border-left: 3px solid transparent;

  &:hover:not(.active) { background: #F7F8FA; }

  &.active {
    background: #EEF5FF;
    border-left-color: $blue;
    .floor-num { color: $blue; font-weight: 600; }
  }
}

.floor-num { font-size: 13px; color: $c1; }

.floor-count {
  font-size: 11px;
  color: $c3;
  .slash { margin: 0 1px; }
  &.lit .count-on { color: $on; font-weight: 600; }
}

/* ── 主区域 ── */
.fp-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 16px 16px 16px 12px;
  gap: 12px;
}

.main-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 10px;
  padding: 0 20px;
  height: 52px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, .05);

  ::v-deep .header-zone-btn {
    &.el-button--primary,
    &.el-button--success {
      color: #fff !important;

      span {
        color: #fff !important;
      }

      &:hover,
      &:focus {
        color: #fff !important;
      }
    }
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: $c1;
}

.floor-tag {
  font-size: 12px;
  color: $blue;
  background: rgba(1, 112, 254, .08);
  padding: 2px 10px;
  border-radius: 20px;
  font-weight: 600;
}

.fp-main-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &--edit {
    flex-direction: row;
    align-items: stretch;
    .map-wrap {
      flex: 1;
      min-width: 0;
    }
    .region-edit-panel {
      align-self: stretch;
    }
  }
}

.map-edit-hint {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 120;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(1, 112, 254, 0.95);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(1, 112, 254, 0.35);
  pointer-events: none;
  white-space: nowrap;

  .map-edit-hint-sub {
    opacity: 0.85;
    font-size: 11px;
    font-weight: 400;
    margin-left: 8px;
    padding-left: 8px;
    border-left: 1px solid rgba(255, 255, 255, 0.35);
  }
}

.map-empty-guide {
  position: absolute;
  inset: 0;
  z-index: 110;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  background: rgba(255, 255, 255, 0.35);
}

.map-empty-guide-inner {
  text-align: center;
  padding: 28px 36px;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  max-width: 320px;

  i {
    font-size: 40px;
    color: #0170fe;
    margin-bottom: 12px;
  }

  p {
    margin: 0 0 8px;
    font-size: 15px;
    font-weight: 600;
    color: #303133;
  }

  span {
    font-size: 12px;
    color: #909399;
  }
}

.map-wrap.edit-draw-mode {
  cursor: crosshair;
}

.light-pin.is-dim {
  opacity: 0.22;
  pointer-events: none;
}

.header-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: $c2;
  padding: 4px 12px;
  border-radius: 20px;
  b { font-weight: 700; }

  &.on-chip  { background: rgba(0, 201, 183, .08); b { color: $on; } }
  &.off-chip { background: rgba(138, 145, 159, .08); }

  .chip-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    display: inline-block;
    .on-chip  & { background: $on; }
    .off-chip & { background: $off; }
  }
}

.stat-total {
  font-size: 12px;
  color: $c3;
  padding-left: 10px;
  border-left: 1px solid $bd;
  b { color: $blue; font-weight: 700; }
}

.header-stats--plain {
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(138, 145, 159, .08);
}

.stat-plain-tip {
  font-size: 12px;
  color: $c2;
}

/* 地图 */
.map-wrap {
  flex: 1;
  min-height: 0;
  position: relative;
  background: #D8DEE8;
  border-radius: 12px;
  overflow: hidden;
  cursor: grab;
  user-select: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, .05);
  &:active { cursor: grabbing; }

  /* 与底图同色画布，轻阴影与页面灰底分层 */
  &--plan-canvas {
    box-shadow: 0 1px 4px rgba(0, 0, 0, .06);
    border: 1px solid rgba(0, 0, 0, .04);
  }
}

.map-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  transition: opacity .2s ease;

  &--busy {
    opacity: 0;
    pointer-events: none;
  }
}

.map-transform {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  will-change: transform;
}

.map-bg {
  display: block;
  max-width: none;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;

  /* 同色外扩，吃掉 PNG 边缘抗锯齿/压缩色带 */
  &--seamless {
    background-color: var(--plan-canvas-bg, #F2F2F2);
    box-shadow: 0 0 0 2px var(--plan-canvas-bg, #F2F2F2);
  }
}

/* 点位 */
.light-pin {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 10;
  &:hover { z-index: 20; }
  &.is-active { z-index: 30; }
}

.pin-halo {
  position: absolute;
  inset: -7px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 201, 183, .3) 0%, transparent 70%);
  animation: halo 2.4s ease-in-out infinite;
  pointer-events: none;
}

@keyframes halo {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%       { transform: scale(1.4); opacity: .4; }
}

.pin-body {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, .55);
  transition: transform .15s cubic-bezier(.34, 1.56, .64, 1), box-shadow .15s;
  position: relative;
  z-index: 1;

  .light-pin.on & {
    background: $on;
    box-shadow: 0 2px 12px rgba(0, 201, 183, .45);
  }
  .light-pin.off & {
    background: $off;
    box-shadow: 0 2px 6px rgba(0, 0, 0, .18);
  }
  .light-pin:hover & { transform: scale(1.18); }
  .light-pin.is-active & {
    transform: scale(1.24);
    box-shadow: 0 0 0 4px rgba(255, 255, 255, .5), 0 4px 16px rgba(0, 0, 0, .2);
  }
}

.pin-tip {
  position: absolute;
  bottom: calc(100% + 7px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(20, 20, 40, .85);
  color: #fff;
  font-size: 11px;
  padding: 4px 9px;
  border-radius: 5px;
  white-space: nowrap;
  pointer-events: none;
  backdrop-filter: blur(4px);
  z-index: 50;
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: rgba(20, 20, 40, .85);
  }
}

/* 连线 */
.card-connector {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 150;
}

/* 详情卡（跟随点位） */
.detail-card {
  position: absolute;
  width: 296px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, .16);
  overflow: hidden;
  z-index: 200;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 12px;

  &.on  { background: linear-gradient(135deg, rgba(0, 201, 183, .12), rgba(0, 201, 183, .04)); }
  &.off { background: linear-gradient(135deg, rgba(138, 145, 159, .1), rgba(138, 145, 159, .03)); }
}

.card-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  .on & { background: $on; box-shadow: 0 3px 10px rgba(0, 201, 183, .4); }
  .off & { background: $off; }
}

.card-title-block { flex: 1; min-width: 0; }
.card-name {
  font-size: 13px;
  font-weight: 700;
  color: $c1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-sn { font-size: 11px; color: $c3; margin-top: 2px; }

.card-header-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

.status-tag {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 20px;
  border: 1px solid;
  &.on  { color: $on; border-color: $on; background: rgba(0, 201, 183, .08); }
  &.off { color: $off; border-color: #DDE0E5; background: #F7F8FA; }
}

.card-close {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  color: $c3;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .1s;
  &:hover { background: #F0F2F5; color: $c1; }
}

/* 控制条 */
.control-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  margin: 0 12px;
  border-radius: 8px;
  background: #F7F8FA;
  border: 1px solid $bd;

  &.on { background: rgba(0, 201, 183, .06); border-color: rgba(0, 201, 183, .2); }
}

.control-label { display: flex; flex-direction: column; gap: 2px; }
.control-title { font-size: 13px; font-weight: 600; color: $c1; }
.control-hint  { font-size: 11px; color: $c3; }

.card-body { padding: 4px 14px 14px; }

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #F5F6F8;
  &.last { border-bottom: none; }
}

.info-k { font-size: 12px; color: $c3; }
.info-v {
  font-size: 13px;
  font-weight: 600;
  color: $c1;
  &.v-on  { color: $on; }
  &.muted { color: $c3; font-weight: 400; font-size: 12px; }
}

/* 工具栏 */
.tool-group {
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: #fff;
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, .12);
  z-index: 100;
}

.tool-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: $c2;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .12s, color .12s;
  &:hover { background: #EFF4FF; color: $blue; }
}

.tool-sep { height: 1px; background: $bd; margin: 2px 3px; }

.legend-wrap {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 100;
}

.legend-btn {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 20px;
  padding: 5px 13px;
  font-size: 12px;
  color: $c2;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, .1);
  transition: background .12s;
  &:hover { background: #F5F7FA; }
}

.legend-panel {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  background: #fff;
  border-radius: 8px;
  padding: 10px 14px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, .12);
  min-width: 120px;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: $c2;
  padding: 4px 0;
}

.lg-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  &.on  { background: $on; box-shadow: 0 0 6px rgba(0, 201, 183, .4); }
  &.off { background: $off; }
}

.zoom-pill {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, .4);
  color: #fff;
  font-size: 11px;
  padding: 3px 12px;
  border-radius: 20px;
  pointer-events: none;
  backdrop-filter: blur(4px);
  z-index: 50;
}

.fade-up-enter-active, .fade-up-leave-active { transition: opacity .15s, transform .15s; }
.fade-up-enter, .fade-up-leave-to { opacity: 0; transform: translateY(6px); }

.card-pop-enter-active, .card-pop-leave-active {
  transition: opacity .2s, transform .2s cubic-bezier(.4, 0, .2, 1);
}
.card-pop-enter, .card-pop-leave-to {
  opacity: 0;
  transform: scale(.96);
}
</style>
