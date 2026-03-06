<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>
    
    <!-- 左侧品牌区域 -->
    <div class="brand-section">
      <div class="brand-content">
        <div class="logo-area">
          <div class="brand-header">
            <div class="logo-icon">
              <img src="@/assets/images/wyy-logo.png" alt="数字物宇Logo" />
            </div>
            <div class="brand-info">
              <h1 class="brand-title">数字物宇-物联中台</h1>
              <p class="brand-subtitle">Digital IoT Platform</p>
            </div>
          </div>
        </div>
        
        <div class="feature-list">
          <div class="feature-item">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" stroke="#2563EB" stroke-width="2" fill="none"/>
                <path d="M8 21l4-7 4 7" stroke="#2563EB" stroke-width="2" fill="none"/>
                <circle cx="12" cy="13" r="2" fill="#2563EB"/>
              </svg>
            </div>
            <div class="feature-text">
              <h3>统一设备管理</h3>
              <p>多品牌设备统一接入，标准化管理</p>
            </div>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="#2563EB" stroke-width="2" fill="none"/>
                <path d="M9 9h6v6H9V9z" fill="#2563EB" fill-opacity="0.2"/>
                <path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke="#2563EB" stroke-width="2"/>
              </svg>
            </div>
            <div class="feature-text">
              <h3>百万设备并发</h3>
              <p>秒级数据传输，实时状态监控</p>
            </div>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="#2563EB" stroke-width="2" fill="none"/>
                <path d="M8 12h8M12 8v8" stroke="#2563EB" stroke-width="2"/>
                <circle cx="7" cy="7" r="1.5" fill="#2563EB"/>
                <circle cx="17" cy="7" r="1.5" fill="#10B981"/>
                <circle cx="7" cy="17" r="1.5" fill="#F59E0B"/>
                <circle cx="17" cy="17" r="1.5" fill="#EF4444"/>
              </svg>
            </div>
            <div class="feature-text">
              <h3>智能化控制</h3>
              <p>多场景协同，算法智控优化</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 右侧登录表单 -->
    <div class="login-section">
      <div class="login-form-container">
        <div class="form-header">
          <h2>欢迎登录</h2>
          <p>请输入您的账号信息</p>
        </div>
        
        <el-form
          ref="loginForm"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          auto-complete="on"
          label-position="left"
          @submit.native.prevent="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              ref="username"
              v-model="loginForm.username"
              placeholder="请输入用户名"
              name="username"
              type="text"
              tabindex="1"
              auto-complete="on"
              prefix-icon="el-icon-user"
              size="large"
              clearable
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              :key="passwordType"
              ref="password"
              v-model="loginForm.password"
              :type="passwordType"
              placeholder="请输入密码"
              name="password"
              tabindex="2"
              auto-complete="on"
              prefix-icon="el-icon-lock"
              size="large"
              show-password
              @keyup.enter.native="handleLogin"
            />
          </el-form-item>
          
          <el-form-item>
            <div class="form-options">
              <el-checkbox v-model="rememberMe">记住密码</el-checkbox>
              <el-button type="text" class="forgot-btn">忘记密码？</el-button>
            </div>
          </el-form-item>
          
          <el-form-item>
            <el-button
              :loading="loading"
              type="primary"
              size="large"
              class="login-btn"
              @click="handleLogin"
            >
              {{ loading ? '登录中...' : '立即登录' }}
            </el-button>
          </el-form-item>
        </el-form>
        
        <div class="login-footer">
          <p class="help-text">
            遇到问题？请联系系统管理员
            <el-button type="text" size="small">技术支持</el-button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    const validateUsername = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入正确的用户名'))
      } else {
        callback()
      }
    }
    const validatePassword = (rule, value, callback) => {
      if (value.length < 3) {
        callback(new Error('密码长度不能少于3位'))
      } else {
        callback()
      }
    }
    return {
      loginForm: {
        username: '',
        password: ''
      },
      loginRules: {
        username: [{ required: true, trigger: 'blur', validator: validateUsername }],
        password: [{ required: true, trigger: 'blur', validator: validatePassword }]
      },
      loading: false,
      passwordType: 'password',
      redirect: undefined,
      rememberMe: false
    }
  },
  watch: {
    $route: {
      handler: function(route) {
        this.redirect = route.query && route.query.redirect
      },
      immediate: true
    }
  },
  methods: {
    showPwd() {
      if (this.passwordType === 'password') {
        this.passwordType = ''
      } else {
        this.passwordType = 'password'
      }
      this.$nextTick(() => {
        this.$refs.password.focus()
      })
    },
    
    handleLogin() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.loading = true
          
          const loginData = {
            username: this.loginForm.username,
            password: this.loginForm.password
          }
          
          this.$store.dispatch('user/login', loginData).then(() => {
            this.$message.success('登录成功')
            this.$router.push({ path: this.redirect || '/dashboard' })
          }).catch((error) => {
            this.$message.error(error.message || '登录失败')
          }).finally(() => {
            this.loading = false
          })
        } else {
          console.log('表单验证失败')
          return false
        }
      })
    }
  }
}
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  min-height: 100vh;
  position: relative;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f4ff 100%);
  overflow: hidden;
}

