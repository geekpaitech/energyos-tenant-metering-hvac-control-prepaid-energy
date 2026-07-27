<template>
  <energy-panel title="运行状态">
    <div class="device-status-list">
      <article v-for="item in data" :key="item.label" :class="`is-${item.tone}`">
        <energy-icon :name="item.icon" />
        <div><span>{{ item.label }}</span><b>{{ display(item.value) }}<small>{{ item.unit }}</small></b></div>
      </article>
    </div>
  </energy-panel>
</template>

<script>
import EnergyPanel from '../EnergyPanel.vue'
import EnergyIcon from '../EnergyIcon.vue'

export default {
  name: 'EnergyDeviceStatusCard',
  components: { EnergyPanel, EnergyIcon },
  props: { data: { type: Array, required: true } },
  methods: {
    display (value) {
      if (value === null || value === undefined || value === '') return '--'
      const number = Number(value)
      return Number.isFinite(number) ? number.toLocaleString('zh-CN') : '--'
    }
  }
}
</script>
