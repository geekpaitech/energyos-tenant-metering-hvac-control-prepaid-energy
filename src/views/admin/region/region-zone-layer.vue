<template>
  <div
    v-if="zones.length || editMode"
    class="region-zone-layer"
    :class="{ 'region-zone-layer--view': !editMode }"
    v-show="mapReady"
  >
    <div
      v-for="item in displayItems"
      :key="item.id"
      class="zone-rect"
      :class="zoneRectClass(item)"
      :style="[zoneStyle(item.renderRect), zoneStatusStyle(item.rentStatus)]"
      @mousedown.stop="onBodyMouseDown(item, $event)"
      @click.stop="onZoneClick(item)"
    >
      <span class="zone-label">
        <span class="zone-label-name">{{ item.displayLabel }}</span>
        <span class="zone-label-status" :style="{ color: statusColor(item.rentStatus) }">
          {{ statusLabel(item.rentStatus) }}
        </span>
      </span>

      <template v-if="editMode && selectedZoneId === item.id">
        <span
          v-for="h in handles"
          :key="h"
          class="zone-handle"
          :class="'zone-handle--' + h"
          :style="{ borderColor: statusColor(item.rentStatus) }"
          @mousedown.stop="onHandleMouseDown(item, h, $event)"
        />
        <span class="zone-move-hint">拖动移动 · 拖角点调整大小</span>
      </template>
    </div>

    <div v-if="editMode && draftRect" class="zone-rect zone-rect--draft" :style="zoneStyle(draftRect)">
      <span class="zone-draft-size">{{ draftSizeText }}</span>
    </div>
  </div>
</template>

<script>
import { buildDisplayZones, designToMapPx } from './region-zones'
import { getZoneStatusOption, zoneStatusMapStyle } from './region-zone-status'

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

export default {
  name: 'RegionZoneLayer',
  props: {
    mapReady: Boolean,
    mapNW: Number,
    mapNH: Number,
    zones: { type: Array, default: () => [] },
    editMode: Boolean,
    selectedZoneId: { type: String, default: null },
    highlightZoneId: { type: String, default: null },
    draftRect: { type: Object, default: null }
  },
  data () {
    return { handles: HANDLES }
  },
  computed: {
    displayItems () {
      return buildDisplayZones(this.zones)
    },
    draftSizeText () {
      if (!this.draftRect) return ''
      return `${Math.round(this.draftRect.w)} × ${Math.round(this.draftRect.h)}`
    }
  },
  methods: {
    statusColor (status) {
      return getZoneStatusOption(status).color
    },
    statusLabel (status) {
      return getZoneStatusOption(status).label
    },
    zoneStatusStyle (status) {
      return zoneStatusMapStyle(status)
    },
    zoneRectClass (item) {
      const status = getZoneStatusOption(item.rentStatus).value
      const classes = [`zone-rect--${status.toLowerCase().replace('_', '-')}`]
      if (this.editMode && this.selectedZoneId === item.id) {
        classes.push('zone-rect--selected')
      }
      if (!this.editMode && this.highlightZoneId === item.id) {
        classes.push('zone-rect--highlight')
      }
      return classes
    },
    zoneStyle (designRect) {
      if (!designRect) return {}
      const r = designToMapPx(designRect, this.mapNW, this.mapNH)
      return {
        left: r.x + 'px',
        top: r.y + 'px',
        width: r.w + 'px',
        height: r.h + 'px'
      }
    },
    onZoneClick (item) {
      this.$emit('zone-click', item.id, item)
    },
    onBodyMouseDown (item, e) {
      if (!this.editMode) return
      this.$emit('zone-drag-start', item.id, e)
    },
    onHandleMouseDown (item, handle, e) {
      if (!this.editMode) return
      this.$emit('zone-resize-start', item.id, handle, e)
    }
  }
}
</script>

<style lang="scss" scoped>
.region-zone-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;

  &--view .zone-rect {
    cursor: pointer;
  }
}

.zone-rect {
  position: absolute;
  border: 2px solid;
  border-radius: 4px;
  pointer-events: auto;
  cursor: move;
  box-sizing: border-box;

  &--selected {
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08), 0 0 0 5px var(--zone-status-color, #0170fe);
    z-index: 5;
  }

  &--highlight {
    box-shadow: 0 0 0 2px var(--zone-status-color, #0170fe);
    z-index: 4;
  }

  &--draft {
    border: 2px dashed #0170fe !important;
    background: rgba(1, 112, 254, 0.06) !important;
    pointer-events: none;
    cursor: crosshair;
  }
}

.zone-label {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  max-width: 92%;
  padding: 4px 10px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  pointer-events: none;
}

.zone-label-name {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.zone-label-status {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
}

.zone-draft-size {
  position: absolute;
  bottom: -28px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  font-weight: 600;
  color: #0170fe;
  background: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.zone-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #fff;
  border: 2px solid #0170fe;
  border-radius: 2px;
  box-sizing: border-box;
  z-index: 6;
  &--nw { left: -6px; top: -6px; cursor: nwse-resize; }
  &--n  { left: 50%; top: -6px; margin-left: -5px; cursor: ns-resize; }
  &--ne { right: -6px; top: -6px; cursor: nesw-resize; }
  &--e  { right: -6px; top: 50%; margin-top: -5px; cursor: ew-resize; }
  &--se { right: -6px; bottom: -6px; cursor: nwse-resize; }
  &--s  { left: 50%; bottom: -6px; margin-left: -5px; cursor: ns-resize; }
  &--sw { left: -6px; bottom: -6px; cursor: nesw-resize; }
  &--w  { left: -6px; top: 50%; margin-top: -5px; cursor: ew-resize; }
}

.zone-move-hint {
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: #606266;
  background: rgba(255, 255, 255, 0.95);
  padding: 2px 8px;
  border-radius: 3px;
  pointer-events: none;
}
</style>
