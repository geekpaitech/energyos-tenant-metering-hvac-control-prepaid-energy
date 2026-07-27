<template>
  <subsystem-iframe-shell
    external-path="/project/senSorSystem"
    frame-title="环境监测"
  />
</template>

<script>
import SubsystemIframeShell from './SubsystemIframeShell.vue'

export default {
  name: 'EnvMonitorSubsystem',
  components: { SubsystemIframeShell }
}
</script>
