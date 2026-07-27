<template>
    <div class="no-permission-container">
      <div class="no-permission-content">
        <i class="el-icon-warning-outline" style="font-size: 100px; color: #E6A23C; margin-bottom: 20px;"></i>
        <h2>暂无访问权限</h2>
        <p>您当前账号暂未分配任何菜单权限，请联系管理员处理。</p>
        <el-button type="primary" @click="logout">重新登录</el-button>
      </div>
    </div>
  </template>

<script>
export default {
  name: 'NoPermission',
  methods: {
    async logout () {
      try {
        await this.$store.dispatch('user/logout')
        this.$message.success('已退出登录')
        this.$router.push('/login')
      } catch (error) {
        console.error('退出登录失败:', error)
      }
    }
  }
}
</script>

  <style scoped>
  .no-permission-container {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f7fa;
  }

  .no-permission-content {
    text-align: center;
    padding: 60px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }

  .no-permission-content h2 {
    color: #303133;
    margin-bottom: 16px;
  }

  .no-permission-content p {
    color: #606266;
    margin-bottom: 30px;
    line-height: 1.6;
  }
  </style>
