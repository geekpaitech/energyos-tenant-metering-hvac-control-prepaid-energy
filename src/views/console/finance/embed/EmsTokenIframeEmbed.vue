<template>
  <div class="subsystem-iframe-page">
    <div v-if="loading" class="subsystem-iframe-page__mask">
      <div class="subsystem-iframe-page__mask-inner">
        <i class="el-icon-loading subsystem-iframe-page__spinner" />
        <div class="subsystem-iframe-page__mask-text">
          {{ loadingText }}
        </div>
      </div>
    </div>

    <div v-else-if="errorMsg" class="subsystem-iframe-page__error">
      <el-alert
        type="error"
        :title="errorTitle"
        :description="errorMsg"
        :closable="false"
        show-icon
      >
        <div class="subsystem-iframe-page__error-actions">
          <el-button size="mini" @click="loadPage">重试</el-button>
        </div>
      </el-alert>
    </div>

    <iframe
      v-else-if="iframeSrc"
      :key="'ems-' + $route.fullPath + '-' + iframeSrc"
      class="subsystem-iframe-page__frame"
      :src="iframeSrc"
      :title="pageTitle"
      frameborder="0"
      allowfullscreen
      referrerpolicy="no-referrer-when-downgrade"
    />
  </div>
</template>

<script>
import axios from 'axios'
import { mapGetters } from 'vuex'
import { getEmsProjectIdByManagerId } from '@/config/emsEmbedProject'
import { getUserInfo } from '@/api/user'

const LOGIN_URL = 'https://cp-ems.szcloudpulse.com:86/prod-api/mockLogin'
const EMS_ORIGIN = 'https://cp-ems.szcloudpulse.com:86'
const LOGIN_PAYLOAD = {
  username: 'jipai',
  password: '123456'
}

const TOKEN_CACHE_KEY = 'wyy_ems_mock_token_v1'
const TOKEN_TTL_MS = 25 * 60 * 1000

/** 未配置 meta.emsEmbedPath 时的兜底（与历史能耗概览一致） */
const DEFAULT_EMBED_PATH = 'energy-analysis/energy-overview'

