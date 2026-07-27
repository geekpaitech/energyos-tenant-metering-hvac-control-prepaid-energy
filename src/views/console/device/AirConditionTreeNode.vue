<template>
  <div class="tn-wrap" :class="direction === 'vertical' ? 'dir-v' : 'dir-h'">
    <div
      v-if="node.type === NODE_TYPES.ROOT"
      class="tn-root"
      :data-tn-id="node.id"
      :class="{ 'tn-root-active': node.id === selectedId }"
      @mousedown.stop="$emit('start-canvas-drag', $event)"
      @touchstart.stop="$emit('start-canvas-drag', $event)"
      @click.stop="$emit('select', node)"
    >
      <i class="el-icon-office-building root-icon" />
      <div class="root-name">{{ node.name }}</div>
    </div>

    <div
      v-else
      class="tn-dev"
      :data-tn-id="node.id"
      :class="[{ 'tn-active': node.id === selectedId }, node.rawType === 'air' ? 'tn-air' : 'tn-common', airStateClass]"
      @click.stop="onNodeClick"
    >
      <template v-if="node.rawType === 'air'">
        <div class="air-panel" :style="airPanelStyle">
          <div class="air-head">
            <div class="air-name" :title="node.name">{{ $displayDynamicName(node.name, 120) }}</div>
            <div class="air-indicators">
              <div class="indicator-item">
                <span class="indicator-dot" :class="airOnline ? 'online' : 'offline'"></span>
                <span class="indicator-text">{{ airOnline ? $t('deviceConditioning.online') : $t('deviceConditioning.offline') }}</span>
              </div>
              <div class="indicator-item lock-field" @click.stop>
                <span class="indicator-dot" :class="airPower ? 'on' : 'off'"></span>
                <span class="indicator-text">{{ airPower ? $t('deviceConditioning.tagAcPowerOn') : $t('deviceConditioning.tagAcPowerOff') }}</span>
                <el-tooltip
                  v-if="airRaw && airRaw.lockPowerStatus"
                  class="item"
                  effect="dark"
                  :content="lockPowerStatusLabel"
                  placement="top"
                >
                  <i class="el-icon-lock card-lock-icon"></i>
                </el-tooltip>
              </div>
            </div>
          </div>
          <div class="air-body">
            <div class="air-temp-main">
              <div class="air-temp-row lock-field" @click.stop>
                <span class="air-temp-val">{{ targetTempText }}</span>
                <span class="air-temp-unit">℃</span>
                <el-tooltip
                  v-if="airRaw && (airRaw.minTemperature || airRaw.maxTemperature)"
                  class="item"
                  effect="dark"
                  :content="tempLockLabel"
                  placement="top"
                >
                  <i class="el-icon-lock card-lock-icon"></i>
                </el-tooltip>
              </div>
              <div class="air-temp-sub">{{ $t('deviceConditioning.treeSetTemp') }}</div>
            </div>
            <div class="air-divider" />
            <div class="air-temp-side">
              <div class="air-room-label">{{ $t('deviceConditioning.treeRoomTemp') }}</div>
              <div class="air-room-val">{{ roomTempText }}℃</div>
            </div>
          </div>
          <div class="air-foot">
            <div class="air-meta">
              <i :class="getModeIcon(airMode)" class="air-mode-icon"></i>
              <span class="air-meta-group lock-field" @click.stop>
                <span class="air-meta-item">{{ modeText }}</span>
                <el-tooltip
                  v-if="airRaw && airRaw.lockOperationMode"
                  class="item"
                  effect="dark"
                  :content="lockOperationModeLabel"
                  placement="top"
                >
                  <i class="el-icon-lock card-lock-icon"></i>
                </el-tooltip>
              </span>
              <span class="air-meta-dot">·</span>
              <span class="air-meta-group lock-field" @click.stop>
                <span class="air-meta-item">{{ fanText }}</span>
                <el-tooltip
                  v-if="airRaw && airRaw.lockFanSpeed"
                  class="item"
                  effect="dark"
                  :content="lockFanSpeedLabel"
                  placement="top"
                >
                  <i class="el-icon-lock card-lock-icon"></i>
                </el-tooltip>
              </span>
            </div>
            <div v-if="faultText" class="air-fault" :title="faultText">{{ faultText }}</div>
          </div>
          <div class="air-mini">
            <div v-if="node.serial" class="air-serial" :title="node.serial">{{ node.serial }}</div>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="dev-icon">
          <img :src="iconSrc" class="meter-img" :alt="$t('deviceConditioning.treeAltNode')" />
        </div>
        <div class="dev-info">
          <div class="dev-name" :title="node.name">{{ $displayDynamicName(node.name, 120) }}</div>
          <div v-if="node.rawType === 'outdoor' && node.meters && node.meters.length" class="dev-meters">
            <span
              v-for="(m, idx) in node.meters"
              :key="`${m.serial || m.name}_${idx}`"
              class="meter-tag"
              :title="m.name || ''"
            >
              <img :src="ICON_METER" class="meter-tag-icon" alt="" />
              <span class="meter-tag-text">{{ m.name }}</span>
            </span>
          </div>
          <div v-else-if="node.serial" class="dev-serial" :title="node.serial">{{ node.serial }}</div>
        </div>
      </template>
    </div>

    <template v-if="hasChildren">
      <template v-if="direction === 'horizontal'">
        <div v-if="node.type !== NODE_TYPES.ROOT" class="tn-conn">
          <div class="h-seg" />
          <div class="col-btn" :title="collapsed ? $t('deviceConditioning.treeExpand') : $t('deviceConditioning.treeCollapse')" @click.stop="toggleCollapse">
            <i :class="collapsed ? 'el-icon-plus' : 'el-icon-minus'" />
          </div>
        </div>
        <div v-else class="h-seg root-gap" />

        <div v-if="!collapsed" class="tn-children-wrap">
          <div v-for="child in node.children" :key="child.id" class="child-row">
            <div class="h-seg child-h-seg" />
            <air-condition-tree-node
              :node="child"
              :selected-id="selectedId"
              :direction="direction"
              @select="$emit('select', $event)"
              @view-outdoor="$emit('view-outdoor', $event)"
              @view-air="$emit('view-air', $event)"
              @start-canvas-drag="$emit('start-canvas-drag', $event)"
            />
          </div>
        </div>

        <div v-else class="tn-collapsed">
          <div class="h-seg" />
          <div class="collapsed-badge" :title="$t('deviceConditioning.treeExpandN', { n: childCount })" @click.stop="toggleCollapse">
            <i class="el-icon-more" />
            <span>{{ childCount }}</span>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="tn-conn-v">
          <div class="v-seg" />
          <div class="col-btn" :title="collapsed ? $t('deviceConditioning.treeExpand') : $t('deviceConditioning.treeCollapse')" @click.stop="toggleCollapse">
            <i :class="collapsed ? 'el-icon-plus' : 'el-icon-minus'" />
          </div>
        </div>

        <template v-if="!collapsed">
          <div v-if="node.type === NODE_TYPES.ROOT" class="tn-children-root-v">
            <div v-for="child in node.children" :key="child.id" class="root-group">
              <air-condition-tree-node
                :node="child"
                :selected-id="selectedId"
                :direction="direction"
                @select="$emit('select', $event)"
                @view-outdoor="$emit('view-outdoor', $event)"
                @view-air="$emit('view-air', $event)"
                @start-canvas-drag="$emit('start-canvas-drag', $event)"
              />
            </div>
          </div>
          <div v-else class="tn-children-wrap-v" :class="{ single: childCount === 1 }">
            <div v-if="childCount > 1" class="h-seg-v" :style="hSegStyle"></div>
            <div v-for="child in node.children" :key="child.id" class="child-col">
              <div class="v-seg child" />
              <air-condition-tree-node
                :node="child"
                :selected-id="selectedId"
                :direction="direction"
                @select="$emit('select', $event)"
                @view-outdoor="$emit('view-outdoor', $event)"
                @view-air="$emit('view-air', $event)"
                @start-canvas-drag="$emit('start-canvas-drag', $event)"
              />
            </div>
          </div>
        </template>

        <div v-else class="tn-collapsed-v">
          <div class="v-seg" />
          <div class="collapsed-badge" :title="$t('deviceConditioning.treeExpandN', { n: childCount })" @click.stop="toggleCollapse">
            <i class="el-icon-more" />
            <span>{{ childCount }}</span>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script>
