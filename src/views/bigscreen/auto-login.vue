<template>
  <div class="bigscreen-auto-login">
    <group-property-screen v-if="isReady" ref="groupScreen" />

    <div
      v-if="!isReady || isRecovering"
      class="auto-login-content"
      :class="{ 'is-recovering': isReady }"
    >
      <div class="loading-row">
        <i class="el-icon-loading loading-icon" />
        <span class="loading-text">{{ recoveryText }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import router from '@/router'
import store from '@/store'
import Cookies from 'js-cookie'
import { getAvailablePlatforms, getDefaultPlatform } from '@/utils/routeConfig'
import GroupPropertyScreen from '@/views/group-screen/index.vue'

// 大屏默认登录凭证
const SCREEN_CREDENTIALS = {
  phone: '15100001111',
  password: 'jk12345678'
}

// 与能耗大屏错峰，两个标签页同时首次打开时优先复用对方刚建立的会话
const QUICK_RETRY_DELAYS = [150, 550, 1200, 2400]
const BACKGROUND_RETRY_DELAY = 3500
const AUTH_REQUEST_TIMEOUT = 5000

export default {
  name: 'BigscreenAutoLogin',
  components: {
    GroupPropertyScreen
  },
  data () {
    return {
      isReady: false,
      isRecovering: false,
      recoveryText: '正在加载，请稍等'
    }
  },
  created () {
    this.authPromise = null
    this.recoveryTimer = null
    this.focusTimer = null
    this.destroyed = false

    window.addEventListener('bigscreen:tokenExpired', this.onTokenExpired)
    window.addEventListener('focus', this.onWindowFocus)
    document.addEventListener('visibilitychange', this.onVisibilityChange)

    this.ensureSession({ reason: 'initial' })
  },
  beforeDestroy () {
    this.destroyed = true
    clearTimeout(this.recoveryTimer)
    clearTimeout(this.focusTimer)
    window.removeEventListener('bigscreen:tokenExpired', this.onTokenExpired)
    window.removeEventListener('focus', this.onWindowFocus)
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
  },
  methods: {
    onTokenExpired () {
      console.log('[property-screen] 收到token失效事件，开始静默恢复')
      this.ensureSession({ forceLogin: true, reason: 'token-expired' })
    },
    onWindowFocus () {
      if (document.visibilityState === 'hidden') return
      this.scheduleSessionCheck()
    },
    onVisibilityChange () {
      if (document.visibilityState === 'visible') {
        this.scheduleSessionCheck()
      } else {
        clearTimeout(this.recoveryTimer)
      }
    },
    scheduleSessionCheck () {
      clearTimeout(this.focusTimer)
      this.focusTimer = setTimeout(() => {
        this.ensureSession({ reason: 'focus' })
      }, 120)
    },
    ensureSession (options = {}) {
      if (this.destroyed) return Promise.resolve(false)
      if (this.authPromise) return this.authPromise

      this.authPromise = this.runSessionRecovery(options)
        .catch((error) => {
          console.error('[property-screen] 静默恢复异常:', error)
          this.beginRecoveryUi()
          this.scheduleBackgroundRecovery()
          return false
        })
        .finally(() => {
          this.authPromise = null
        })

      return this.authPromise
    },
    async runSessionRecovery ({ forceLogin = false, reason = 'unknown' } = {}) {
      clearTimeout(this.recoveryTimer)
      const screenWasReady = this.isReady

      // 优先复用两个大屏标签页共享的最新 Cookie 会话
      if (!forceLogin && (Cookies.get('Admin-Token') || store.getters.token)) {
        const reused = await this.tryReuseSharedSession(false)
        if (reused) return true
        console.warn(`[property-screen] ${reason} 会话校验失败，转入静默登录`)
      }

      this.beginRecoveryUi()
      await this.clearExpiredSession()

      let lastError = null
      for (let index = 0; index < QUICK_RETRY_DELAYS.length; index += 1) {
        if (this.destroyed) return false
        if (document.visibilityState === 'hidden') {
          console.log('[property-screen] 页面已进入后台，暂停账号恢复')
          return false
        }

        const delay = QUICK_RETRY_DELAYS[index]
        if (delay > 0) await this.wait(delay)

        if (await this.tryReuseSharedSession(screenWasReady)) return true

        try {
          await store.dispatch('user/login', {
            username: SCREEN_CREDENTIALS.phone,
            password: SCREEN_CREDENTIALS.password,
            silent: true,
            timeout: AUTH_REQUEST_TIMEOUT
          })

          const userInfo = await store.dispatch('user/getUserInfo', {
            force: true,
            silent: true,
            timeout: AUTH_REQUEST_TIMEOUT
          })
          await this.initializeSession(userInfo)
          this.finishRecovery(screenWasReady)
          return true
        } catch (error) {
          lastError = error
          console.warn(`[property-screen] 静默登录第 ${index + 1} 次未成功`, error)
          if (await this.tryReuseSharedSession(screenWasReady)) return true
          await this.clearExpiredSession()
        }
      }

      console.error('[property-screen] 快速恢复未成功，将继续后台重试', lastError)
      this.scheduleBackgroundRecovery()
      return false
    },
    beginRecoveryUi () {
      this.isRecovering = this.isReady
      this.recoveryText = this.isReady ? '正在恢复连接，请稍等' : '正在加载，请稍等'
    },
    async clearExpiredSession () {
      try {
        await store.dispatch('user/resetToken')
      } catch (error) {
        console.warn('[property-screen] 清理失效登录态失败', error)
      }
    },
    async tryReuseSharedSession (reloadScreen) {
      if (!Cookies.get('Admin-Token')) return false
      try {
        const userInfo = await store.dispatch('user/getUserInfo', {
          force: true,
          silent: true,
          timeout: AUTH_REQUEST_TIMEOUT
        })
        await this.initializeSession(userInfo)
        this.finishRecovery(reloadScreen)
        return true
      } catch (error) {
        return false
      }
    },
    async initializeSession (userInfo) {
      const role = userInfo && userInfo.role
      if (!role) throw new Error('演示账号用户信息不完整')

      if (!store.getters['permission/routesInitialized']) {
        const availablePlatforms = getAvailablePlatforms(role)
        const savedPlatform = localStorage.getItem('selectedPlatform')
        const platform = (savedPlatform && availablePlatforms.includes(savedPlatform))
          ? savedPlatform
          : getDefaultPlatform(role)
        const accessRoutes = await store.dispatch('permission/generateRoutes', { role, platform })
        if (accessRoutes && accessRoutes.length > 0) router.addRoutes(accessRoutes)
      }

      if (!store.getters['manager/managerList'] || store.getters['manager/managerList'].length === 0) {
        await store.dispatch('manager/getManagerList')
      }
    },
    finishRecovery (reloadScreen) {
      clearTimeout(this.recoveryTimer)
      this.isReady = true
      this.isRecovering = false
      this.recoveryText = '正在加载，请稍等'
      window.dispatchEvent(new CustomEvent('bigscreen:authRecovered'))

      if (reloadScreen) {
        this.$nextTick(() => {
          const screen = this.$refs.groupScreen
          if (screen && typeof screen.fetchScreenData === 'function') screen.fetchScreenData()
        })
      }
    },
    scheduleBackgroundRecovery () {
      clearTimeout(this.recoveryTimer)
      if (this.destroyed || document.visibilityState === 'hidden') return
      this.recoveryTimer = setTimeout(() => {
        this.ensureSession({ forceLogin: true, reason: 'background-retry' })
      }, BACKGROUND_RETRY_DELAY)
    },
    wait (delay) {
      return new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

/*
 * 物管与能耗大屏保持相同认证策略：
 * 当前可见标签页负责恢复，后台标签页不主动争抢演示账号。
 */
</script>

<style lang="scss" scoped>
.bigscreen-auto-login {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #0a0e27;
  z-index: 9999;
}

.auto-login-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 24px;
  z-index: 10000;
  background: #0a0e27;
  transition: background-color 0.2s ease;
}

.auto-login-content.is-recovering {
  background: rgba(3, 12, 31, 0.78);
  backdrop-filter: blur(2px);
}

.loading-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-icon {
  color: #409eff;
  font-size: 20px;
  animation: rotating 2s linear infinite;
}

.loading-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
}

@keyframes rotating {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
