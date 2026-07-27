<template>
  <div class="ai-report-page">
    <div style="margin-top: 15px;"></div>
    <ai-mode></ai-mode>
  </div>
</template>

<script>
import AiMode from '@/views/console/dashboard/components/AIMode.vue'

export default {
  name: 'AIReportPage',
  components: {
    AiMode
  }
}
</script>

<style lang="scss" scoped>
.ai-report-page {
  min-height: calc(100vh - 84px);
  padding: 12px 16px 20px;
  box-sizing: border-box;
  background: #F5F7FB;
}
</style>
