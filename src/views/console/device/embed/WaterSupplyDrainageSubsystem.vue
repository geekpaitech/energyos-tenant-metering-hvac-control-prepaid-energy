<template>
  <subsystem-iframe-shell
    external-path="/project/waterSupplyAndDrainageSubsystem"
    frame-title="给排水"
  />
</template>

<script>
import SubsystemIframeShell from './SubsystemIframeShell.vue'

export default {
  name: 'WaterSupplyDrainageSubsystem',
  components: { SubsystemIframeShell }
}
</script>
