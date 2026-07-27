<template>
  <div class="bigscreen-auto-login">
    <div v-if="!isReady" class="auto-login-content">
      <template v-if="status === 'loading'">
        <div class="loading-row">
          <i class="el-icon-loading loading-icon" />
          <span class="loading-text">正在加载，请稍等</span>
        </div>
      </template>

      <template v-else-if="status === 'error'">
        <div class="error-icon">
          <i class="el-icon-warning-outline" />
        </div>
        <div class="error-title">登录失败</div>
        <div class="error-message">{{ errorMsg }}</div>
        <el-button type="primary" size="medium" @click="retryLogin">
          重试
        </el-button>
      </template>
    </div>

    <group-property-screen v-else ref="groupScreen" />
  </div>
</template>

<script>
import router from '@/router'
import store from '@/store'
import { getAvailablePlatforms, getDefaultPlatform } from '@/utils/routeConfig'
import GroupPropertyScreen from '@/views/group-screen/index.vue'

// 大屏默认登录凭证
const SCREEN_CREDENTIALS = {
  phone: '15100001111',
  password: 'jk12345678'
}

export default {
  name: 'BigscreenAutoLogin',
  components: {
    GroupPropertyScreen
  },
  data () {
    return {
      isReady: false,
      status: 'loading',
      errorMsg: ''
    }
  },
  created () {
    this.autoLogin()
    // 监听token失效事件，自动重登
    window.addEventListener('bigscreen:tokenExpired', this.onTokenExpired)
  },
  beforeDestroy () {
    // 清理事件监听
    window.removeEventListener('bigscreen:tokenExpired', this.onTokenExpired)
  },
  methods: {
    onTokenExpired () {
      console.log('收到token失效事件，自动重新登录')
      this.autoLogin()
    },
    async autoLogin () {
      this.status = 'loading'
      this.isReady = false
      try {
        // 清除可能残留的登录态，确保每次进入都是全新登录
        try {
          await store.dispatch('user/resetToken')
        } catch (e) {
          console.warn('清除残留登录态失败', e)
        }

        // 自动登录
        await store.dispatch('user/login', {
          username: SCREEN_CREDENTIALS.phone,
          password: SCREEN_CREDENTIALS.password
        })

        // 获取用户信息
        const userInfo = await store.dispatch('user/getUserInfo')
        const role = userInfo.role

        // 确定平台
        const availablePlatforms = getAvailablePlatforms(role)
        const savedPlatform = localStorage.getItem('selectedPlatform')
        const platform = (savedPlatform && availablePlatforms.includes(savedPlatform))
          ? savedPlatform
          : getDefaultPlatform(role)

        // 生成路由
        const accessRoutes = await store.dispatch('permission/generateRoutes', {
          role,
          platform
        })

        if (accessRoutes && accessRoutes.length > 0) {
          router.addRoutes(accessRoutes)
        }

        // 加载企业/项目列表（大屏路由不走Layout，需要手动初始化manager）
        await store.dispatch('manager/getManagerList')

        // 显示大屏，保持路由不变
        this.isReady = true
      } catch (err) {
        console.error('大屏自动登录失败:', err)
        this.status = 'error'
        this.errorMsg = err.message || '登录失败，请检查网络连接后重试'
      }
    },
    retryLogin () {
      this.errorMsg = ''
      this.autoLogin()
    }
  }
}
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

.error-icon {
  font-size: 48px;
  color: #f56c6c;
  margin-bottom: 18px;
}

.error-title {
  font-size: 18px;
  font-weight: 600;
  color: #f56c6c;
  margin-bottom: 10px;
}

.error-message {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.6;
  margin-bottom: 24px;
  word-break: break-word;
}

@keyframes rotating {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
