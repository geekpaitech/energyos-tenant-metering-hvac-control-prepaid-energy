<template>
  <subsystem-iframe-shell
    external-path="/project/airConditioningSubsystem"
    frame-title="水空调"
  />
</template>

<script>
import SubsystemIframeShell from './SubsystemIframeShell.vue'

export default {
  name: 'WaterAcSubsystem',
  components: { SubsystemIframeShell }
}
</script>
