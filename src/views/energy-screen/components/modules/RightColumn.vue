<template>
  <section class="energy-column energy-column--right" :class="{ 'is-without-return': !showInvestmentReturn }">
    <photovoltaic-return-card
      v-if="showInvestmentReturn"
      :model="investmentReturn"
      :drillable="investmentReturnDrillable"
    />
    <photovoltaic-card :data="powerSafety" />
    <device-status-card :data="alarm" />
  </section>
</template>

<script>
import PhotovoltaicReturnCard from '../cards/PhotovoltaicReturnCard.vue'
import PhotovoltaicCard from '../cards/PhotovoltaicCard.vue'
import DeviceStatusCard from '../cards/DeviceStatusCard.vue'

export default {
  name: 'EnergyRightColumn',
  components: { PhotovoltaicReturnCard, PhotovoltaicCard, DeviceStatusCard },
  props: {
    investmentReturn: { type: Object, required: true },
    investmentReturnDrillable: { type: Boolean, default: false },
    showInvestmentReturn: { type: Boolean, default: true },
    powerSafety: { type: Object, required: true },
    alarm: { type: Object, required: true }
  }
}
</script>
