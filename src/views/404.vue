<template>
    <div class="error-page">
      <div class="error-code">404</div>
      <div class="error-desc">页面不存在</div>
      <div class="error-handle">
        <el-button type="primary" @click="back">返回首页</el-button>
      </div>
    </div>
  </template>

<script>
export default {
  name: 'Page404',
  methods: {
    back () {
      this.$router.push({ path: '/metering/dashboard' })
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

  .error-handle {
    font-size: 14px;
  }
  </style>
