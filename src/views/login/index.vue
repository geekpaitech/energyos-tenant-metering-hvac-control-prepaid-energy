<template>
  <div class="login-container">
    <!-- 左侧品牌展示区 -->
    <div class="brand-side">
      <div class="brand-content">
        <div class="logo-section">
          <div class="logo">
            <svg viewBox="0 0 48 48" width="48" height="48">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#4A90E2"/>
                  <stop offset="100%" style="stop-color:#357ABD"/>
                </linearGradient>
              </defs>
              <!-- 简化的仪表图标 -->
              <circle cx="24" cy="24" r="20" fill="none" stroke="url(#logoGrad)" stroke-width="2"/>
              <path d="M24 8 L24 16 M24 32 L24 40 M8 24 L16 24 M32 24 L40 24" stroke="url(#logoGrad)" stroke-width="1.5" opacity="0.6"/>
              <circle cx="24" cy="24" r="3" fill="url(#logoGrad)"/>
              <path d="M24 24 L30 18" stroke="url(#logoGrad)" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <h1 class="brand-name">物宇云平台</h1>
        </div>
        
        <div class="brand-desc">
          <h2>智能计量管理系统</h2>
          <p>专业的水电能源管理与计费解决方案</p>
        </div>

        <div class="features">
          <div class="feature-item">
            <i class="el-icon-data-line"></i>
            <span>实时数据监控</span>
          </div>
          <div class="feature-item">
            <i class="el-icon-coin"></i>
            <span>智能计费管理</span>
          </div>
          <div class="feature-item">
            <i class="el-icon-data-analysis"></i>
            <span>数据分析报表</span>
          </div>
        </div>

        <div class="copyright">
          <p>&copy; 2024 物宇云 版权所有</p>
        </div>
      </div>
    </div>

    <!-- 右侧登录表单区 -->
    <div class="login-side">
      <div class="login-form-wrapper">
        <div class="form-header">
          <h3>欢迎登录</h3>
          <p>请输入您的账号密码登录系统</p>
        </div>

        <el-form
          ref="loginForm"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          label-position="top"
        >
          <el-form-item prop="username">
            <label class="form-label">账号</label>
            <el-input
              ref="username"
              v-model="loginForm.username"
              placeholder="请输入手机号"
              prefix-icon="el-icon-user"
              size="large"
              tabindex="1"
            />
          </el-form-item>

          <el-form-item prop="password">
            <label class="form-label">密码</label>
            <el-input
              ref="password"
              v-model="loginForm.password"
              :type="passwordType"
              placeholder="请输入密码"
              prefix-icon="el-icon-lock"
              size="large"
              tabindex="2"
              @keyup.enter.native="handleLogin"
            >
              <template #suffix>
                <i 
                  :class="passwordType === 'password' ? 'el-icon-view' : 'el-icon-hide'"
                  @click="showPwd"
                  style="cursor: pointer; color: #999;"
                />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <div class="form-options">
              <el-checkbox v-model="rememberMe">记住密码</el-checkbox>
              <a href="#" class="forgot-link">忘记密码？</a>
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
              {{ loading ? '登录中...' : '登录' }}
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-footer">
          <p class="tips">
            <i class="el-icon-info"></i>
            建议使用Chrome、Firefox、Edge等现代浏览器
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

<style lang="scss" scoped>
.login-container {
  display: flex;
  height: 100vh;
  background: #f5f7fa;
  overflow: hidden;
}

// 左侧品牌展示区
.brand-side {
  flex: 1;
  background: linear-gradient(135deg, #2b5ce6 0%, #1e3c72 100%);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  
  // 添加网格背景
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 50px 50px;
    opacity: 0.5;
  }

  .brand-content {
    position: relative;
    z-index: 1;
    text-align: center;
    color: white;
    padding: 40px;
    max-width: 500px;
  }

  .logo-section {
    margin-bottom: 40px;

    .logo {
      width: 80px;
      height: 80px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .brand-name {
      font-size: 32px;
      font-weight: 600;
      margin: 0;
      letter-spacing: 2px;
    }
  }

  .brand-desc {
    margin-bottom: 60px;

    h2 {
      font-size: 24px;
      font-weight: 400;
      margin: 0 0 10px 0;
      opacity: 0.95;
    }

    p {
      font-size: 16px;
      opacity: 0.8;
      margin: 0;
    }
  }

  .features {
    display: flex;
    justify-content: center;
    gap: 40px;
    margin-bottom: 80px;

    .feature-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;

      i {
        font-size: 28px;
        opacity: 0.9;
      }

      span {
        font-size: 14px;
        opacity: 0.8;
      }
    }
  }

  .copyright {
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    
    p {
      font-size: 12px;
      opacity: 0.6;
      margin: 0;
    }
  }
}

// 右侧登录表单区
.login-side {
  width: 480px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.08);
}

.login-form-wrapper {
  width: 360px;
  padding: 40px;
}

.form-header {
  text-align: center;
  margin-bottom: 40px;

  h3 {
    font-size: 28px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 10px 0;
  }

  p {
    font-size: 14px;
    color: #909399;
    margin: 0;
  }
}

.login-form {
  .el-form-item {
    margin-bottom: 24px;
  }

  .form-label {
    font-size: 14px;
    color: #606266;
    font-weight: 500;
    margin-bottom: 8px;
    display: block;
  }

  :deep(.el-input) {
    .el-input__inner {
      height: 48px;
      line-height: 48px;
      border-radius: 8px;
      border: 1px solid #dcdfe6;
      font-size: 14px;
      
      &:focus {
        border-color: #2b5ce6;
      }
    }

    .el-input__prefix {
      font-size: 16px;
      color: #909399;
    }
  }

  .form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .forgot-link {
      font-size: 14px;
      color: #2b5ce6;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }

  :deep(.el-checkbox) {
    .el-checkbox__label {
      font-size: 14px;
      color: #606266;
    }

    .el-checkbox__input.is-checked .el-checkbox__inner {
      background-color: #2b5ce6;
      border-color: #2b5ce6;
    }
  }

  .login-btn {
    width: 100%;
    height: 48px;
    font-size: 16px;
    border-radius: 8px;
    font-weight: 500;
    
    &:deep(.el-button--primary) {
      background-color: #2b5ce6;
      border-color: #2b5ce6;
      
      &:hover {
        background-color: #4a7feb;
        border-color: #4a7feb;
      }
    }
  }
}

.login-footer {
  margin-top: 40px;
  text-align: center;

  .tips {
    font-size: 12px;
    color: #909399;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;

    i {
      font-size: 14px;
    }
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .brand-side {
    display: none;
  }

  .login-side {
    width: 100%;
    box-shadow: none;
  }
}

@media (max-width: 480px) {
  .login-form-wrapper {
    width: 100%;
    padding: 20px;
  }

  .form-header {
    h3 {
      font-size: 24px;
    }
  }

  .features {
    flex-direction: column;
    gap: 20px;
  }
}
</style>