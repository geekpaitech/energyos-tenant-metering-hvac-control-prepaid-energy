<template>
    <div class="admin-test">
      <div class="page-header">
        <h2>管理后台测试</h2>
        <p>这是管理后台的测试功能页面</p>
      </div>
      
      <el-card>
        <div slot="header">
          <span>管理后台测试工具</span>
          <el-button style="float: right; padding: 3px 0" type="text" @click="clearLog">清空日志</el-button>
        </div>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form label-width="120px">
              <el-form-item label="测试模块:">
                <el-select v-model="testModule" placeholder="请选择测试模块">
                  <el-option label="用户管理" value="user"></el-option>
                  <el-option label="订单系统" value="order"></el-option>
                  <el-option label="财务模块" value="finance"></el-option>
                  <el-option label="权限系统" value="permission"></el-option>
                </el-select>
              </el-form-item>
              
              <el-form-item label="测试环境:">
                <el-radio-group v-model="testEnv">
                  <el-radio label="dev">开发环境</el-radio>
                  <el-radio label="test">测试环境</el-radio>
                  <el-radio label="prod">生产环境</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <el-form-item label="测试数据量:">
                <el-input-number v-model="dataCount" :min="1" :max="10000"></el-input-number>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="runAdminTest">执行测试</el-button>
                <el-button type="warning" @click="generateReport">生成报告</el-button>
                <el-button @click="resetForm">重置</el-button>
              </el-form-item>
            </el-form>
          </el-col>
          
          <el-col :span="12">
            <div class="test-log">
              <h4>测试日志:</h4>
              <div class="log-content">
                <div v-for="(log, index) in testLogs" :key="index" class="log-item">
                  <span class="log-time">{{ log.time }}</span>
                  <span class="log-message">{{ log.message }}</span>
                </div>
                <div v-if="testLogs.length === 0" class="no-log">暂无测试日志</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </template>
  
  <script>
  export default {
    name: 'AdminTest',
    data() {
      return {
        testModule: '',
        testEnv: 'test',
        dataCount: 100,
        testLogs: []
      }
    },
    methods: {
      runAdminTest() {
        if (!this.testModule) {
          this.$message.warning('请选择测试模块')
          return
        }
        
        this.addLog(`开始测试${this.getModuleName()}模块`)
        this.addLog(`测试环境: ${this.getEnvName()}`)
        this.addLog(`测试数据量: ${this.dataCount}`)
        
        // 模拟测试执行过程
        let step = 0
        const steps = [
          '初始化测试环境...',
          '加载测试数据...',
          '执行功能测试...',
          '执行性能测试...',
          '生成测试报告...',
          '测试完成 ✓'
        ]
        
        const executeStep = () => {
          if (step < steps.length) {
            this.addLog(steps[step])
            step++
            setTimeout(executeStep, 1000)
          }
        }
        
        executeStep()
      },
      
      generateReport() {
        this.addLog('正在生成测试报告...')
        setTimeout(() => {
          this.addLog('测试报告生成完成，可在报告中心查看')
          this.$message.success('报告生成成功')
        }, 2000)
      },
      
      resetForm() {
        this.testModule = ''
        this.testEnv = 'test'
        this.dataCount = 100
      },
      
      clearLog() {
        this.testLogs = []
      },
      
      addLog(message) {
        const now = new Date()
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
        this.testLogs.push({
          time,
          message
        })
        
        // 自动滚动到底部
        this.$nextTick(() => {
          const logContent = this.$el.querySelector('.log-content')
          if (logContent) {
            logContent.scrollTop = logContent.scrollHeight
          }
        })
      },
      
      getModuleName() {
        const moduleMap = {
          'user': '用户管理',
          'order': '订单系统',
          'finance': '财务模块',
          'permission': '权限系统'
        }
        return moduleMap[this.testModule] || '未知'
      },
      
      getEnvName() {
        const envMap = {
          'dev': '开发环境',
          'test': '测试环境',
          'prod': '生产环境'
        }
        return envMap[this.testEnv] || '未知'
      }
    },
    created() {
      console.log('管理后台测试页面加载')
      this.addLog('管理后台测试工具已就绪')
    }
  }
  </script>
  
  <style lang="scss" scoped>
  .admin-test {
    padding: 20px;
    
    .page-header {
      margin-bottom: 20px;
      
      h2 {
        color: #e6a23c;
        margin-bottom: 8px;
      }
      
      p {
        color: #666;
        font-size: 14px;
      }
    }
    
    .test-log {
      .log-content {
        background: #2d3748;
        color: #e2e8f0;
        padding: 15px;
        border-radius: 4px;
        height: 300px;
        overflow-y: auto;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        
        .log-item {
          margin-bottom: 5px;
          
          .log-time {
            color: #68d391;
            margin-right: 10px;
          }
          
          .log-message {
            color: #e2e8f0;
          }
        }
        
        .no-log {
          color: #a0aec0;
          text-align: center;
          margin-top: 50px;
        }
      }
    }
  }
  </style>