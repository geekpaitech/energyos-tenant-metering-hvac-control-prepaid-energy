<template>
  <div class="tn-wrap" :class="{
    'drag-over-inside': dropPosition === 'inside',
    'is-dragging': isSelfDragging
  }" :data-id="node.id" @dragover.prevent.stop="onDragOver" @dragleave.stop="onDragLeave" @drop.prevent.stop="onDrop"
    @touchstart.stop="onTouchDragStart" @touchmove.stop.prevent="onTouchDragMove" @touchend.stop="onTouchDragEnd">

    <!-- 根节点 -->
    <div v-if="node.type === NODE_TYPES.ROOT" class="tn-root" :class="{ 'tn-root-active': node.id === selectedId }"
      @click.stop="onRootClick" @contextmenu.prevent="$emit('contextmenu', { event: $event, node })"
      @mousedown.stop="onRootMouseDown" @touchstart.stop="$emit('start-canvas-drag', $event)">
      <i class="el-icon-office-building root-icon" />
      <div class="root-name" :title="$displayBizHybrid(node.name, 200)">{{ $displayBizHybrid(node.name) }}</div>
    </div>

    <!-- 虚拟根 -->
    <div v-else-if="node.type === NODE_TYPES.VIRTUAL_ROOT" class="tn-virt-root"
      @mousedown.stop="$emit('start-canvas-drag', $event)" @touchstart.stop="$emit('start-canvas-drag', $event)" />

    <!-- 分类节点 -->
    <div v-else-if="node.type === NODE_TYPES.CATEGORY" ref="nodeEl" class="tn-cat" :class="{
      'tn-active': node.id === selectedId && !dropPosition,
      'insert-before': dropPosition === DROP_POSITIONS.BEFORE,
      'insert-after': dropPosition === DROP_POSITIONS.AFTER
    }" draggable="true" @click.stop="$emit('select', node)"
      @contextmenu.prevent="$emit('contextmenu', { event: $event, node })" @dragstart.stop="onDragStart"
      @dragend.stop="onDragEnd">
      <div class="cat-icon-wrap"><i class="el-icon-folder" /></div>
      <div class="cat-body">
        <div class="cat-name" :title="$displayBizHybrid(node.name, 200)">{{ $displayBizHybrid(node.name) }}</div>
      </div>
    </div>

    <!-- 设备节点（单表 / 双电源） -->
    <div v-else ref="nodeEl" class="tn-dev" :class="{
      'tn-active': node.id === selectedId && !dropPosition,
      'tn-dev-dual': node.type === NODE_TYPES.DEVICE_DUAL,
      'insert-before': dropPosition === DROP_POSITIONS.BEFORE,
      'insert-after': dropPosition === DROP_POSITIONS.AFTER
    }" draggable="true" @click.stop="$emit('select', node)"
      @contextmenu.prevent="$emit('contextmenu', { event: $event, node })" @dragstart.stop="onDragStart"
      @dragend.stop="onDragEnd">

      <!-- 单表 -->
      <template v-if="node.type !== NODE_TYPES.DEVICE_DUAL">
        <div class="dev-icon">
          <img :src="ICON_PRIMARY" class="meter-img" :alt="$t('subMeteringPage.altMeter')" />
        </div>
        <div class="dev-info">
          <div class="dev-name" :title="$displayBizHybrid(node.name, 200)">{{ $displayBizHybrid(node.name) }}</div>
          <div class="dev-serial">{{ node.serial || '—' }}</div>
          <div v-if="node.power != null" class="dev-power">
            {{ fmtShort(node.power) }} kW
          </div>
        </div>
      </template>

      <!-- 双电源 -->
      <template v-else>
        <div class="dual-badge">
          <i class="el-icon-connection" /> {{ $t('subMeteringPage.labelDualPower') }}
        </div>
        <div class="dual-meters">
          <div v-for="(m, idx) in node.dualMeter" :key="m.serial || idx" class="dual-meter-row">
            <div class="dev-icon small">
              <img :src="ICON_PRIMARY" class="meter-img" :alt="$t('subMeteringPage.altMeter')" />
            </div>
            <div class="dev-info">
              <div class="dev-name small" :title="$displayBizHybrid(m.name, 200)">{{ $displayBizHybrid(m.name) }}</div>
              <div class="dev-serial">{{ m.serial || '—' }}</div>
              <div v-if="m.p != null" class="dev-power">{{ fmtShort(m.p) }} kW</div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 子节点区域 -->
    <template v-if="hasChildren || hasHidden">
      <div v-if="node.type !== NODE_TYPES.ROOT && node.type !== NODE_TYPES.VIRTUAL_ROOT" class="tn-conn">
        <div class="h-seg" :class="lossLineClass(node.lossRate)" />
        <div class="col-btn" :class="lossLineClass(node.lossRate)" :title="collapsed ? $t('subMeteringPage.treeExpand') : $t('subMeteringPage.treeCollapse')"
          @click.stop="toggleCollapse">
          <i :class="collapsed ? 'el-icon-plus' : 'el-icon-minus'" />
          <span v-if="node.lossRate != null" class="loss-tag" :class="lossRateClass(node.lossRate)">
            {{ node.lossRate }}%
          </span>
        </div>
      </div>
      <div v-else class="h-seg root-gap" />

      <!-- 展开状态：子节点列表 -->
      <div v-if="!collapsed" class="tn-children-wrap">
        <div v-for="child in node.children" :key="child.id" class="child-row">
          <div class="h-seg child-h-seg" :class="lossLineClass(node.lossRate)" />
          <tree-node :node="child" :selected-id="selectedId" :depth="depth + 1" :is-dragging="isDragging"
            @select="$emit('select', $event)" @contextmenu="$emit('contextmenu', $event)"
            @drag-node="$emit('drag-node', $event)" @drag-end="$emit('drag-end')"
            @drop-node="$emit('drop-node', $event)" @sort-node="$emit('sort-node', $event)"
            @start-canvas-drag="$emit('start-canvas-drag', $event)" />
        </div>
      </div>

      <!-- 折叠状态：角标 -->
      <div v-else class="tn-collapsed">
        <div class="h-seg" />
        <div class="collapsed-badge" :title="$t('subMeteringPage.treeExpandChildren', { n: childCount })" @click.stop="toggleCollapse">
          <i class="el-icon-more" />
          <span>{{ childCount }}</span>
        </div>
      </div>
    </template>

    <!-- 隐藏节点占位 -->
    <template v-if="!hasChildren && node.hiddenCount && !hasHidden">
      <div class="tn-conn">
        <div class="h-seg" />
        <div class="badge-more" :title="$t('subMeteringPage.treeExpandHidden', { n: node.hiddenCount })" @click.stop="expandHidden">
          +{{ node.hiddenCount }}
        </div>
      </div>
    </template>
  </div>
