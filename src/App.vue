<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  height: 100%;
}


/* Webkit内核浏览器 (Chrome, Safari, Edge) */
::-webkit-scrollbar {
  width: 6px;  /* 垂直滚动条宽度 */
  height: 6px; /* 水平滚动条高度 */
}

/* 滚动条轨道 */
::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 3px;
}

/* 滚动条滑块 */
::-webkit-scrollbar-thumb {
  background: #d1d9e6;
  border-radius: 3px;
  transition: background 0.2s ease;
}

/* 滚动条滑块悬停状态 */
::-webkit-scrollbar-thumb:hover {
  background: #4285f4;
}

/* 滚动条滑块激活状态 */
::-webkit-scrollbar-thumb:active {
  background: #3367d6;
}

/* 滚动条角落 */
::-webkit-scrollbar-corner {
  background: #f8f9fa;
}

/* Firefox浏览器滚动条样式 */
* {
  scrollbar-width: thin;
  scrollbar-color: #d1d9e6 #f8f9fa;
}

/* 针对你的蓝色主题优化 */
.blue-theme ::-webkit-scrollbar-thumb {
  background: #c5d2e8;
}

.blue-theme ::-webkit-scrollbar-thumb:hover {
  background: #4285f4;
}

/* 表格内滚动条样式 */
.el-table ::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.el-table ::-webkit-scrollbar-thumb {
  background: #e1e8f0;
  border-radius: 2px;
}

.el-table ::-webkit-scrollbar-thumb:hover {
  background: #4285f4;
}

/* 侧边栏滚动条样式 */
.sidebar ::-webkit-scrollbar {
  width: 3px;
}

.sidebar ::-webkit-scrollbar-thumb {
  background: rgba(65, 133, 244, 0.3);
}

/* 响应式设计 - 移动端隐藏滚动条 */
@media (max-width: 768px) {
  ::-webkit-scrollbar {
    width: 0px;
    background: transparent;
  }
}

</style>
