<template>
  <subsystem-iframe-shell
    external-path="/device/lightingControl"
    frame-title="照明"
  />
</template>

<script>
import SubsystemIframeShell from './SubsystemIframeShell.vue'

export default {
  name: 'LightingSubsystem',
  components: { SubsystemIframeShell }
}
</script>
