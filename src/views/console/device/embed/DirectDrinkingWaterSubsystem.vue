<template>
  <subsystem-iframe-shell
    external-path="/device/directDrinkingWaterSystem"
    frame-title="直饮水"
  />
</template>

<script>
import SubsystemIframeShell from './SubsystemIframeShell.vue'

export default {
  name: 'DirectDrinkingWaterSubsystem',
  components: { SubsystemIframeShell }
}
</script>
