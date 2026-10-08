<template>
  <footer class="footer-strip">
    <energy-panel title="配电环境监测">
      <div class="footer-metrics footer-metrics--environment-monitor">
        <article
          v-for="item in data.environmentPanel"
          :key="item.label"
          :class="[`tone-${item.tone || 'green'}`]"
        >
          <span class="footer-metric__icon"><energy-icon :name="item.icon" /></span>
          <div class="footer-metric__copy">
            <b>{{ display(item.value) }}<small v-if="item.unit">{{ item.unit }}</small></b>
            <span class="footer-metric__label">{{ item.label }}</span>
            <em v-if="item.status" class="footer-metric__status" :class="`is-${item.statusTone || 'ok'}`">
              <i class="status-dot" /> {{ item.status }}
            </em>
          </div>
        </article>
      </div>
    </energy-panel>

    <energy-panel title="节能减排成果（累计）" class="is-drillable" @click.native="handleDrilldown">
      <div class="footer-metrics footer-metrics--achievement">
        <article v-for="item in data.achievements" :key="item.label" :class="`is-${item.tone}`">
          <span class="footer-metric__icon"><energy-icon :name="item.icon" /></span>
          <div><span>{{ item.label }}</span><b>{{ display(item.value) }}<small>{{ item.unit }}</small></b></div>
        </article>
      </div>
    </energy-panel>

    <energy-panel title="环境气象" class="is-drillable" @click.native="handleDrilldown">
      <div class="footer-metrics footer-metrics--environment">
        <article v-for="item in data.environment" :key="item.label">
          <span class="footer-metric__icon"><energy-icon :name="item.icon" /></span>
          <div><b>{{ display(item.value) }}<small>{{ item.unit }}</small></b><span>{{ item.label }}</span></div>
        </article>
      </div>
    </energy-panel>
  </footer>
</template>

<script>
import EnergyPanel from './EnergyPanel.vue'
import EnergyIcon from './EnergyIcon.vue'

export default {
  name: 'EnergyFooterStrip',
  components: { EnergyPanel, EnergyIcon },
  inject: ['energyScreenDrilldown'],
  props: { data: { type: Object, required: true } },
  methods: {
    display (value) {
      if (value === null || value === undefined || value === '') return '--'
      const number = Number(value)
      if (!Number.isFinite(number)) return String(value || '--')
      return number.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
    },
    handleDrilldown () { this.energyScreenDrilldown('photovoltaic') }
  }
}
</script>
