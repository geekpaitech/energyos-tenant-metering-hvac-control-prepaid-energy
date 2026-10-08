<template>
  <energy-panel title="配电运维告警" class="alarm-panel">
    <div class="alarm-table">
      <header class="alarm-table__head">
        <span class="alarm-col--time">告警时间</span>
        <span class="alarm-col--content">告警内容</span>
        <span class="alarm-col--level">级别</span>
        <span class="alarm-col--status">处理状态</span>
      </header>
      <ul class="alarm-table__list">
        <li
          v-for="(row, index) in items.list"
          :key="row.id || `${row.time}-${index}`"
          class="alarm-table__row"
        >
          <span class="alarm-col--time">{{ row.time }}</span>
          <span class="alarm-col--content" :title="row.content">{{ row.content }}</span>
          <span
            class="alarm-col--level"
            :class="levelClass(row.level)"
          >
            <i v-if="row.level" class="level-dot" /> {{ row.level || '--' }}
          </span>
          <span
            class="alarm-col--status"
            :class="statusClass(row.status)"
          >{{ row.status || '--' }}</span>
        </li>
        <li v-if="!items.list.length" class="alarm-table__empty">
          <span style="grid-column: 1 / -1; text-align: center;">暂无告警</span>
        </li>
      </ul>
    </div>
  </energy-panel>
</template>

<script>
import EnergyPanel from '../EnergyPanel.vue'

/**
 * 配电运维告警
 * Props:
 *  - data: { list: [{ id, time, content, level, status }] }
 *
 * level: 预警 / 一般 / 严重 / 已恢复
 * status: 未处理 / 已处理
 */
export default {
  name: 'EnergyAlarmCard',
  components: { EnergyPanel },
  props: { data: { type: Object, required: true } },
  computed: {
    items () {
      const source = this.data || {}
      return {
        list: Array.isArray(source.list) ? source.list : []
      }
    }
  },
  methods: {
    levelClass (level) {
      const mapping = {
        '预警': 'is-warning',
        '严重': 'is-emerg',
        '已恢复': 'is-recover',
        '一般': 'is-normal'
      }
      return mapping[level] || 'is-normal'
    },
    statusClass (status) {
      const mapping = {
        '未处理': 'is-pre',
        '已处理': 'is-done'
      }
      return mapping[status] || 'is-pre'
    }
  }
}
</script>
