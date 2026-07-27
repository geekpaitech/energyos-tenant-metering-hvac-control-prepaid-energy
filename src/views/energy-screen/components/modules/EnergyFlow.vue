<template>
  <energy-panel title="园区能源流向图" variant="flow">
    <div class="flow-stage">
      <svg class="flow-stage__lines" viewBox="0 0 800 550" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <filter id="energyFlowGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path id="gridToCampus" class="flow-path flow-path--blue" d="M170 132 V168 Q170 180 184 180 H335 Q350 180 350 195 V213" />
        <path id="pvToCampus" class="flow-path flow-path--gold" d="M630 132 V168 Q630 180 616 180 H465 Q450 180 450 195 V213" />
        <path id="campusToAir" class="flow-path flow-path--blue" d="M400 300 V340 Q400 352 384 352 H132 Q118 352 118 366 V392" />
        <path id="campusToTenant" class="flow-path flow-path--blue" d="M400 300 V392" />
        <path id="campusToPublic" class="flow-path flow-path--blue" d="M400 300 V340 Q400 352 416 352 H668 Q682 352 682 366 V392" />

        <g class="flow-arrow flow-arrow--blue">
          <path d="M-8-7 10 0-8 7-4 0Z" />
          <animateMotion dur="2.1s" repeatCount="indefinite" rotate="auto"><mpath href="#gridToCampus" xlink:href="#gridToCampus" /></animateMotion>
        </g>
        <g class="flow-arrow flow-arrow--gold">
          <path d="M-8-7 10 0-8 7-4 0Z" />
          <animateMotion dur="1.9s" repeatCount="indefinite" rotate="auto"><mpath href="#pvToCampus" xlink:href="#pvToCampus" /></animateMotion>
        </g>
        <g v-for="path in destinationPaths" :key="path.id" class="flow-arrow flow-arrow--blue">
          <path d="M-8-7 10 0-8 7-4 0Z" />
          <animateMotion :dur="path.duration" repeatCount="indefinite" rotate="auto"><mpath :href="`#${path.id}`" :xlink:href="`#${path.id}`" /></animateMotion>
        </g>
      </svg>

      <span class="flow-center-tail" aria-hidden="true" />
      <span class="flow-branch-tail flow-branch-tail--left" aria-hidden="true" />
      <span class="flow-branch-tail flow-branch-tail--right" aria-hidden="true" />

      <article class="flow-source flow-source--grid">
        <span class="flow-source__icon"><energy-icon :name="data.grid.icon" /></span>
        <div><h3>{{ data.grid.title }}</h3><p>今日购电 <b>{{ number(data.grid.energy, 1) }} kWh</b></p><p>今日费用 <b>¥{{ number(data.grid.cost, 2) }}</b></p></div>
      </article>

      <article class="flow-source flow-source--pv">
        <span class="flow-source__icon"><energy-icon :name="data.photovoltaic.icon" /></span>
        <div><h3>{{ data.photovoltaic.title }}</h3><p>今日发电 <b>{{ number(data.photovoltaic.energy, 1) }} kWh</b></p><p>当前功率 <b>{{ number(data.photovoltaic.power, 2) }} kW</b></p></div>
      </article>

      <div class="flow-campus">
        <img class="flow-campus__image" :src="campusAsset" alt="园区配电中心" />
        <strong>{{ data.center.title }}</strong>
      </div>

      <span class="flow-side-value flow-side-value--left">今日购电 <b>{{ number(data.center.purchased, 1) }} kWh</b></span>
      <span class="flow-side-value flow-side-value--right">今日发电 <b>{{ number(data.center.generated, 1) }} kWh</b></span>

      <div class="flow-destinations">
        <article v-for="item in data.destinations" :key="item.key" class="flow-destination" :class="`is-${item.tone}`">
          <header><energy-icon :name="item.icon" /><h3>{{ item.title }}</h3></header>
          <p>今日用电 <b>{{ number(item.usage, 2) }} kWh</b></p>
          <p>占比 <b>{{ item.percent }}%</b></p>
          <span class="flow-progress"><i :style="{ width: item.usage == null ? '0%' : `${Math.max(item.percent, 4)}%` }" /></span>
        </article>
      </div>

      <footer class="flow-summary">
        <span>今日总负荷 <b>{{ number(data.totalLoad, 2) }} kWh</b></span>
        <i />
        <span>实时总功率 <b>{{ number(data.realtimePower, 2) }} kW</b></span>
      </footer>
    </div>
  </energy-panel>
</template>

<script>
import EnergyPanel from '../EnergyPanel.vue'
import EnergyIcon from '../EnergyIcon.vue'
import campusAsset from '../../energy.png'

export default {
  name: 'EnergyFlow',
  components: { EnergyPanel, EnergyIcon },
  props: { data: { type: Object, required: true } },
  data () {
    return {
      campusAsset,
      destinationPaths: [
        { id: 'campusToAir', duration: '2.2s' },
        { id: 'campusToTenant', duration: '1.8s' },
        { id: 'campusToPublic', duration: '2.4s' }
      ]
    }
  },
  methods: {
    number (value, digits) {
      if (value === null || value === undefined || value === '') return '--'
      const number = Number(value)
      if (!Number.isFinite(number)) return '--'
      return number.toLocaleString('zh-CN', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      })
    }
  }
}
</script>
