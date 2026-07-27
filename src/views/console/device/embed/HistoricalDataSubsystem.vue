<template>
  <subsystem-iframe-shell
    external-path="/device/historicalData"
    frame-title="历史数据"
  />
</template>

<script>
import SubsystemIframeShell from './SubsystemIframeShell.vue'

export default {
  name: 'HistoricalDataSubsystem',
  components: { SubsystemIframeShell }
}
</script>
