<template>
  <energy-panel title="租户欠费排行 TOP5">
    <template #meta><span class="panel-meta">欠费总额（元）</span></template>
    <ol class="arrears-list">
      <li v-for="(item, index) in data" :key="item.id || item.name">
        <span class="arrears-list__rank" :class="`rank-${index + 1}`">{{ index + 1 }}</span>
        <span class="arrears-list__name">{{ item.name }}</span>
        <b>-¥{{ money(item.amount) }}</b>
      </li>
      <li v-if="!data.length" class="arrears-list__empty">暂无欠费数据</li>
    </ol>
  </energy-panel>
</template>

<script>
import EnergyPanel from '../EnergyPanel.vue'

export default {
  name: 'EnergyArrearsCard',
  components: { EnergyPanel },
  props: { data: { type: Array, required: true } },
  methods: {
    money (value) {
      if (value === null || value === undefined || value === '') return '--'
      const number = Number(value)
      return Number.isFinite(number) ? number.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'
    }
  }
}
</script>
