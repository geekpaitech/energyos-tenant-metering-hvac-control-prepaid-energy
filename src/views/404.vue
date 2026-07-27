<template>
    <div class="error-page">
      <div class="error-code">404</div>
      <div class="error-desc">页面不存在</div>
      <div class="error-tip">
        <el-alert
          title="系统更新，请重新登录"
          type="warning"
          :closable="false"
          show-icon
        />
      </div>
      <div class="error-handle">
        <el-button type="primary" :loading="redirecting" @click="relogin">重新登录</el-button>
      </div>
    </div>
  </template>

<script>
export default {
  name: 'Page404',
  data () {
    return {
      redirecting: false,
      redirectTimer: null
    }
  },
  mounted () {
    this.redirectTimer = setTimeout(() => {
      this.relogin()
    }, 1200)
  },
  beforeDestroy () {
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer)
      this.redirectTimer = null
    }
  },
  methods: {
    async relogin () {
      if (this.redirecting) return
      this.redirecting = true

      try {
        this.$message({
          type: 'warning',
          message: '系统更新，请重新登录',
          duration: 2500
        })
      } catch (e) {}

      try {
        await this.$store.dispatch('user/logout')
      } catch (e) {}

      try {
        localStorage.clear()
      } catch (e) {}

      try {
        sessionStorage.clear()
      } catch (e) {}

      try {
        window.location.replace('/login')
      } catch (e) {
        this.$router.replace('/login')
      }
    }
  }
}
</script>

  <style lang="scss" scoped>
  .error-page {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    width: 100%;
    height: 100vh;
    background: #f0f2f5;
  }

  .error-code {
    line-height: 1;
    font-size: 250px;
    font-weight: bolder;
    color: #409EFF;
    margin-bottom: 40px;
  }

  .error-desc {
    font-size: 30px;
    color: #777;
    margin-bottom: 40px;
  }

  .error-tip {
    width: 520px;
    max-width: calc(100vw - 32px);
    margin-bottom: 24px;
  }

  .error-handle {
    font-size: 14px;
  }
  </style>