.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  
  .circle {
    position: absolute;
    border-radius: 50%;
    background: linear-gradient(45deg, rgba(37, 99, 235, 0.05), rgba(16, 185, 129, 0.05));
    
    &.circle-1 {
      width: 300px;
      height: 300px;
      top: -150px;
      left: -150px;
    }
    
    &.circle-2 {
      width: 200px;
      height: 200px;
      bottom: -100px;
      right: -100px;
      background: linear-gradient(45deg, rgba(16, 185, 129, 0.05), rgba(37, 99, 235, 0.05));
    }
    
    &.circle-3 {
      width: 150px;
      height: 150px;
      top: 20%;
      right: 10%;
      background: rgba(99, 102, 241, 0.03);
    }
  }
}

.brand-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  position: relative;
}

.brand-content {
  max-width: 480px;
  text-align: left;
}

.logo-area {
  margin-bottom: 60px;
  
  .brand-header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 20px;
    
    .logo-icon {
      width: 64px;
      height: 64px;
      flex-shrink: 0;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }
    
    .brand-info {
      flex: 1;
      
      .brand-title {
        font-size: 36px;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 8px 0;
        letter-spacing: -0.5px;
        line-height: 1.2;
      }
      
      .brand-subtitle {
        font-size: 16px;
        color: #64748b;
        margin: 0;
        font-weight: 400;
        letter-spacing: 1px;
        text-transform: uppercase;
      }
    }
  }
}

.feature-list {
  .feature-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 32px;
    
    .feature-icon {
      width: 48px;
      height: 48px;
      background: rgba(37, 99, 235, 0.08);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      flex-shrink: 0;
      
      svg {
        width: 24px;
        height: 24px;
      }
    }
    
    .feature-text {
      flex: 1;
      
      h3 {
        font-size: 16px;
        font-weight: 600;
        color: #334155;
        margin: 0 0 4px 0;
      }
      
      p {
        font-size: 14px;
        color: #64748b;
        margin: 0;
        line-height: 1.5;
      }
    }
  }
}

.login-section {
  width: 480px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  border-left: 1px solid rgba(37, 99, 235, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.login-form-container {
  width: 100%;
  max-width: 360px;
}

.form-header {
  text-align: center;
  margin-bottom: 40px;
  
  h2 {
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 8px 0;
  }
  
  p {
    font-size: 14px;
    color: #64748b;
    margin: 0;
  }
}

.login-form {
  .el-form-item {
    margin-bottom: 24px;
  }
  
  ::v-deep .el-input__inner {
    height: 48px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.3s ease;
    outline: none;
    
    &:focus {
      border-color: #2563eb !important;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
      outline: none !important;
    }
    
    &:hover {
      border-color: #94a3b8;
    }
  }
  
  ::v-deep .el-input__prefix {
    color: #94a3b8;
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .forgot-btn {
    color: #2563eb;
    padding: 0;
    font-size: 14px;
    
    &:hover {
      color: #1d4ed8;
    }
  }
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border: none;
  
  &:hover {
    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  }
}

.login-footer {
  text-align: center;
  margin-top: 32px;
  
  .help-text {
    font-size: 12px;
    color: #94a3b8;
    margin: 0;
    
    .el-button {
      color: #2563eb;
      padding: 0;
      font-size: 12px;
    }
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .login-container {
    flex-direction: column;
  }
  
  .brand-section {
    flex: none;
    padding: 20px;
    
    .brand-content {
      text-align: center;
    }
    
    .feature-list {
      display: none;
    }
  }
  
  .login-section {
    width: 100%;
    border-left: none;
    border-top: 1px solid rgba(37, 99, 235, 0.1);
  }
}

@media (max-width: 640px) {
  .brand-section {
    padding: 20px;
    
    .logo-area {
      margin-bottom: 30px;
      
      .brand-header {
        flex-direction: column;
        text-align: center;
        gap: 16px;
        
        .brand-info .brand-title {
          font-size: 24px;
        }
        
        .brand-info .brand-subtitle {
          font-size: 14px;
        }
      }
    }
  }
  
  .login-section {
    padding: 20px;
  }
}
</style>