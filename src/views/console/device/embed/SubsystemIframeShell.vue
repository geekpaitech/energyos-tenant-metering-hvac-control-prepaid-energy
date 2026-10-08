<template>
  <div class="subsystem-iframe-page">
    <div v-if="!desiredSrc" class="subsystem-iframe-page__empty">
      <el-empty description="缺少登录信息，无法加载子系统页面" :image-size="80" />
    </div>
    <template v-else>
      <div v-if="loading" class="subsystem-iframe-page__mask">
        <div class="subsystem-iframe-page__mask-inner">
          <i class="el-icon-loading subsystem-iframe-page__spinner" />
          <div class="subsystem-iframe-page__mask-text">
            正在加载{{ frameTitle }}...
          </div>
          <div v-if="showPatientHint" class="subsystem-iframe-page__mask-sub subsystem-iframe-page__mask-sub--b2b">
            <p class="subsystem-iframe-page__mask-sub-line">
              首次进入或版本更新后，子系统资源加载可能较慢。
            </p>
            <p class="subsystem-iframe-page__mask-sub-line subsystem-iframe-page__mask-sub-line--muted">
              请保持当前页面，耐心等待加载完成。
            </p>
          </div>
          <div v-if="showRefreshButton" class="subsystem-iframe-page__mask-refresh">
            <p class="subsystem-iframe-page__mask-sub-line subsystem-iframe-page__mask-sub-line--muted">
              若长时间无响应，可尝试刷新后重新载入。
            </p>
            <div class="subsystem-iframe-page__mask-actions">
              <el-button
                size="small"
                type="primary"
                class="subsystem-iframe-page__refresh-btn"
                @click="reloadIframe"
              >刷新</el-button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="loadError" class="subsystem-iframe-page__error">
        <el-alert
          type="error"
          :title="`${frameTitle} 加载失败`"
          :closable="false"
          show-icon
        >
          <div class="subsystem-iframe-page__error-actions">
            <el-button size="mini" @click="reloadIframe">重试</el-button>
          </div>
        </el-alert>
      </div>

      <iframe
        v-if="effectiveSrc"
        :key="effectiveSrc"
        ref="subsystemFrame"
        class="subsystem-iframe-page__frame"
        :src="effectiveSrc"
        :title="frameTitle"
        frameborder="0"
        allowfullscreen
        referrerpolicy="no-referrer-when-downgrade"
        @load="handleLoad"
        @error="handleError"
      />
    </template>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { FMCS_ROOT, PARKING_OAUTH_URL } from '@/config/services'
import Cookies from 'js-cookie'
import { logAppNavigate, maskTokenInUrl } from '@/utils/appNavigateLog'
import { getUserInfo } from '@/api/user'

const FMCS_BASE = FMCS_ROOT
/** 超过此时长后展示「请耐心等待」类 B 端说明（不出现刷新） */
const PATIENT_HINT_MS = 15000
/** 满此时长后才展示「刷新」操作，避免首屏即引导用户打断加载 */
const REFRESH_BUTTON_AFTER_MS = 60 * 1000
const SRC_DEBOUNCE_MS = 250
const TOKEN_KEY = 'Admin-Token'

