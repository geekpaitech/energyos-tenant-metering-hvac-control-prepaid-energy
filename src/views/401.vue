<template>
    <div class="error-page">
      <div class="error-content">
        <div class="error-icon">
          <i class="el-icon-warning-outline"></i>
        </div>
        <h1 class="error-title">401</h1>
        <p class="error-message">抱歉，您没有访问权限</p>
        <p class="error-description">
          您当前的账户没有分配任何功能权限，请联系管理员为您分配相应的权限。
        </p>
        <div class="error-actions">
          <el-button type="primary" @click="goBack">返回上一页</el-button>
          <el-button @click="goLogin">重新登录</el-button>
          <el-button @click="contactAdmin">联系管理员</el-button>
        </div>
      </div>
    </div>
  </template>

<script>
export default {
  name: 'Page401',
  methods: {
    goBack () {
      this.$router.go(-1)
    },
    goLogin () {
      this.$store.dispatch('user/logout').then(() => {
        this.$router.push('/login')
      })
    },
    contactAdmin () {
      this.$message.info('请联系系统管理员分配权限')
      // 这里可以添加具体的联系方式或者打开客服窗口
    }
  }
}
</script>

  <style lang="scss" scoped>
  .error-page {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .error-content {
    text-align: center;
    padding: 60px 40px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    max-width: 500px;
    margin: 20px;
  }

  .error-icon {
    font-size: 120px;
    color: #ff9800;
    margin-bottom: 20px;
  }

  .error-title {
    font-size: 72px;
    font-weight: bold;
    color: #333;
    margin: 0 0 20px 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .error-message {
    font-size: 24px;
    color: #666;
    margin: 0 0 16px 0;
    font-weight: 500;
  }

  .error-description {
    font-size: 16px;
    color: #999;
    line-height: 1.6;
    margin: 0 0 32px 0;
  }

  .error-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .error-actions .el-button {
    min-width: 120px;
  }

  @media (max-width: 768px) {
    .error-content {
      padding: 40px 20px;
      margin: 10px;
    }

    .error-icon {
      font-size: 80px;
    }

    .error-title {
      font-size: 48px;
    }

    .error-message {
      font-size: 20px;
    }

    .error-actions {
      flex-direction: column;
      align-items: center;
    }

    .error-actions .el-button {
      width: 100%;
      max-width: 200px;
    }
  }
  </style>