import { translateAcEnum } from '@/utils/acDeviceI18n'

const NODE_TYPES = Object.freeze({
  ROOT: 'root',
  DEVICE: 'device'
})

export default {
  name: 'AirConditionTreeNode',
  props: {
    node: { type: Object, required: true },
    selectedId: { type: [String, Number], default: null },
    direction: { type: String, default: 'horizontal' }
  },
  data () {
    return {
      NODE_TYPES,
      ICON_WJ: require('@/assets/images/wj.png'),
      ICON_NJ: require('@/assets/images/nj.png'),
      ICON_METER: require('@/assets/images/szwyIcon2.jpg'),
      collapsed: !!(this.node && this.node.rawType === 'outdoor' && this.direction !== 'vertical')
    }
  },
  watch: {
    direction (val) {
      if (val === 'vertical') {
        this.collapsed = false
        return
      }
      if (val === 'horizontal' && this.node && this.node.rawType === 'outdoor') {
        this.collapsed = true
      }
    }
  },
  computed: {
    airRaw () {
      return this.node && this.node.rawType === 'air' ? (this.node.raw || {}) : null
    },
    airOnline () {
      const raw = this.airRaw
      if (!raw) return true
      const code = raw.faultCode != null ? String(raw.faultCode).trim().toUpperCase() : ''
      if (code === 'LOST') return false
      if (raw.state != null) return raw.state === 0
      if (raw.onlineStatus != null) return raw.onlineStatus === 0
      return true
    },
    airPower () {
      const raw = this.airRaw
      if (!raw) return false
      return raw.powerStatus === 1
    },
    airMode () {
      const raw = this.airRaw
      return raw ? raw.operationMode : null
    },
    airFan () {
      const raw = this.airRaw
      return raw ? raw.fanSpeed : null
    },
    targetTempText () {
      const raw = this.airRaw
      const v = raw ? raw.targetTemperature : null
      return v === 0 || v ? String(v) : '--'
    },
    roomTempText () {
      const raw = this.airRaw
      const v = raw ? raw.roomTemperature : null
      return v === 0 || v ? String(v) : '--'
    },
    modeText () {
      void this.$i18n.locale
      const k = { 0: 'enumModeAuto', 1: 'enumModeHeat', 2: 'enumModeCool', 4: 'enumModeFan', 8: 'enumModeDry' }[this.airMode]
      return k ? this.$t(`deviceConditioning.${k}`) : '-'
    },
    fanText () {
      void this.$i18n.locale
      const k = { 0: 'enumFanAuto', 1: 'enumFanLow', 2: 'enumFanMid', 3: 'enumFanHigh' }[this.airFan]
      return k ? this.$t(`deviceConditioning.${k}`) : '-'
    },
    lockPowerStatusLabel () {
      const raw = this.airRaw
      if (!raw || !raw.lockPowerStatus) return ''
      return translateAcEnum(this, 'lockPowerStatus', raw.lockPowerStatus)
    },
    lockOperationModeLabel () {
      const raw = this.airRaw
      if (!raw || !raw.lockOperationMode) return ''
      return translateAcEnum(this, 'lockOperationMode', raw.lockOperationMode)
    },
    lockFanSpeedLabel () {
      const raw = this.airRaw
      if (!raw || !raw.lockFanSpeed) return ''
      return translateAcEnum(this, 'lockFanSpeed', raw.lockFanSpeed)
    },
    tempLockLabel () {
      const raw = this.airRaw
      if (!raw) return ''
      return `${raw.minTemperature}-${raw.maxTemperature}℃`
    },
    faultText () {
      const raw = this.airRaw
      const v = raw ? raw.faultCode : ''
      const s = (v == null ? '' : String(v)).trim()
      if (!s) return ''
      if (s.toUpperCase() === 'LOST') return ''
      return s.length > 16 ? `${s.slice(0, 15)}…` : s
    },
    airStateClass () {
      if (!this.airRaw) return ''
      if (!this.airOnline) return 'is-offline'
      if (!this.airPower) return 'is-standby'
      return `is-mode-${this.airMode || 0}`
    },
    airPanelStyle () {
      if (!this.airRaw) return {}
      if (!this.airOnline) {
        return {
          background: 'linear-gradient(135deg, #f5f7fa, #e4e7ed)',
          borderColor: '#dcdfe6'
        }
      }
      if (!this.airPower) {
        return {
          background: 'linear-gradient(135deg, #ffffff, #f2f6fc)',
          borderColor: '#dcdfe6'
        }
      }
      const room = Number(this.airRaw.roomTemperature)
      if (this.airMode === 1) {
        const hotLv = !Number.isFinite(room) ? 2 : room >= 30 ? 3 : room >= 26 ? 2 : 1
        if (hotLv === 3) return { background: 'linear-gradient(135deg, #ffd180, #ff6d00, #e53935)', borderColor: '#ff6d00' }
        if (hotLv === 2) return { background: 'linear-gradient(135deg, #fff59d, #ffb74d, #ff7043)', borderColor: '#ffb74d' }
        return { background: 'linear-gradient(135deg, #fffde7, #ffe082, #ffcc80)', borderColor: '#ffe082' }
      }
      if (this.airMode === 2) {
        const clamp01 = (v) => Math.min(1, Math.max(0, v))
        const mix = (a, b, t) => Math.round(a + (b - a) * t)
        const mixRGB = (c1, c2, t) => {
          const tt = clamp01(t)
          return {
            r: mix(c1.r, c2.r, tt),
            g: mix(c1.g, c2.g, tt),
            b: mix(c1.b, c2.b, tt)
          }
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
          background: `linear-gradient(135deg, ${rgbStr(cStart, 1)}, ${rgbStr(cMid, 1)}, ${rgbStr(cEnd, 1)})`,
          borderColor: rgbStr(cEnd, 0.65)
        }
      }
      if (this.airMode === 4) {
        return { background: 'linear-gradient(135deg, #e0f7fa, #80deea, #26c6da)', borderColor: '#80deea' }
      }
      if (this.airMode === 8) {
        return { background: 'linear-gradient(135deg, #ede7f6, #b39ddb, #673ab7)', borderColor: '#b39ddb' }
      }
      return { background: 'linear-gradient(135deg, #eceff1, #cfd8dc, #90a4ae)', borderColor: '#cfd8dc' }
    },
    hasChildren () {
      return Array.isArray(this.node.children) && this.node.children.length > 0
    },
    childCount () {
      return this.node.children ? this.node.children.length : 0
    },
    hSegStyle () {
      const c = this.childCount
      if (c <= 1) return {}
      // 假设每个子节点等宽，两端缩进半个子节点的宽度
      const pct = (1 / (2 * c)) * 100
      return {
        left: `${pct}%`,
        right: `${pct}%`
      }
    },
    iconSrc () {
      if (this.node.rawType === 'outdoor') return this.ICON_WJ
      if (this.node.rawType === 'meter') return this.ICON_METER
      if (this.node.rawType === 'air') return this.ICON_NJ
      return this.ICON_NJ
    }
  },
  methods: {
    toggleCollapse () {
      this.collapsed = !this.collapsed
    },
    onNodeClick () {
      this.$emit('select', this.node)
      if (this.node.rawType === 'outdoor' && this.node.raw) {
        this.$emit('view-outdoor', this.node.raw)
        return
      }
      if (this.node.rawType === 'air' && this.node.raw) {
        this.$emit('view-air', this.node.raw)
      }
    },
    getModeIcon (mode) {
      const iconMap = {
        0: 'el-icon-refresh', // 自动
        1: 'el-icon-sunny', // 制热
        2: 'el-icon-light-rain', // 制冷
        4: 'el-icon-moon-night', // 送风
        8: 'el-icon-sunrise' // 除湿
      }
      return iconMap[mode] || 'el-icon-info'
    }
  }
}
</script>

