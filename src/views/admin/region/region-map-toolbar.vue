<template>
  <div class="region-map-toolbar" @mousedown.stop @click.stop>
    <button
      type="button"
      class="tb-btn"
      :class="{ active: editTool === 'draw' }"
      @click="$emit('tool', 'draw')"
    >
      <i class="el-icon-crop" />
      框选区域
    </button>
    <button
      type="button"
      class="tb-btn"
      :class="{ active: editTool === 'select' }"
      @click="$emit('tool', 'select')"
    >
      <i class="el-icon-rank" />
      移动调整
    </button>
  </div>
</template>

<script>
export default {
  name: 'RegionMapToolbar',
  props: {
    editTool: String
  }
}
</script>

<style lang="scss" scoped>
.region-map-toolbar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 130;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}

.tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;

  i {
    font-size: 15px;
    color: inherit;
  }

  &:hover {
    background: #f5f7fa;
    color: #0170fe;
  }

  &.active {
    background: #0170fe;
    color: #fff;

    i {
      color: #fff;
    }
  }
}
</style>
