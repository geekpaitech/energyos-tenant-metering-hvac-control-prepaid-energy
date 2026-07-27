<template>
  <div class="external-jump-page">
    跳转入口
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { logAppNavigate, maskTokenInUrl } from '@/utils/appNavigateLog'

export default {
  name: 'ExternalJump',
  computed: {
    ...mapGetters(['token', 'currentManagerId', 'visitedViews']),
    title () {
      return (this.$route && this.$route.meta && this.$route.meta.title) || '跳转中...'
    },
    externalPath () {
      return (this.$route && this.$route.meta && this.$route.meta.externalPath) || ''
    },
    externalTarget () {
      return (this.$route && this.$route.meta && this.$route.meta.externalTarget) || 'fmcs'
    },
    platformName () {
      return (this.$route && this.$route.meta && this.$route.meta.platformName) || '极派信息科技'
    },
    returnPath () {
      return (this.$route && this.$route.meta && this.$route.meta.returnPath) || '/device/electricity'
    }
  },
  mounted () {
    this.$nextTick(() => {
      setTimeout(() => {
        this.handleJump()
      }, 0)
    })
  },
  methods: {
    buildJumpUrl () {
      if (this.externalTarget === 'ai2park') {
        const q = new URLSearchParams({
          token: String(this.token),
          platformName: String(this.platformName),
          parkId: String(this.currentManagerId)
        })
        return `https://www.ai2park.cn/#/oauth?${q.toString()}`
      }

      if (!this.externalPath) return ''
      const q = new URLSearchParams({
        token: String(this.token),
        projectId: String(this.currentManagerId)
      })
      return `https://jp.brcon.com.cn${this.externalPath}?${q.toString()}`
    },
    handleJump () {
      if (this.externalTarget !== 'ai2park' && !this.externalPath) {
        this.$message.warning('缺少跳转路径')
        this.closeSelf()
        return
      }
      if (!this.token || !this.currentManagerId) {
        this.$message.warning('Missing token or project ID')
        this.closeSelf()
        return
      }
      const url = this.buildJumpUrl()
      if (!url) {
        this.$message.warning('跳转链接生成失败')
        this.closeSelf()
        return
      }
      logAppNavigate('external-window-open', {
        routePath: this.$route.path,
        routeName: this.$route.name,
        externalPath: this.externalPath,
        externalTarget: this.externalTarget,
        openUrlMasked: maskTokenInUrl(url),
        appHref: typeof window !== 'undefined' ? window.location.href : ''
      })
      window.open(url, '_blank')
      this.closeSelf()
    },
    closeSelf () {
      const list = Array.isArray(this.visitedViews) ? this.visitedViews : []
      const lastDevice = [...list].reverse().find(v => v && v.path && v.path !== this.$route.path && String(v.path).startsWith('/device'))

      this.$store.dispatch('tagsView/delView', this.$route).finally(() => {
        if (lastDevice) {
          this.$router.replace(lastDevice.fullPath || lastDevice.path)
          return
        }
        this.$router.replace(this.returnPath)
      })
    }
  }
}
</script>
