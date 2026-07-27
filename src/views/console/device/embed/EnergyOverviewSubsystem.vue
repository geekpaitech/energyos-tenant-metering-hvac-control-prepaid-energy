<template>
  <div class="subsystem-iframe-page">
    <div v-if="loading" class="subsystem-iframe-page__mask">
      <div class="subsystem-iframe-page__mask-inner">
        <i class="el-icon-loading subsystem-iframe-page__spinner" />
        <div class="subsystem-iframe-page__mask-text">
          正在获取能耗概览登录信息...
        </div>
      </div>
    </div>

    <div v-else-if="errorMsg" class="subsystem-iframe-page__error">
      <el-alert
        type="error"
        title="能耗概览加载失败"
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
      class="subsystem-iframe-page__frame"
      :src="iframeSrc"
      title="能耗概览"
      frameborder="0"
      allowfullscreen
      referrerpolicy="no-referrer-when-downgrade"
    />
  </div>
</template>

<script>
import axios from 'axios'

const LOGIN_URL = 'https://cp-ems.szcloudpulse.com:86/prod-api/mockLogin'
const OVERVIEW_URL = 'https://cp-ems.szcloudpulse.com:86/energy-analysis/energy-overview'
const LOGIN_PAYLOAD = {
  username: 'jipai',
  password: '123456'
}

export default {
  name: 'EnergyOverviewSubsystem',
  data () {
    return {
      loading: false,
      errorMsg: '',
      iframeSrc: ''
    }
  },
  created () {
    this.loadPage()
  },
  methods: {
    async loadPage () {
      this.loading = true
      this.errorMsg = ''
      this.iframeSrc = ''

      try {
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

        const q = new URLSearchParams({
          token: String(token)
        })
        this.iframeSrc = `${OVERVIEW_URL}?${q.toString()}`
        console.log('[EnergyOverviewSubsystem] iframe url:', this.iframeSrc)
      } catch (error) {
        this.errorMsg = error && error.message ? error.message : '网络异常，请稍后重试'
      } finally {
        this.loading = false
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
