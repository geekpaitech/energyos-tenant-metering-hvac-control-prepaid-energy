<template>
  <header class="energy-header" :style="frameStyle">
    <div class="energy-header__manager-zone">
      <manager-switcher
        class="energy-header__manager"
        :managers="managers"
        :current-manager-id="currentManagerId"
        :group-fallback="groupFallback"
        :loading="loading"
        @change="$emit('manager-change', $event)"
      />
      <business-format-switcher
        v-if="isGroupMode"
        class="energy-header__business"
        :value="business"
        @change="$emit('business-change', $event)"
      />
    </div>
    <div class="energy-header__title-zone">
      <h1>{{ title }}</h1>
    </div>
    <div class="energy-header__meta">
      <period-switcher
        class="energy-header__period"
        :value="period"
        @change="$emit('period-change', $event)"
      />
    </div>
  </header>
</template>

<script>
import ManagerSwitcher from './ManagerSwitcher.vue'
import BusinessFormatSwitcher from './BusinessFormatSwitcher.vue'
import PeriodSwitcher from './PeriodSwitcher.vue'
import { GROUP_FALLBACK } from '../config'

const HEADER_FRAME_URL = 'https://wu-cloud.oss-cn-shanghai.aliyuncs.com/web-file/header-frame.png'

export default {
  name: 'EnergyHeader',
  components: { ManagerSwitcher, BusinessFormatSwitcher, PeriodSwitcher },
  props: {
    title: { type: String, default: '综合能源管理大屏' },
    managers: { type: Array, default: () => [] },
    currentManagerId: { type: [String, Number], default: null },
    business: { type: String, default: 'all' },
    period: { type: String, default: 'day' },
    loading: { type: Boolean, default: false }
  },
  computed: {
    frameStyle () { return { '--energy-header-frame': `url(${HEADER_FRAME_URL})` } },
    isGroupMode () {
      return this.currentManagerId == null || this.currentManagerId === ''
    },
    groupFallback () {
      return GROUP_FALLBACK
    }
  }
}
</script>
