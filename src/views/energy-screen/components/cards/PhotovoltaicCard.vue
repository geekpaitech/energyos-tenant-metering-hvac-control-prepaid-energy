<template>
  <energy-panel title="配电安全态势" class="power-safety-panel">
    <div class="power-safety-grid">
      <article
        v-for="item in items"
        :key="item.key"
        class="power-safety-cell"
        :class="`tone-${item.tone || 'green'}`"
      >
        <span class="power-safety-cell__icon"><energy-icon :name="item.icon" /></span>
        <div class="power-safety-cell__body">
          <span class="power-safety-cell__label">{{ item.label }}</span>
          <div class="power-safety-cell__value-row">
            <b class="power-safety-cell__value">{{ display(item.value) }}<small v-if="item.unit">{{ item.unit }}</small></b>
            <em class="power-safety-cell__status" :class="`is-${item.statusTone || 'ok'}`">
              <i class="status-dot" /> {{ item.status || '正常' }}
            </em>
          </div>
        </div>
      </article>
    </div>
  </energy-panel>
</template>

<script>
import EnergyPanel from '../EnergyPanel.vue'
import EnergyIcon from '../EnergyIcon.vue'

/**
 * 配电安全态势（2×2 紧凑状态矩阵）
 * 单元布局：左 icon → 右上 label → 右下 value+unit + status
 *
 * Props:
 *  - data: { cells: [{ key, label, value, unit, icon, tone, status, statusTone }] }
 */
export default {
  name: 'EnergyPowerSafetyCard',
  components: { EnergyPanel, EnergyIcon },
  props: { data: { type: Object, required: true } },
  computed: {
    items () {
      return Array.isArray(this.data && this.data.cells) ? this.data.cells : []
    }
  },
  methods: {
    display (value) {
      if (value === null || value === undefined || value === '') return '--'
      const number = Number(value)
      return Number.isFinite(number)
        ? number.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
        : '--'
    }
  }
}
</script>
