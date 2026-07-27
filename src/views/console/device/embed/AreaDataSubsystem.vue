<template>
  <subsystem-iframe-shell
    external-path="/desk/areaData"
    frame-title="面积切分"
  />
</template>

<script>
import SubsystemIframeShell from './SubsystemIframeShell.vue'

export default {
  name: 'AreaDataSubsystem',
  components: { SubsystemIframeShell }
}
</script>