</template>

<script>
const NODE_TYPES = Object.freeze({
  ROOT: 'root',
  VIRTUAL_ROOT: 'virtual-root',
  CATEGORY: 'category',
  DEVICE: 'device',
  DEVICE_DUAL: 'device-dual'
})

const DROP_POSITIONS = Object.freeze({
  BEFORE: 'before',
  AFTER: 'after',
  INSIDE: 'inside'
})

const DRAG_THRESHOLD = 4
const DRAG_THROTTLE_MS = 16

export default {
  name: 'TreeNode',

  props: {
    node: { type: Object, required: true },
    selectedId: { type: [String, Number], default: null },
    depth: { type: Number, default: 0 },
    isDragging: { type: Boolean, default: false }
  },

  data () {
    return {
      NODE_TYPES,
      DROP_POSITIONS,
      ICON_PRIMARY: require('@/assets/images/szwyIcon2.jpg'),

      collapsed: false,
      dropPosition: null,
      isSelfDragging: false,
      hasHidden: false,

      _dragOverTimer: null,
      _rootDragging: false,
      _rootStartX: 0,
      _rootStartY: 0,
      _rootCleanup: null
    }
  },

  computed: {
    hasChildren () {
      return Array.isArray(this.node.children) && this.node.children.length > 0
    },
    childCount () {
      return this.node.children ? this.node.children.length : 0
    },
    canSort () {
      return this.node.type !== NODE_TYPES.ROOT && this.node.type !== NODE_TYPES.VIRTUAL_ROOT
    }
  },

  watch: {
    isDragging (val) {
      if (!val) this.dropPosition = null
    }
  },

  beforeDestroy () {
    this._cleanupRootListeners()
    if (this._dragOverTimer) clearTimeout(this._dragOverTimer)
  },

  methods: {
    fmtShort (v) {
      if (v == null || v === '') return '--'
      return String(v)
    },

    lossLineClass (rate) {
      if (rate == null || rate === '') return ''
      return parseFloat(rate) > 20 ? 'loss-red' : 'loss-green'
    },

    lossRateClass (rate) {
      if (rate == null || rate === '') return ''
      return parseFloat(rate) > 20 ? 'red' : 'green'
    },

    toggleCollapse () {
      this.collapsed = !this.collapsed
    },

    expandHidden () {
      const count = this.node.hiddenCount || 0
      const children = Array.from({ length: count }, (_, i) => ({
        id: `hidden-${this.node.id}-${i}`,
        name: this.$t('subMeteringPage.placeholderChildDevice', { n: i + 1 }),
        type: NODE_TYPES.DEVICE,
        serial: '—',
        value: null
      }))
      this.$set(this.node, 'children', children)
      this.$delete(this.node, 'hiddenCount')
      this.hasHidden = true
      this.collapsed = false
    },

    onRootMouseDown (e) {
      if (e.button !== 0) return
      this._cleanupRootListeners()
      this._rootDragging = false
      this._rootStartX = e.clientX
      this._rootStartY = e.clientY

      const onMove = me => {
        if (this._rootDragging) return
        const dx = Math.abs(me.clientX - this._rootStartX)
        const dy = Math.abs(me.clientY - this._rootStartY)
        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
          this._rootDragging = true
          this.$emit('start-canvas-drag', me)
        }
      }
      const onUp = () => {
        this._cleanupRootListeners()
        if (!this._rootDragging) this.$emit('select', this.node)
        this._rootDragging = false
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
      this._rootCleanup = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
    },

    onRootClick () {
      // 由 onRootMouseDown → onUp 处理
    },

    _cleanupRootListeners () {
      if (typeof this._rootCleanup === 'function') {
        this._rootCleanup()
        this._rootCleanup = null
      }
    },

    onDragStart (e) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('nodeId', String(this.node.id))
      this.isSelfDragging = true
      this.$emit('drag-node', this.node)
    },

    onDragEnd () {
      this.isSelfDragging = false
      this.dropPosition = null
      this.$emit('drag-end')
    },

    onDragOver (e) {
      e.preventDefault()
      e.stopPropagation()

      if (this._dragOverTimer) return
      this._dragOverTimer = setTimeout(() => { this._dragOverTimer = null }, DRAG_THROTTLE_MS)

      const dragId = e.dataTransfer.getData('nodeId')
      if (dragId && dragId === String(this.node.id)) return

      if (!this.canSort) {
        if (this.dropPosition !== DROP_POSITIONS.INSIDE) this.dropPosition = DROP_POSITIONS.INSIDE
        return
      }

      const el = this.$refs.nodeEl
      if (!el) { this.dropPosition = DROP_POSITIONS.INSIDE; return }

      const rect = el.getBoundingClientRect()
      const ratio = (e.clientY - rect.top) / rect.height
      const next = ratio < 0.28
        ? DROP_POSITIONS.BEFORE
        : ratio > 0.72
          ? DROP_POSITIONS.AFTER
          : DROP_POSITIONS.INSIDE

      if (next !== this.dropPosition) this.dropPosition = next
    },

    onDragLeave (e) {
      if (e.relatedTarget && this.$el.contains(e.relatedTarget)) return
      this.dropPosition = null
    },

    onDrop (e) {
      const pos = this.dropPosition
      this.dropPosition = null

      const dragId = e.dataTransfer.getData('nodeId')
      if (!dragId || dragId === String(this.node.id)) return

      if (pos === DROP_POSITIONS.BEFORE || pos === DROP_POSITIONS.AFTER) {
        this.$emit('sort-node', { dragId, targetId: String(this.node.id), position: pos })
      } else {
        this.$emit('drop-node', { dragId, targetId: String(this.node.id) })
      }
    },

    onTouchDragStart () {
      if (this.node.type === NODE_TYPES.ROOT) return
      this.isSelfDragging = true
      this.$emit('drag-node', this.node)
    },

    onTouchDragMove () { /* 由父组件 touchmove 处理 */ },

    onTouchDragEnd (e) {
      this.isSelfDragging = false
      this.dropPosition = null
      this.$emit('drag-end')

      const touch = e.changedTouches?.[0]
      if (!touch) return

      let cur = document.elementFromPoint(touch.clientX, touch.clientY)
      while (cur && cur !== document.body) {
        const targetId = cur.dataset?.id
        if (targetId && targetId !== String(this.node.id)) {
          this.$emit('drop-node', { dragId: String(this.node.id), targetId })
          break
        }
        cur = cur.parentElement
      }
    }
  }
}
</script>