<style scoped>
.tn-wrap {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  position: relative;
}

.tn-wrap.dir-v {
  flex-direction: column;
  align-items: center;
}

/* ── 根节点 ── */
.tn-root {
  background: linear-gradient(135deg, #e53935, #b71c1c);
  color: #fff;
  border-radius: 10px;
  padding: 14px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: grab;
  box-shadow: 0 4px 14px rgba(229, 57, 53, .35);
  user-select: none;
  flex-shrink: 0;
  transition: transform .2s, box-shadow .2s;
  min-width: 96px;
}

.tn-root:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(229, 57, 53, .4);
}

.tn-root:active {
  cursor: grabbing;
}

.tn-root-active {
  outline: 3px solid rgba(255, 255, 255, .5);
  outline-offset: 2px;
}

.root-icon {
  font-size: 20px;
  opacity: .9;
}

.root-name {
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

/* ── 设备节点 ── */
.tn-dev {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 8px 10px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
  cursor: pointer;
  transition: all .18s;
  user-select: none;
  flex-shrink: 0;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .05);
}

.tn-dev:hover {
  background: #fcfdfe;
  border-color: #c0c4cc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .08);
  transform: translateY(-1px);
}

.tn-dev.tn-active {
  background: #f0f9ff;
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, .2);
}

