<template>
  <aside class="region-edit-panel">
    <div class="panel-head">
      <h3>区域管理</h3>
      <span class="panel-floor">{{ floorLabel }}</span>
    </div>

    <div class="panel-scroll">
      <div class="panel-guide">
        <div class="guide-line" :class="{ done: zones.length > 0 }">
          <span class="guide-dot">1</span>
          <span>拖拽框选区域</span>
        </div>
        <div class="guide-line" :class="{ done: !!selectedZone }">
          <span class="guide-dot">2</span>
          <span>点击区域 → 右侧改名称</span>
        </div>
        <div class="guide-line">
          <span class="guide-dot">3</span>
          <span>需要拆分时点下方按钮</span>
        </div>
      </div>

      <div v-if="selectedZone" class="panel-section panel-selected">
        <div class="section-title">当前选中区域</div>
        <el-input
          ref="renameInput"
          :value="selectedZone.label"
          size="small"
          placeholder="输入区域名称"
          @input="$emit('rename', $event)"
          @focus="$emit('rename-focus')"
        />

        <div class="status-block">
          <div class="section-title">资源状态</div>
          <el-radio-group
            class="status-radio-group"
            :value="currentRentStatus"
            @input="$emit('status-change', $event)"
          >
            <el-radio
              v-for="opt in statusOptions"
              :key="opt.value"
              :label="opt.value"
              class="status-radio"
            >
              <span class="status-dot" :style="{ background: opt.color }" />
              {{ opt.label }}
            </el-radio>
          </el-radio-group>
        </div>

        <div class="split-block">
          <span class="split-title">拆分为多个独立区域</span>
          <div class="split-group">
            <span class="split-group-label">竖向</span>
            <div class="split-grid split-grid--3">
              <el-button size="mini" @click="$emit('split', 2, 'vertical')">2 份</el-button>
              <el-button size="mini" @click="$emit('split', 3, 'vertical')">3 份</el-button>
              <el-button size="mini" @click="$emit('split', 4, 'vertical')">4 份</el-button>
            </div>
          </div>
          <div class="split-group">
            <span class="split-group-label">横向</span>
            <div class="split-grid split-grid--2">
              <el-button size="mini" @click="$emit('split', 2, 'horizontal')">2 份</el-button>
              <el-button size="mini" @click="$emit('split', 3, 'horizontal')">3 份</el-button>
            </div>
          </div>
        </div>

        <div class="zone-meta">覆盖照明设备 {{ lightCount }} 台</div>
        <el-button type="danger" size="small" plain class="panel-del" @click="$emit('delete')">删除此区域</el-button>
      </div>

      <div v-else class="panel-section panel-hint">
        <div class="hint-icon"><i class="el-icon-crop" /></div>
        <p>在地图上拖拽框选，或点击下方列表选中已有区域</p>
        <el-button type="primary" icon="el-icon-plus" @click="$emit('start-draw')">开始框选</el-button>
      </div>

      <div class="panel-section panel-list">
        <div class="section-title">本层全部区域（{{ zones.length }}）</div>
        <div class="status-legend">
          <span v-for="opt in statusOptions" :key="opt.value" class="legend-item">
            <i class="legend-dot" :style="{ background: opt.color }" />{{ opt.label }}
          </span>
        </div>
        <div v-if="!zones.length" class="panel-empty">暂无区域</div>
        <div
          v-for="z in zones"
          :key="z.id"
          class="zone-list-item"
          :class="{ active: selectedZoneId === z.id }"
          @click="$emit('select', z.id)"
        >
          <span class="zone-list-name">{{ z.label || '未命名' }}</span>
          <span
            class="zone-list-status"
            :style="statusTagStyle(z.rentStatus)"
          >{{ statusLabel(z.rentStatus) }}</span>
        </div>
      </div>
    </div>

    <div class="panel-foot">
      <el-button type="primary" @click="$emit('save')">保存</el-button>
      <el-button @click="$emit('exit')">完成并退出</el-button>
      <el-button v-if="zones.length" type="text" class="clear-btn" @click="$emit('clear-all')">清空本层</el-button>
    </div>
  </aside>
</template>

<script>
import { ZONE_STATUS_OPTIONS, getZoneStatusOption, normalizeZoneRentStatus } from './region-zone-status'