export default {
  name: 'SubsystemIframeShell',
  props: {
    externalPath: {
      type: String,
      default: ''
    },
    externalTarget: {
      type: String,
      default: 'fmcs'
    },
    platformName: {
      type: String,
      default: '极派信息科技'
    },
    frameTitle: {
      type: String,
      default: '子系统'
    },
    /** 停车系统：parkId 取管理方 parkingLotId，而非 managerId */
    useParkingLotId: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      effectiveSrc: '',
      loading: false,
      showPatientHint: false,
      showRefreshButton: false,
      loadError: false,
      /** 服务端 token 有效性校验是否已完成（用于 desiredSrc 延迟计算） */
      tokenCheckCompleted: false,
      srcDebounceTimer: null,
      patientHintTimer: null,
      refreshButtonTimer: null,
      ai2parkNonce: Date.now(),
      // 仅针对 ai2park：首个 load 后自动重试一次，模拟“手动刷新就好了”的兜底
      ai2parkAutoRetried: false
    }
  },
  computed: {
    ...mapGetters(['token', 'currentManagerId', 'managerList', 'userInfoLoaded']),
    isAi2parkTarget () {
      return this.externalTarget === 'ai2park'
    },
    resolvedToken () {
      return this.token || Cookies.get(TOKEN_KEY) || ''
    },
    resolvedManagerId () {
      // ai2park 对 parkId 更敏感：必须等管理方模块真正初始化后再拼接 URL，避免首屏读到陈旧 localStorage
      if (this.isAi2parkTarget) {
        return this.currentManagerId || ''
      }
      return this.currentManagerId || localStorage.getItem('selectedManagerId') || ''
    },
    managerReady () {
      if (!this.currentManagerId) return false
      const list = Array.isArray(this.managerList) ? this.managerList : []
      if (list.length === 0) return false
      return list.some((item) => String(item.managerId) === String(this.currentManagerId))
    },
    currentManager () {
      const list = Array.isArray(this.managerList) ? this.managerList : []
      if (!this.currentManagerId) return null
      return list.find((item) => String(item.managerId) === String(this.currentManagerId)) || null
    },
    ai2parkParkId () {
      if (!this.isAi2parkTarget) return ''
      if (this.useParkingLotId) {
        const manager = this.currentManager
        if (!manager) return ''
        const lotId = manager.parkingLotId
        if (lotId != null && String(lotId).trim() !== '') {
          return String(lotId).trim()
        }
        // 未配置 parkingLotId 时回退到 managerId
        return String(this.currentManagerId || '')
      }
      return String(this.currentManagerId || '')
    },
    desiredSrc () {
      // 首次登录初始化阶段，等待用户信息加载完成，避免第三方 URL 在未就绪状态下提前生成
      if (!this.userInfoLoaded) return ''
      if (!this.resolvedToken) return ''

      // 直接调 API 做服务端 token 校验（绕过 store 缓存）。
      // store 的 getUserInfo 在 userInfoLoaded=true 时直接返回缓存，不发请求，
      // 导致 token 已过期也无法被检测到。此处直调 API 确保每次必发请求。
      // 校验未完成时返回空串，完成后 tokenCheckCompleted → true 触发 desiredSrc 重新计算。
      if (!this.tokenCheckCompleted) {
        getUserInfo(this.resolvedToken).then(() => {
          this.tokenCheckCompleted = true
        }).catch(() => {
          // 10002 → request.js 拦截器已自动清理+跳登录
        })
        return ''
      }

      if (this.isAi2parkTarget) {
        if (!this.managerReady || !this.ai2parkParkId) return ''
        const q = new URLSearchParams({
          token: String(this.resolvedToken),
          platformName: String(this.platformName),
          parkId: String(this.ai2parkParkId),
          _r: String(this.ai2parkNonce)
        })
        return `${PARKING_OAUTH_URL}?${q.toString()}`
      }

      if (!this.resolvedManagerId) return ''

      const path = (this.externalPath || '').trim()
      if (!path) return ''
      const q = new URLSearchParams({
        token: String(this.resolvedToken),
        projectId: String(this.resolvedManagerId)
      })
      return `${FMCS_BASE}${path}?${q.toString()}`
    }
  },
  watch: {
    desiredSrc: {
      handler (next) {
        this.scheduleSrcUpdate(next)
      },
      immediate: true
    }
  },
  beforeDestroy () {
    this.clearTimers()
  },
  activated () {
    // keep-alive 场景下重新进入页面时，强制同步一次目标地址，降低首次登录竞态概率
    if (this.externalTarget === 'ai2park') {
      this.ai2parkNonce = Date.now()
    }
    this.scheduleSrcUpdate(this.desiredSrc)
  },
  methods: {
    clearTimers () {
      if (this.srcDebounceTimer) {
        clearTimeout(this.srcDebounceTimer)
        this.srcDebounceTimer = null
      }
      if (this.patientHintTimer) {
        clearTimeout(this.patientHintTimer)
        this.patientHintTimer = null
      }
      if (this.refreshButtonTimer) {
        clearTimeout(this.refreshButtonTimer)
        this.refreshButtonTimer = null
      }
    },
    startLoadProgressHints () {
      this.showPatientHint = false
      this.showRefreshButton = false
      if (this.patientHintTimer) clearTimeout(this.patientHintTimer)
      if (this.refreshButtonTimer) clearTimeout(this.refreshButtonTimer)

      this.patientHintTimer = setTimeout(() => {
        this.showPatientHint = true
      }, PATIENT_HINT_MS)

      this.refreshButtonTimer = setTimeout(() => {
        this.showRefreshButton = true
      }, REFRESH_BUTTON_AFTER_MS)
    },
    setLoadingState () {
      this.loadError = false
      this.loading = true
      this.startLoadProgressHints()
    },
    scheduleSrcUpdate (nextSrc) {
      this.clearTimers()

      // 避免切换管理方时多处逻辑导致的短时间多次 src 变更：做一次去重/合并
      this.srcDebounceTimer = setTimeout(() => {
        const normalized = String(nextSrc || '').trim()
        if (!normalized) {
          this.effectiveSrc = ''
          this.loading = false
          this.showPatientHint = false
          this.showRefreshButton = false
          this.loadError = false
          return
        }
        if (normalized === this.effectiveSrc) return
        this.setLoadingState()
        this.effectiveSrc = normalized
        if (this.externalPath === '/project/waterSupplyAndDrainageSubsystem') {
          console.log('[给排水子系统] iframe 完整地址:', normalized)
          console.log('[给排水子系统] 地址组成:', {
            base: FMCS_BASE,
            path: this.externalPath,
            projectId: this.resolvedManagerId,
            tokenPreview: this.resolvedToken
              ? `${String(this.resolvedToken).slice(0, 8)}...`
              : '(空)'
          })
        }
        if (this.isAi2parkTarget) {
          console.log('[停车系统] iframe 完整地址:', normalized)
          console.log('[停车系统] 地址组成:', {
            base: PARKING_OAUTH_URL,
            parkId: this.ai2parkParkId,
            managerId: this.currentManagerId,
            parkingLotId: this.currentManager && this.currentManager.parkingLotId,
            platformName: this.platformName,
            tokenPreview: this.resolvedToken
              ? `${String(this.resolvedToken).slice(0, 8)}...`
              : '(空)',
            appHref: typeof window !== 'undefined' ? window.location.href : ''
          })
        }
        this.attachIframeLoadFallback()
        logAppNavigate('subsystem-iframe', {
          frameTitle: this.frameTitle,
          externalPath: this.externalPath,
          externalTarget: this.externalTarget,
          iframeSrcMasked: maskTokenInUrl(normalized),
          appHref: typeof window !== 'undefined' ? window.location.href : ''
        })
      }, SRC_DEBOUNCE_MS)
    },
    /** 避免 iframe 先以空 src 触发 load，再改 URL 时部分环境不再触发 load，导致遮罩永不消失 */
    attachIframeLoadFallback () {
      this.$nextTick(() => {
        const el = this.$refs.subsystemFrame
        if (!el || !this.loading) return
        const onLoad = () => {
          if (this.loading) this.handleLoad()
        }
        el.addEventListener('load', onLoad, { once: true })
      })
    },
    reloadIframe () {
      if (!this.desiredSrc) return
      this.setLoadingState()
      if (this.externalTarget === 'ai2park') {
        this.ai2parkNonce = Date.now()
        // 重试时允许重新触发一次 load 逻辑，但不重置 autoRetried，避免循环
        this.scheduleSrcUpdate(this.desiredSrc)
        return
      }
      // 强制重建 iframe：在 src 后增加一次性时间戳，避免外部系统缓存导致仍显示旧内容
      const sep = this.desiredSrc.includes('?') ? '&' : '?'
      this.effectiveSrc = `${this.desiredSrc}${sep}_r=${Date.now()}`
      this.attachIframeLoadFallback()
      logAppNavigate('subsystem-iframe-reload', {
        frameTitle: this.frameTitle,
        externalPath: this.externalPath,
        externalTarget: this.externalTarget,
        iframeSrcMasked: maskTokenInUrl(this.effectiveSrc),
        appHref: typeof window !== 'undefined' ? window.location.href : ''
      })
    },
    handleLoad () {
      this.loading = false
      this.loadError = false
      this.showPatientHint = false
      this.showRefreshButton = false
      if (this.patientHintTimer) {
        clearTimeout(this.patientHintTimer)
        this.patientHintTimer = null
      }
      if (this.refreshButtonTimer) {
        clearTimeout(this.refreshButtonTimer)
        this.refreshButtonTimer = null
      }

      // ai2park 偶发首次 oauth 未生效：iframe load 完后自动重试一次（仅一次/会话）
      if (this.isAi2parkTarget && !this.ai2parkAutoRetried) {
        this.ai2parkAutoRetried = true
        setTimeout(() => {
          // 如果用户已手动切换/离开导致 src 变化，这里也只会按当前 desiredSrc 重新生成一次
          this.reloadIframe()
        }, 800)
      }
    },
    handleError () {
      this.loading = false
      this.loadError = true
      this.showPatientHint = false
      this.showRefreshButton = false
      if (this.patientHintTimer) {
        clearTimeout(this.patientHintTimer)
        this.patientHintTimer = null
      }
      if (this.refreshButtonTimer) {
        clearTimeout(this.refreshButtonTimer)
        this.refreshButtonTimer = null
      }
    }
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

.subsystem-iframe-page__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
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

.subsystem-iframe-page__mask-sub {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
}

.subsystem-iframe-page__mask-sub--b2b {
  margin-top: 14px;
  padding: 12px 14px;
  text-align: left;
  background: #f4f6f9;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  color: #303133;
}

.subsystem-iframe-page__mask-sub-line {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  font-weight: 500;
}

.subsystem-iframe-page__mask-sub-line + .subsystem-iframe-page__mask-sub-line {
  margin-top: 6px;
}

.subsystem-iframe-page__mask-sub-line--muted {
  font-size: 12px;
  font-weight: 400;
  color: #606266;
}

.subsystem-iframe-page__mask-refresh {
  margin-top: 16px;
  padding-top: 4px;
}

.subsystem-iframe-page__mask-actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

/* 遮罩上主按钮：白字实心，避免 plain 主色字在浅底上发灰 */
.subsystem-iframe-page__refresh-btn {
  color: #fff !important;
  background-color: #409eff !important;
  border-color: #409eff !important;
}

.subsystem-iframe-page__refresh-btn:hover,
.subsystem-iframe-page__refresh-btn:focus {
  color: #fff !important;
  background-color: #66b1ff !important;
  border-color: #66b1ff !important;
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
