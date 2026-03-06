<template>
    <div class="redirect-container">
      <div class="loading-wrapper">
        <div class="loading-spinner"></div>
        <p>页面跳转中...</p>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'Redirect',
    created() {
      console.log('=== Redirect页面 ===');
      console.log('当前路由参数:', this.$route.params);
      console.log('当前路由查询:', this.$route.query);
      
      const { params, query } = this.$route;
      const { path } = params;
      
      // 构建目标路径
      const targetPath = '/' + (path || '').split('/').filter(Boolean).join('/');
      console.log('目标跳转路径:', targetPath);
      
      // 使用nextTick确保在下一个事件循环中执行跳转
      this.$nextTick(() => {
        // 跳转到目标路径，保持查询参数
        this.$router.replace({ 
          path: targetPath, 
          query: query 
        }).then(() => {
          console.log('Redirect跳转成功:', targetPath);
        }).catch(err => {
          console.error('Redirect跳转失败:', err);
          // 如果跳转失败，尝试跳转到首页
          this.$router.replace('/metering/dashboard');
        });
      });
    },
    render: function(h) {
      return h(); // 避免警告信息
    }
  }
  </script>
  
  <style scoped>
  .redirect-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background: var(--main-bg, #f5f5f5);
  }
  
  .loading-wrapper {
    text-align: center;
    color: var(--text-primary, #333);
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    margin: 0 auto 16px;
    border: 3px solid var(--border-color, #e1e1e1);
    border-top: 3px solid var(--primary-color, #409eff);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  </style>