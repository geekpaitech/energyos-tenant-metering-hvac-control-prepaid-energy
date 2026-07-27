<template>
  <div class="sso-callback-container">
    <div class="sso-callback-content">
      <template v-if="status === 'loading'">
        <div class="loading-spinner">
          <i class="el-icon-loading" />
        </div>
        <div class="loading-text">{{ MSG.loading }}</div>
      </template>

      <template v-else-if="status === 'error'">
        <div class="error-icon">
          <i class="el-icon-warning-outline" />
        </div>
        <div class="error-title">{{ MSG.titleFailed }}</div>
        <div class="error-message">{{ errorMessage }}</div>
        <el-button type="primary" size="medium" @click="goLogin">
          {{ MSG.loginBtn }}
        </el-button>
      </template>
    </div>
  </div>
</template>

<script>
import {
  parseSsoCallbackQuery,
  resolveSafeRedirect,
  getCurrentCallbackUri,
  applySsoManagerId,
  SSO_USER_MESSAGES,
  toUserFriendlySsoError
} from '@/utils/sso'

export default {
  name: 'SsoCallback',
  data () {
    return {
      MSG: SSO_USER_MESSAGES,
      status: 'loading',
      errorMessage: ''
    }
  },
  created () {
    this.runSsoCallback()
  },
  methods: {
    async runSsoCallback () {
      const query = this.$route.query || {}
      const parsed = parseSsoCallbackQuery(query)
      const redirect = resolveSafeRedirect(query.redirect)

      if (parsed.error) {
        const raw = parsed.errorDescription || parsed.error
        await this.fail(
          raw ? toUserFriendlySsoError(raw) : SSO_USER_MESSAGES.idpDenied
        )
        return
      }

      if (!parsed.hasCredential) {
        await this.fail(SSO_USER_MESSAGES.noEntry)
        return
      }

      try {
        // 清除可能过期的本地 token，避免换票请求携带旧凭证
        await this.$store.dispatch('user/resetToken')

        await this.$store.dispatch('user/ssoLogin', {
          code: parsed.code,
          ticket: parsed.ticket,
          exchangeToken: parsed.exchangeToken,
          state: parsed.state,
          redirectUri: getCurrentCallbackUri()
        })

        applySsoManagerId(query.managerId)

        this.$message.success(SSO_USER_MESSAGES.success)
        await this.$router.replace({ path: redirect }).catch(() => {})
      } catch (err) {
        await this.fail(toUserFriendlySsoError(err && err.message))
      }
    },
    async fail (message) {
      this.status = 'error'
      this.errorMessage = message
      // 失败态必须清掉残留登录态，否则点「账号密码登录」会被守卫当成已登录而跳进 401
      try {
        await this.$store.dispatch('user/resetToken')
      } catch (e) {}
    },
    async goLogin () {
      try {
        await this.$store.dispatch('user/resetToken')
      } catch (e) {}
      const redirect = resolveSafeRedirect(this.$route.query.redirect)
      const loginQuery =
        redirect && redirect !== '/'
          ? { redirect: encodeURIComponent(redirect) }
          : {}
      this.$router.replace({ path: '/login', query: loginQuery }).catch(() => {})
    }
  }
}
</script>

<style lang="scss" scoped>
.sso-callback-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--main-bg, #f5f5f5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;

  .sso-callback-content {
    text-align: center;
    max-width: 420px;
    padding: 0 24px;
  }

  .loading-spinner {
    font-size: 32px;
    color: var(--primary-color, #409eff);
    margin-bottom: 16px;

    i {
      animation: sso-rotating 2s linear infinite;
    }
  }

  .loading-text {
    font-size: 16px;
    color: var(--text-primary, #333);
    font-weight: 500;
  }

  .error-icon {
    font-size: 48px;
    color: #e6a23c;
    margin-bottom: 16px;
  }

  .error-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary, #333);
    margin-bottom: 8px;
  }

  .error-message {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
    margin-bottom: 24px;
    word-break: break-word;
  }
}

@keyframes sso-rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
