<template>
  <div class="switching-container">
    <div class="switching-content">
      <div class="loading-spinner">
        <i class="el-icon-loading"></i>
      </div>
      <div class="loading-text">正在切换平台...</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Switching'
}
</script>

<style lang="scss" scoped>
.switching-container {
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

  .switching-content {
    text-align: center;
    
    .loading-spinner {
      font-size: 32px;
      color: var(--primary-color, #409eff);
      margin-bottom: 16px;
      
      i {
        animation: rotating 2s linear infinite;
      }
    }
    
    .loading-text {
      font-size: 16px;
      color: var(--text-primary, #333);
      font-weight: 500;
    }
  }
}

@keyframes rotating {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>