.dev-icon {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 6px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.meter-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, .1));
}

.dev-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dev-meters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}

.meter-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 220px;
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
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, .06));
}

.meter-tag-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tn-air {
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  min-width: 240px;
}

.tn-air:hover,
.tn-air.tn-active {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
  transform: none;
}

.air-panel {
  width: 240px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, .08);
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, .06), inset 0 1px 0 rgba(255, 255, 255, .6);
  color: #111827;
  transition: all 0.2s ease;
}

.air-panel:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, .12), inset 0 1px 0 rgba(255, 255, 255, .8);
  transform: translateY(-2px);
}

.air-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px 8px;
}

.air-name {
  font-size: 14px;
  font-weight: 800;
  line-height: 1.2;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.air-indicators {
  display: flex;
  gap: 12px;
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
  box-shadow: inset 0 1px 2px rgba(0,0,0,.2);
}

.indicator-dot.online {
  background-color: #10b981;
  box-shadow: 0 0 4px #10b981, inset 0 1px 2px rgba(0,0,0,.2);
}

.indicator-dot.offline {
  background-color: #9ca3af;
}

.indicator-dot.on {
  background-color: #3b82f6;
  box-shadow: 0 0 4px #3b82f6, inset 0 1px 2px rgba(0,0,0,.2);
}

.indicator-dot.off {
  background-color: #9ca3af;
}

.indicator-text {
  font-size: 11px;
  font-weight: 600;
  color: rgba(17, 24, 39, .65);
}

.air-body {
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  align-items: center;
  gap: 0;
  padding: 8px 14px 12px;
}

.air-divider {
  width: 1px;
  height: 44px;
  background: rgba(0, 0, 0, .12);
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
  align-items: center;
  gap: 2px;
}

.air-temp-val {
  font-size: 28px;
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
  color: rgba(17, 24, 39, .72);
}

.air-temp-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.air-room-label {
  font-size: 11px;
  color: rgba(17, 24, 39, .72);
}

.air-room-val {
  font-size: 16px;
  font-weight: 700;
}

.air-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 14px 10px;
  background: rgba(255, 255, 255, .35);
  border-top: 1px solid rgba(0, 0, 0, .06);
}

