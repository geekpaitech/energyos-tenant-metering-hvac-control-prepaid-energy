import {
  clampRectToDesign,
  cloneZone,
  createZoneId,
  explodeZoneToParts,
  lightInZone,
  loadFloorZones,
  mapPxToDesign,
  normalizeRect,
  saveFloorZones
} from './region-zones'
import { ZONE_RENT_STATUS, normalizeZoneRentStatus } from './region-zone-status'

const RESIZE_HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

function applyResize (origin, handle, dx, dy) {
  let { x, y, w, h } = { ...origin }
  if (handle.includes('e')) w += dx
  if (handle.includes('w')) { x += dx; w -= dx }
  if (handle.includes('s')) h += dy
  if (handle.includes('n')) { y += dy; h -= dy }
  if (w < 24) {
    if (handle.includes('w')) x = origin.x + origin.w - 24
    w = 24
  }
  if (h < 24) {
    if (handle.includes('n')) y = origin.y + origin.h - 24
    h = 24
  }
  return clampRectToDesign({ x, y, w, h })
}

export default {
  data () {
    return {
      editMode: false,
      editTool: 'select',
      zones: [],
      selectedZoneId: null,
      highlightZoneId: null,
      zoneDraftRect: null,
      zoneDrawStart: null,
      isDrawingZone: false,
      zoneDrag: null,
      zoneResize: null,
      mapPanModifier: false
    }
  },
  computed: {
    selectedZone () {
      return this.zones.find(z => z.id === this.selectedZoneId) || null
    },
    showZoneLayer () {
      return this.editMode && this.zones.length + (this.zoneDraftRect ? 1 : 0) > 0 || this.editMode
    },
    editHintText () {
      if (this.isDrawingZone) return '松开鼠标完成框选'
      if (this.editTool === 'draw') return '在地图上按住并拖拽，框选合并区域'
      if (this.mapPanModifier) return '拖动画布中…'
      if (this.zoneResize) return '调整区域大小'
      if (this.zoneDrag) return '移动区域位置'
      if (this.selectedZone) return '拖拽角点调整大小；拖拽区域内部可移动'
      return '在地图上拖拽框选区域，或点击已有区域进行编辑'
    }
  },
  methods: {
    loadFloorZones () {
      this.zones = loadFloorZones(this.activeFloor)
    },
    persistFloorZones (silent) {
      saveFloorZones(this.activeFloor, this.zones)
      if (!silent) {
        this.$message.success('已保存，可在地图上继续框选下一个区域')
        if (this.editMode) {
          this.startDrawZone()
        }
      }
    },
    clearAllFloorZones () {
      this.$confirm('将清空本层全部区域，是否继续？', '清空区域', { type: 'warning' })
        .then(() => {
          this.zones = []
          this.selectedZoneId = null
          this.highlightZoneId = null
          saveFloorZones(this.activeFloor, [])
          this.$message.success('已清空')
        })
        .catch(() => {})
    },
    enterEditMode () {
      this.closeCard()
      this.loadFloorZones()
      this.persistFloorZones(true)
      this.editMode = true
      this.selectedZoneId = null
      this.highlightZoneId = null
      this.startDrawZone()
    },
    exitEditMode () {
      this.persistFloorZones(true)
      this.editMode = false
      this.cancelZoneDraw()
      this.selectedZoneId = null
      this.highlightZoneId = null
      this.zoneDrag = null
      this.zoneResize = null
      this.loadFloorZones()
      this.$message.success('已退出编辑，区域已显示在地图上')
    },
    startDrawZone () {
      this.editTool = 'draw'
      this.selectedZoneId = null
      this.cancelZoneDraw()
    },
    cancelDrawZone () {
      this.editTool = 'select'
      this.cancelZoneDraw()
    },
    getMapLocalFromEvent (e) {
      const wrap = this.$refs.mapWrap
      if (!wrap) return { px: 0, py: 0 }
      const rect = wrap.getBoundingClientRect()
      return {
        px: (e.clientX - rect.left - this.ox) / this.scale,
        py: (e.clientY - rect.top - this.oy) / this.scale
      }
    },
    cancelZoneDraw () {
      this.isDrawingZone = false
      this.zoneDrawStart = null
      this.zoneDraftRect = null
    },
    isMapPanEvent (e) {
      return e.button === 1 || this.mapPanModifier || (this.editTool === 'pan')
    },
    onZoneClick (zoneId) {
      if (!this.editMode) {
        this.highlightZoneId = this.highlightZoneId === zoneId ? null : zoneId
        return
      }
      this.editTool = 'select'
      this.selectedZoneId = zoneId
    },
    onZoneDragStart (zoneId, e) {
      if (!this.editMode || this.editTool !== 'select') return
      const zone = this.zones.find(z => z.id === zoneId)
      if (!zone) return
      const local = this.getMapLocalFromEvent(e)
      const design = mapPxToDesign(local.px, local.py, this.mapNW, this.mapNH)
      this.zoneDrag = {
        zoneId,
        startDesign: design,
        originRect: { ...zone.rect }
      }
      this.selectedZoneId = zoneId
    },
    onZoneResizeStart (zoneId, handle, e) {
      if (!this.editMode) return
      const zone = this.zones.find(z => z.id === zoneId)
      if (!zone) return
      const local = this.getMapLocalFromEvent(e)
      const design = mapPxToDesign(local.px, local.py, this.mapNW, this.mapNH)
      this.zoneResize = {
        zoneId,
        handle,
        startDesign: design,
        originRect: { ...zone.rect }
      }
      this.selectedZoneId = zoneId
      this.editTool = 'select'
    },
    handleZoneDrawMove (e) {
      if (!this.isDrawingZone || !this.zoneDrawStart) return
      const local = this.getMapLocalFromEvent(e)
      const end = mapPxToDesign(local.px, local.py, this.mapNW, this.mapNH)
      this.zoneDraftRect = clampRectToDesign(normalizeRect(this.zoneDrawStart, end))
    },
    handleZoneDragMove (e) {
      if (!this.zoneDrag) return
      const zone = this.zones.find(z => z.id === this.zoneDrag.zoneId)
      if (!zone) return
      const local = this.getMapLocalFromEvent(e)
      const design = mapPxToDesign(local.px, local.py, this.mapNW, this.mapNH)
      const dx = design.x - this.zoneDrag.startDesign.x
      const dy = design.y - this.zoneDrag.startDesign.y
      zone.rect = clampRectToDesign({
        x: this.zoneDrag.originRect.x + dx,
        y: this.zoneDrag.originRect.y + dy,
        w: this.zoneDrag.originRect.w,
        h: this.zoneDrag.originRect.h
      })
    },
    handleZoneResizeMove (e) {
      if (!this.zoneResize) return
      const zone = this.zones.find(z => z.id === this.zoneResize.zoneId)
      if (!zone) return
      const local = this.getMapLocalFromEvent(e)
      const design = mapPxToDesign(local.px, local.py, this.mapNW, this.mapNH)
      const dx = design.x - this.zoneResize.startDesign.x
      const dy = design.y - this.zoneResize.startDesign.y
      zone.rect = applyResize(this.zoneResize.originRect, this.zoneResize.handle, dx, dy)
    },
    finishZoneDraw () {
      if (!this.isDrawingZone || !this.zoneDrawStart) return
      const rect = this.zoneDraftRect
        ? clampRectToDesign(this.zoneDraftRect)
        : null
      this.cancelZoneDraw()
      if (!rect || rect.w < 24 || rect.h < 24) {
        this.editTool = 'draw'
        return
      }
      const zone = {
        id: createZoneId(),
        type: 'merged',
        label: `合并区域 ${this.zones.length + 1}`,
        rect,
        rentStatus: ZONE_RENT_STATUS.VACANT,
        splits: null,
        isNew: true
      }
      this.zones.push(zone)
      this.selectedZoneId = zone.id
      this.editTool = 'select'
      this.persistFloorZones(true)
      this.$nextTick(() => {
        if (this.$refs.editPanel) this.$refs.editPanel.focusRename()
      })
    },
    setEditTool (tool) {
      if (tool === 'draw') {
        this.startDrawZone()
      } else {
        this.editTool = 'select'
        this.cancelZoneDraw()
      }
    },
    applyVisualSplit (parts, direction) {
      const zone = this.selectedZone
      if (!zone) {
        this.$message.info('请先在地图上点击选中一个区域')
        return
      }
      const dirLabel = direction === 'horizontal' ? '横向' : '竖向'
      this.$confirm(
        `将把「${zone.label}」拆成 ${parts} 个独立区域（${dirLabel}），拆分后每一块可单独命名、移动和调整，互不影响。是否继续？`,
        '拆分为独立区域',
        { type: 'info', confirmButtonText: '确认拆分', cancelButtonText: '取消' }
      )
        .then(() => {
          const temp = { ...cloneZone(zone), splits: { direction, parts } }
          const newZones = explodeZoneToParts(temp)
          const idx = this.zones.findIndex(z => z.id === zone.id)
          if (idx < 0) return
          this.zones.splice(idx, 1, ...newZones)
          this.selectedZoneId = newZones[0].id
          this.editTool = 'select'
          this.persistFloorZones(true)
          this.$message.success(`已拆分为 ${parts} 个独立区域，请分别点击设置名称`)
          this.$nextTick(() => {
            if (this.$refs.editPanel) this.$refs.editPanel.focusRename()
          })
        })
        .catch(() => {})
    },
    clearRenameNewFlag () {
      const zone = this.selectedZone
      if (zone && zone.isNew) delete zone.isNew
    },
    renameSelectedZoneInline (name) {
      const zone = this.selectedZone
      if (!zone) return
      zone.label = name != null ? String(name) : ''
      if (zone.isNew && zone.label.trim()) delete zone.isNew
      this.persistFloorZones(true)
    },
    updateZoneRentStatus (status) {
      const zone = this.selectedZone
      if (!zone) return
      zone.rentStatus = normalizeZoneRentStatus(status)
      this.persistFloorZones(true)
    },
    deleteSelectedZone () {
      const zone = this.selectedZone
      if (!zone) return
      this.$confirm(`确定删除「${zone.label}」吗？`, '删除区域', { type: 'warning' })
        .then(() => {
          this.zones = this.zones.filter(z => z.id !== zone.id)
          this.selectedZoneId = null
          this.persistFloorZones(true)
        })
        .catch(() => {})
    },
    selectZoneFromList (zoneId) {
      this.selectedZoneId = zoneId
      this.editTool = 'select'
    },
    countLightsInZone (zone) {
      if (!zone) return 0
      return this.lights.filter(l => lightInZone(l, zone.rect, this.mapNW, this.mapNH)).length
    },
    isLightHighlighted (light) {
      if (this.editMode || !this.highlightZoneId) return true
      const zone = this.zones.find(z => z.id === this.highlightZoneId)
      if (!zone) return true
      return lightInZone(light, zone.rect, this.mapNW, this.mapNH)
    },
    initZoneEditOnFloorChange () {
      this.selectedZoneId = null
      this.highlightZoneId = null
      this.cancelZoneDraw()
      this.zoneDrag = null
      this.zoneResize = null
      this.loadFloorZones()
    },
    getResizeHandles () {
      return RESIZE_HANDLES
    }
  }
}
