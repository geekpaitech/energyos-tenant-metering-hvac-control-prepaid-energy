<template>
  <subsystem-iframe-shell
    external-target="ai2park"
    use-parking-lot-id
    platform-name="极派信息科技"
    frame-title="停车系统"
  />
</template>

<script>
import SubsystemIframeShell from './SubsystemIframeShell.vue'

const FIRST_REFRESH_FLAG = 'parkingSubsystem:first-enter-refreshed'
const FALLBACK_WINDOW_FLAG = '__parkingSubsystemFirstEnterRefreshed__'

export default {
  name: 'ParkingSubsystem',
  components: { SubsystemIframeShell },
  beforeRouteEnter (to, from, next) {
    next((vm) => vm.triggerFirstEnterRefresh())
  },
  activated () {
    // keep-alive 场景下首次进入也要兜底一次
    this.triggerFirstEnterRefresh()
  },
  methods: {
    triggerFirstEnterRefresh () {
      // 仅针对停车系统：首次进入时自动刷新一次（每个会话一次）
      try {
        if (window && window[FALLBACK_WINDOW_FLAG]) return
        const existed = sessionStorage.getItem(FIRST_REFRESH_FLAG)
        if (existed) return

        sessionStorage.setItem(FIRST_REFRESH_FLAG, '1')
        window[FALLBACK_WINDOW_FLAG] = true

        // 放到下一帧，避免导航过程中 reload 被吞
        this.$nextTick(() => {
          setTimeout(() => {
            window.location.reload()
          }, 50)
        })
      } catch (e) {
        // sessionStorage 不可用时用 window 变量兜底（同样只刷新一次）
        if (window && !window[FALLBACK_WINDOW_FLAG]) {
          window[FALLBACK_WINDOW_FLAG] = true
          setTimeout(() => window.location.reload(), 50)
        }
      }
    }
  }
}
</script>