<style scoped>
/* ════════════════════════════════════════════════════════
   TreeNode — 生产级样式（保持原版，未改动）
   ════════════════════════════════════════════════════════ */

.tn-wrap {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  position: relative;
}

.tn-wrap.drag-over-inside>.tn-cat,
.tn-wrap.drag-over-inside>.tn-dev {
  outline: 2px dashed #1890ff;
  outline-offset: 3px;
  background: #e6f4ff !important;
}

.tn-wrap.is-dragging>.tn-cat,
.tn-wrap.is-dragging>.tn-dev,
.tn-wrap.is-dragging>.tn-root {
  opacity: 0.45;
}

.tn-wrap>.tn-cat.insert-before,
.tn-wrap>.tn-dev.insert-before {
  box-shadow: 0 -3px 0 0 #1890ff;
}

.tn-wrap>.tn-cat.insert-after,
.tn-wrap>.tn-dev.insert-after {
  box-shadow: 0 3px 0 0 #1890ff;
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

.root-energy {
  font-size: 10px;
  opacity: .8;
  white-space: nowrap;
  background: rgba(0, 0, 0, .15);
  padding: 1px 8px;
  border-radius: 10px;
}

/* ── 虚拟根 ── */
.tn-virt-root {
  width: 1px;
  height: 1px;
  opacity: 0;
  flex-shrink: 0;
}

/* ── 分类节点 ── */
.tn-cat {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all .18s;
  user-select: none;
  flex-shrink: 0;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .05);
}