export default {
  name: 'EmsTokenIframeEmbed',
  data () {
    return {
      loading: false,
      errorMsg: '',
      iframeSrc: ''
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    emsProjectId () {
      return getEmsProjectIdByManagerId(this.currentManagerId)
    },
    /** EMS 站点内真实路径段（不含域名、不以 / 开头），每页单独配置，避免共壳导致始终停在概览 */
    embedPath () {
      const p = this.$route.meta && this.$route.meta.emsEmbedPath
      return typeof p === 'string' && p.trim() ? p.trim().replace(/^\//, '') : DEFAULT_EMBED_PATH
    },
    pageTitle () {
      return (this.$route.meta && this.$route.meta.title) || 'EMS'
    },
    loadingText () {
      return `正在获取「${this.pageTitle}」登录信息...`
    },
    errorTitle () {
      return `${this.pageTitle}加载失败`
    }
  },
  watch: {
    '$route.fullPath' () {
      this.loadPage()
    },
    currentManagerId () {
      this.loadPage()
    }
  },
  created () {
    this.loadPage()
  },
  methods: {
    readCachedToken () {
      try {
        const raw = sessionStorage.getItem(TOKEN_CACHE_KEY)
        if (!raw) return null
        const row = JSON.parse(raw)
        if (!row || !row.token || !row.exp) return null
        if (Date.now() > row.exp) return null
        return String(row.token)
      } catch (e) {
        return null
      }
    },
    writeCachedToken (token) {
      try {
        sessionStorage.setItem(
          TOKEN_CACHE_KEY,
          JSON.stringify({ token: String(token), exp: Date.now() + TOKEN_TTL_MS })
        )
      } catch (e) {
        /* 隐私模式等忽略 */
      }
    },
    async fetchToken () {
      const cached = this.readCachedToken()
      if (cached) {
        console.log('[EMS iframe] token 来源: sessionStorage 缓存', { tokenLength: String(cached).length })
        return { token: cached, fromCache: true }
      }

      console.log('[EMS iframe] token 来源: mockLogin POST', LOGIN_URL)
      const { data } = await axios.post(LOGIN_URL, LOGIN_PAYLOAD, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })

      const token = data && data.data && data.data.token
      if (!token) {
        throw new Error((data && data.msg) || '未获取到 token')
      }
      this.writeCachedToken(token)
      console.log('[EMS iframe] mockLogin 成功', { tokenLength: String(token).length, code: data && data.code, msg: data && data.msg })
      return { token: String(token), fromCache: false }
    },
    buildIframeSrc (token) {
      const path = this.embedPath
      const q = new URLSearchParams({ token: String(token) })
      if (this.emsProjectId) {
        q.set('projectId', this.emsProjectId)
      }
      return `${EMS_ORIGIN}/${path}?${q.toString()}`
    },
    logEmsIframeDebug ({ fromCache, iframeSrc }) {
      const masked = iframeSrc.replace(/(token=)[^&]+/i, '$1***已脱敏***')
      const payload = {
        pageTitle: this.pageTitle,
        routeName: this.$route.name,
        routePath: this.$route.path,
        routeFullPath: this.$route.fullPath,
        metaEmsEmbedPath: this.$route.meta && this.$route.meta.emsEmbedPath,
        computedEmbedPath: this.embedPath,
        currentManagerId: this.currentManagerId,
        emsProjectId: this.emsProjectId || null,
        tokenFromCache: fromCache,
        iframeSrcMasked: masked
      }
      console.log('[EMS iframe] 跳转参数（复制本对象给对接方）', payload)
      if (process.env.NODE_ENV === 'development') {
        console.log('[EMS iframe][dev] 完整 iframe URL（勿发到公网）', iframeSrc)
      }
    },
    async loadPage () {
      // 直接调 API 做服务端 token 校验（绕过 store 缓存）。
      // store 的 getUserInfo 在 userInfoLoaded=true 时直接返回缓存，不发请求，
      // 导致 token 已过期也无法被检测到。此处直调 API 确保每次必发请求。
      try {
        await getUserInfo(this.$store.getters.token)
      } catch (e) {
        // 10002 → request.js 拦截器已自动清理+跳登录
        return
      }

      this.loading = true
      this.errorMsg = ''
      this.iframeSrc = ''

      try {
        const { token, fromCache } = await this.fetchToken()
        this.iframeSrc = this.buildIframeSrc(token)
        this.logEmsIframeDebug({ fromCache, iframeSrc: this.iframeSrc })
      } catch (error) {
        this.errorMsg = error && error.message ? error.message : '网络异常，请稍后重试'
        console.error('[EMS iframe] 加载失败', {
          pageTitle: this.pageTitle,
          routePath: this.$route.path,
          message: this.errorMsg
        })
      } finally {
        this.loading = false
      }
    },

  }
}
</script>

<style scoped>
.subsystem-iframe-page {
  width: 100%;
  min-height: calc(100vh - 120px);
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  position: relative;
}

.subsystem-iframe-page__frame {
  flex: 1;
  width: 100%;
  min-height: 0;
  border: 0;
  background: #fff;
}

.subsystem-iframe-page__mask {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.92);
}

.subsystem-iframe-page__mask-inner {
  text-align: center;
  padding: 16px 18px;
  max-width: 420px;
}

.subsystem-iframe-page__spinner {
  font-size: 22px;
  color: #409eff;
}

.subsystem-iframe-page__mask-text {
  margin-top: 10px;
  font-size: 14px;
  color: #303133;
}

.subsystem-iframe-page__error {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  background: rgba(255, 255, 255, 0.92);
}

.subsystem-iframe-page__error-actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}
</style>
