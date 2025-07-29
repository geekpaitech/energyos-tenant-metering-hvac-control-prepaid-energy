<template>
    <div class="admin-dashboard">
      <div class="dashboard-header">
        <h1>管理后台大屏</h1>
        <p>欢迎来到管理后台数据监控中心</p>
      </div>
      
      <div class="dashboard-content">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-card admin-card">
              <div class="stat-number">8,888</div>
              <div class="stat-label">总订单数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card admin-card">
              <div class="stat-number">¥123,456</div>
              <div class="stat-label">今日收入</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card admin-card">
              <div class="stat-number">2,345</div>
              <div class="stat-label">用户总数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card admin-card">
              <div class="stat-number">98.5%</div>
              <div class="stat-label">系统可用性</div>
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="8">
            <el-card>
              <div slot="header">
                <span>财务概览</span>
              </div>
              <div>
                <p>本月收入: ¥456,789</p>
                <p>本月支出: ¥123,456</p>
                <p>净利润: ¥333,333</p>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card>
              <div slot="header">
                <span>业务数据</span>
              </div>
              <div>
                <p>新增订单: 156 单</p>
                <p>完成订单: 142 单</p>
                <p>订单完成率: 91.0%</p>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card>
              <div slot="header">
                <span>系统监控</span>
              </div>
              <div>
                <p>CPU使用率: 45%</p>
                <p>内存使用率: 62%</p>
                <p>磁盘使用率: 38%</p>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'AdminDashboard',
    data() {
      return {}
    },
    created() {
      console.log('管理后台大屏页面加载')
    }
  }
  </script>
  
  <style lang="scss" scoped>
  .admin-dashboard {
    padding: 20px;
    
    .dashboard-header {
      text-align: center;
      margin-bottom: 30px;
      
      h1 {
        color: #e6a23c;
        margin-bottom: 10px;
      }
      
      p {
        color: #666;
        font-size: 14px;
      }
    }
    
    .admin-card {
      background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
      color: #333;
      
      .stat-number {
        font-size: 32px;
        font-weight: bold;
        margin-bottom: 5px;
        color: #e6a23c;
      }
      
      .stat-label {
        font-size: 14px;
        color: #666;
      }
    }
    
    .stat-card {
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
  }
  </style>