.tn-cat:hover {
  background: #fcfdfe;
  border-color: #c0c4cc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .08);
  transform: translateY(-1px);
}

.tn-cat.tn-active {
  background: #f0f9ff;
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, .2);
}

.cat-icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #fffbf0;
  border: 1px solid #faecd8;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e6a23c;
  font-size: 13px;
  flex-shrink: 0;
}

.tn-cat.tn-active .cat-icon-wrap {
  background: #f0f5ff;
  border-color: #409eff;
  color: #409eff;
}

.cat-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cat-name {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tn-cat.tn-active .cat-name {
  color: #409eff;
}

.cat-energy {
  font-size: 10px;
  color: #909399;
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
  min-width: 172px;
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

.tn-dev-dual {
  min-width: 192px;
  flex-direction: column;
  align-items: flex-start;
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

.dev-icon.small {
  width: 24px;
  height: 24px;
  border-radius: 5px;
}

.dev-icon.backup-icon {
  background: #f0f9eb;
  border-color: #e1f3d8;
}

.meter-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, .1));
}

.dev-icon.small .meter-img {
  width: 15px;
  height: 15px;
}

.dev-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dev-name {
  font-size: 12px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 98px;
}

.dev-name.small {
  font-size: 11px;
  max-width: 86px;
}

.dev-serial {
  font-size: 10px;
  color: #909399;
  white-space: nowrap;
}

.dev-power {
  font-size: 10px;
  color: #409eff;
  font-weight: 500;
}

.dual-badge {
  font-size: 10px;
  color: #7a9ab8;
  background: #f4f7fb;
  border: 1px solid #c0d0e0;
  padding: 1px 7px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-weight: 500;
  align-self: flex-start;
  margin-bottom: 4px;
}

.dual-meters {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
}

.dual-meter-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 4px;
  border-bottom: 1px dashed #f0f0f0;
}

.dual-meter-row:last-child {
  padding-bottom: 0;
  border-bottom: none;
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

.h-seg.loss-green {
  background: #67c23a;
}

.h-seg.loss-red {
  background: #f56c6c;
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

.col-btn.loss-red {
  border-color: #f56c6c;
  color: #f56c6c;
}

.col-btn.loss-green {
  border-color: #67c23a;
  color: #67c23a;
}

.loss-tag {
  position: absolute;
  bottom: calc(100% + 7px);
  left: 50%;
  transform: translateX(-50%);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
  background: #fff;
  padding: 3px 10px;
  border-radius: 6px;
  line-height: 1.5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .14);
  border: 1.5px solid;
  opacity: 1;
  min-width: 60px;
  text-align: center;
}

.loss-tag.green {
  color: #52c41a;
  border-color: #b7eb8f;
  background: #f6ffed;
}

.loss-tag.red {
  color: #f5222d;
  border-color: #ffccc7;
  background: #fff1f0;
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

.child-h-seg.loss-green {
  background: #67c23a;
}

.child-h-seg.loss-red {
  background: #f56c6c;
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

/* ── 隐藏节点 ── */
.badge-more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 10px;
  background: #f0f2f5;
  border: 1px dashed #d0d3d9;
  font-size: 11px;
  color: #888;
  cursor: pointer;
  transition: all .15s;
}

.badge-more:hover {
  background: #e6f4ff;
  border-color: #91caff;
  color: #1890ff;
}
</style>
