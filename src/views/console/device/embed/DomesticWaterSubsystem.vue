<template>
  <subsystem-iframe-shell
    external-path="/device/domesticWater"
    frame-title="生活水"
  />
</template>

<script>
import SubsystemIframeShell from './SubsystemIframeShell.vue'

export default {
  name: 'DomesticWaterSubsystem',
  components: { SubsystemIframeShell }
}
</script>
