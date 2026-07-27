<template>
  <header class="energy-header" :style="frameStyle">
    <manager-switcher
      class="energy-header__manager"
      :managers="managers"
      :current-manager-id="currentManagerId"
      :loading="loading"
      @change="$emit('manager-change', $event)"
    />
    <div class="energy-header__title-zone">
      <h1>{{ title }}</h1>
    </div>
    <div class="energy-header__meta">
      <div class="energy-header__clock">
        <time>{{ clockTime }}</time>
        <span>{{ clockDate }}</span>
      </div>
      <div class="energy-header__weather" aria-label="天气信息">
        <energy-icon name="cloud" />
        <span>{{ weather.text }}</span>
        <span>{{ weather.temperature }}</span>
      </div>
    </div>
  </header>
</template>

<script>
import EnergyIcon from './EnergyIcon.vue'
import ManagerSwitcher from './ManagerSwitcher.vue'

const HEADER_FRAME_URL = 'https://oss.example.com/web-file/header-frame.png'

export default {
  name: 'EnergyHeader',
  components: { EnergyIcon, ManagerSwitcher },
  props: {
    title: { type: String, default: '综合能源管理大屏' },
    weather: {
      type: Object,
      default: () => ({ text: '阴-多云', temperature: '29℃~35℃' })
    },
    managers: { type: Array, default: () => [] },
    currentManagerId: { type: [String, Number], default: null },
    loading: { type: Boolean, default: false }
  },
  data () {
    return { clockTime: '', clockDate: '', timer: null }
  },
  computed: {
    frameStyle () { return { '--energy-header-frame': `url(${HEADER_FRAME_URL})` } }
  },
  mounted () {
    this.tick()
    this.timer = setInterval(this.tick, 1000)
  },
  beforeDestroy () {
    clearInterval(this.timer)
  },
  methods: {
    tick () {
      const now = new Date()
      const pad = value => String(value).padStart(2, '0')
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      this.clockTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
      this.clockDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${weekdays[now.getDay()]}`
    }
  }
}
</script>