.air-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(17, 24, 39, .85);
}

.air-meta-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.lock-field {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  > .item {
    display: inline-flex;
    align-items: center;
    line-height: 1;
  }
}

.card-lock-icon {
  color: #d46b08 !important;
  font-size: 13px;
  line-height: 1;
  flex-shrink: 0;
}

.air-mode-icon {
  font-size: 14px;
  margin-right: 2px;
  opacity: 0.8;
}

.air-meta-dot {
  color: rgba(17, 24, 39, .45);
}

.air-fault {
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 700;
  color: #b71c1c;
}

.air-mini {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px 10px;
  background: rgba(255, 255, 255, .35);
  border-top: 1px solid rgba(0, 0, 0, .08);
}

.air-serial {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 700;
  color: rgba(17, 24, 39, .82);
}

.air-fault-mini {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 800;
  color: #b71c1c;
}
.dev-name {
  font-size: 12px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}

.dev-serial {
  font-size: 10px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

/* ── 连接线 ── */
.tn-conn {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.h-seg {
  width: 32px;
  height: 2px;
  background: #dcdfe6;
  flex-shrink: 0;
  align-self: center;
  transition: background .2s;
}

.root-gap {
  width: 12px;
}

.col-btn {
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1.5px solid #dcdfe6;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 11px;
  color: #909399;
  transition: all .18s;
  flex-shrink: 0;
  z-index: 2;
  box-shadow: 0 1px 4px rgba(0, 0, 0, .08);
}

.col-btn:hover {
  border-color: #409eff;
  color: #409eff;
  background: #ecf5ff;
  transform: scale(1.12);
}

/* ── 子节点列表 ── */
.tn-children-wrap {
  display: flex;
  flex-direction: column;
  position: relative;
  flex-shrink: 0;
}

.child-row {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: 18px 0;
  position: relative;
}

.child-row::before {
  content: '';
  position: absolute;
  left: 0;
  width: 2px;
  background: #dcdfe6;
  z-index: 0;
  top: 0;
  height: 100%;
}

.child-row:first-child::before {
  top: 50%;
  height: 50%;
}

.child-row:last-child::before {
  top: 0;
  height: 50%;
}

.child-row:first-child:last-child::before {
  display: none;
}

.child-row:first-child {
  padding-top: 0;
}

.child-row:last-child {
  padding-bottom: 0;
}

.child-h-seg {
  width: 32px;
  height: 2px;
  background: #dcdfe6;
  flex-shrink: 0;
  align-self: center;
  transition: background .2s;
}

/* ── 折叠角标 ── */
.tn-collapsed {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.collapsed-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 10px;
  background: #f0f2f5;
  border: 1px solid #e0e3e8;
  font-size: 11px;
  color: #888;
  cursor: pointer;
  transition: all .15s;
}

.collapsed-badge:hover {
  background: #e6f4ff;
  border-color: #91caff;
  color: #1890ff;
}

/* ── 纵向连接线与子节点区域 ── */
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

.tn-children-wrap-v {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 34px;
  padding-top: 18px;
  margin-top: 4px;
}

.tn-children-root-v {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  padding-top: 12px;
  margin-top: 4px;
}

.tn-children-root-v::before {
  content: none;
}

.root-group {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tn-wrap.dir-v .tn-root {
  padding: 12px 16px;
  border-radius: 9px;
}

.tn-wrap.dir-v .tn-dev:not(.tn-air) {
  min-width: 180px;
  padding: 6px 8px;
  border-radius: 7px;
}

.tn-wrap.dir-v .air-panel {
  width: 220px;
  border-radius: 10px;
}

.tn-wrap.dir-v .air-head {
  padding: 10px 12px 6px;
}

.tn-wrap.dir-v .air-body {
  padding: 6px 12px 10px;
}

.tn-wrap.dir-v .air-foot {
  padding: 6px 12px 8px;
}

.tn-wrap.dir-v .air-mini {
  padding: 6px 10px 8px;
}

.tn-wrap.dir-v .tn-children-wrap-v {
  gap: 26px;
}

.tn-wrap.dir-v .tn-children-root-v {
  gap: 40px;
  padding-top: 12px;
}

.tn-children-wrap-v.single {
  gap: 0;
  padding-top: 0;
}

.child-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex-shrink: 0;
}

/* 动态调整横线长度：用内联样式控制 left/right，这里只需基础定位 */
.h-seg-v {
  position: absolute;
  top: 0;
  height: 2px;
  background: #dcdfe6;
  z-index: 0;
}

.tn-collapsed-v {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 6px;
}
</style>
