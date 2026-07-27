<template>
  <section class="energy-column energy-column--right">
    <arrears-card :data="arrears" />
    <photovoltaic-card :data="photovoltaic" />
    <device-status-card :data="deviceStatus" />
  </section>
</template>

<script>
import ArrearsCard from '../cards/ArrearsCard.vue'
import PhotovoltaicCard from '../cards/PhotovoltaicCard.vue'
import DeviceStatusCard from '../cards/DeviceStatusCard.vue'

export default {
  name: 'EnergyRightColumn',
  components: { ArrearsCard, PhotovoltaicCard, DeviceStatusCard },
  props: {
    arrears: { type: Array, required: true },
    photovoltaic: { type: Object, required: true },
    deviceStatus: { type: Array, required: true }
  }
}
</script>