export default {
  name: 'RegionEditPanel',
  props: {
    floorLabel: String,
    zones: { type: Array, default: () => [] },
    selectedZoneId: String,
    selectedZone: { type: Object, default: null },
    editTool: String,
    lightCount: { type: Number, default: 0 }
  },
  data () {
    return { statusOptions: ZONE_STATUS_OPTIONS }
  },
  computed: {
    currentRentStatus () {
      if (!this.selectedZone) return 'VACANT'
      return normalizeZoneRentStatus(this.selectedZone.rentStatus)
    }
  },
  methods: {
    statusLabel (status) {
      return getZoneStatusOption(status).label
    },
    statusTagStyle (status) {
      const opt = getZoneStatusOption(status)
      return {
        color: opt.color,
        background: opt.bg,
        border: `1px solid ${opt.border}`
      }
    },
    focusRename () {
      const input = this.$refs.renameInput
      if (!input) return
      const el = input.$el ? input.$el.querySelector('input') : input
      if (el) {
        el.focus()
        el.select()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.region-edit-panel {
  width: 280px;
  flex-shrink: 0;
  height: 100%;
  min-height: 0;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-head {
  flex-shrink: 0;
  padding: 16px 16px 8px;
  h3 {
    margin: 0 0 4px;
    font-size: 15px;
    font-weight: 700;
    color: #1a1a2e;
  }
  .panel-floor {
    font-size: 12px;
    color: #0170fe;
    font-weight: 600;
  }
}

.panel-scroll {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 3px;
  }
}

.panel-guide {
  padding: 4px 16px 12px;
  .guide-line {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 12px;
    color: #909399;
    line-height: 1.5;
    padding: 3px 0;
    &.done { color: #303133; }
  }
  .guide-dot {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #f0f2f5;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
  }
  .guide-line.done .guide-dot {
    background: #0170fe;
    color: #fff;
  }
}

.panel-section {
  padding: 12px 16px;
  border-top: 1px solid #f0f2f5;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 8px;
}

.status-block {
  margin-top: 12px;
}

.status-radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.status-radio {
  margin-right: 0;
  line-height: 1.5;

  ::v-deep .el-radio__label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding-left: 6px;
    color: #303133;
    font-size: 13px;
  }
}

.status-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #ebeef5;

  .legend-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: #909399;
  }

  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    font-style: normal;
  }
}

.zone-list-status {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
}

.panel-hint {
  text-align: center;
  .hint-icon {
    font-size: 32px;
    color: #0170fe;
    margin-bottom: 8px;
  }
  p {
    margin: 0 0 12px;
    font-size: 13px;
    color: #606266;
    line-height: 1.6;
  }
}

.split-block {
  margin-top: 12px;

  .split-title {
    display: block;
    font-size: 11px;
    color: #909399;
    margin-bottom: 10px;
    line-height: 1.5;
  }
}

.split-group {
  margin-bottom: 10px;

  &:last-child {
    margin-bottom: 0;
  }

  .split-group-label {
    display: block;
    font-size: 11px;
    color: #606266;
    font-weight: 600;
    margin-bottom: 6px;
  }
}

.split-grid {
  display: grid;
  gap: 8px;

  &--2 {
    grid-template-columns: repeat(2, 1fr);
  }

  &--3 {
    grid-template-columns: repeat(3, 1fr);
  }

  ::v-deep .el-button--mini {
    width: 100%;
    margin: 0;
    padding: 7px 4px;
    color: #303133;
    border-color: #dcdfe6;
    background: #fff;

    &:hover {
      color: #0170fe;
      border-color: #0170fe;
      background: rgba(1, 112, 254, 0.06);
    }
  }
}

.zone-meta {
  margin-top: 14px;
  margin-bottom: 4px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.panel-del {
  margin-top: 10px;
  width: 100%;
}

.panel-empty {
  font-size: 12px;
  color: #c0c4cc;
  padding: 4px 0;
}

.zone-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #303133;
  margin-bottom: 4px;

  &:last-child {
    margin-bottom: 8px;
  }

  &:hover {
    background: #f5f7fa;
  }

  &.active {
    background: rgba(1, 112, 254, 0.08);
    font-weight: 600;
    .zone-list-name { color: #0170fe; }
  }
}

.zone-list-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-foot {
  flex-shrink: 0;
  padding: 12px 16px 16px;
  border-top: 1px solid #f0f2f5;
  background: #fff;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .clear-btn {
    width: 100%;
    color: #909399;
    margin: 0;
  }
}
</style>
