<template>
  <div class="login-container">
    <div class="login-background">
      <div class="grid-overlay"></div>
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
    </div>
    
    <div class="login-content">
      <div class="login-card">
        <div class="login-header">
          <div class="logo-container">
            <div class="logo-icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 2L35 10V30L20 38L5 30V10L20 2Z" stroke="#1890ff" stroke-width="2" fill="none"/>
                <circle cx="20" cy="20" r="8" fill="#1890ff" opacity="0.1"/>
                <circle cx="20" cy="20" r="4" fill="#1890ff"/>
                <path d="M20 8V16M32 20H24M20 24V32M16 20H8" stroke="#1890ff" stroke-width="2"/>
              </svg>
            </div>
            <div class="system-info">
              <h1 class="system-title">园区智慧物联</h1>
              <p class="system-subtitle">Park Intelligent IoT System</p>
            </div>
          </div>
        </div>

        <div class="login-form-container">
          <h2 class="form-title">欢迎登录</h2>
          
          <el-form
            ref="loginForm"
            :model="loginForm"
            :rules="loginRules"
            class="login-form"
            auto-complete="on"
            label-position="left"
          >
            <el-form-item prop="username">
              <div class="input-wrapper">
                <span class="input-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" fill="#8c8c8c"/>
                    <path d="M10 12.5C5 12.5 0.625 15.625 0.625 19.375C0.625 19.6875 0.875 20 1.25 20H18.75C19.125 20 19.375 19.6875 19.375 19.375C19.375 15.625 15 12.5 10 12.5Z" fill="#8c8c8c"/>
                  </svg>
                </span>
                <el-input
                  ref="username"
                  v-model="loginForm.username"
                  placeholder="请输入用户名"
                  name="username"
                  type="text"
                  tabindex="1"
                  auto-complete="on"
                />
              </div>
            </el-form-item>

            <el-form-item prop="password">
              <div class="input-wrapper">
                <span class="input-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.25 7.5H15V5C15 2.24 12.76 0 10 0C7.24 0 5 2.24 5 5V7.5H3.75C2.785 7.5 2 8.285 2 9.25V18.25C2 19.215 2.785 20 3.75 20H16.25C17.215 20 18 19.215 18 18.25V9.25C18 8.285 17.215 7.5 16.25 7.5ZM7 5C7 3.345 8.345 2 10 2C11.655 2 13 3.345 13 5V7.5H7V5ZM10 15C8.895 15 8 14.105 8 13C8 11.895 8.895 11 10 11C11.105 11 12 11.895 12 13C12 14.105 11.105 15 10 15Z" fill="#8c8c8c"/>
                  </svg>
                </span>
                <el-input
                  :key="passwordType"
                  ref="password"
                  v-model="loginForm.password"
                  :type="passwordType"
                  placeholder="请输入密码"
                  name="password"
                  tabindex="2"
                  auto-complete="on"
                  @keyup.enter.native="handleLogin"
                />
                <span class="show-pwd" @click="showPwd">
                  <svg v-if="passwordType === 'password'" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 4C13.06 4 15.78 5.44 17.29 7.67C17.62 8.12 17.62 8.73 17.29 9.18C15.78 11.41 13.06 12.85 10 12.85C6.94 12.85 4.22 11.41 2.71 9.18C2.38 8.73 2.38 8.12 2.71 7.67C4.22 5.44 6.94 4 10 4ZM10 5.5C8.07 5.5 6.5 7.07 6.5 9C6.5 10.93 8.07 12.5 10 12.5C11.93 12.5 13.5 10.93 13.5 9C13.5 7.07 11.93 5.5 10 5.5ZM10 7C11.1 7 12 7.9 12 9C12 10.1 11.1 11 10 11C8.9 11 8 10.1 8 9C8 7.9 8.9 7 10 7Z" fill="#8c8c8c"/>
                  </svg>
                  <svg v-else width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.22 2.22C1.83 2.61 1.83 3.24 2.22 3.63L4.2 5.61C2.87 6.68 1.79 8.02 1.13 9.5C1.01 9.72 1.01 9.99 1.13 10.21C2.71 13.35 5.67 15.5 9 15.5C10.26 15.5 11.45 15.24 12.54 14.78L15.37 17.61C15.76 18 16.39 18 16.78 17.61C17.17 17.22 17.17 16.59 16.78 16.2L3.63 3.05C3.44 2.86 3.19 2.75 2.93 2.75C2.67 2.75 2.41 2.86 2.22 3.05V2.22ZM9 5.5C9.69 5.5 10.34 5.69 10.89 6.02L12.75 7.88C12.84 7.44 12.89 6.98 12.89 6.5C12.89 4.02 10.98 2 8.5 2C8.02 2 7.56 2.05 7.12 2.14L8.98 4C9.32 3.91 9.66 3.86 10 3.86C11.93 3.86 13.5 5.43 13.5 7.36C13.5 7.7 13.45 8.04 13.36 8.36L15.46 10.46C16.33 9.61 17.05 8.6 17.57 7.5C17.69 7.28 17.69 7.01 17.57 6.79C16 3.65 13.03 1.5 9.7 1.5C8.52 1.5 7.4 1.73 6.36 2.13L8.46 4.23C8.63 4.18 8.81 4.14 9 4.14V5.5Z" fill="#8c8c8c"/>
                  </svg>
                </span>
              </div>
            </el-form-item>

            <div class="form-options">
              <el-checkbox v-model="rememberMe" class="remember-me">记住我</el-checkbox>
              <a href="#" class="forgot-password">忘记密码？</a>
            </div>

            <el-button
              :loading="loading"
              type="primary"
              class="login-button"
              @click.native.prevent="handleLogin"
            >
              {{ loading ? '登录中...' : '登 录' }}
            </el-button>
          </el-form>
        </div>

        <div class="login-footer">
          <p class="copyright">园区智慧物联系统 v2.0</p>
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
  min-height: 100vh;
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;

  .grid-overlay {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background-image: 
      linear-gradient(0deg, transparent 24%, rgba(24, 144, 255, 0.03) 25%, rgba(24, 144, 255, 0.03) 26%, transparent 27%, transparent 74%, rgba(24, 144, 255, 0.03) 75%, rgba(24, 144, 255, 0.03) 76%, transparent 77%, transparent),
      linear-gradient(90deg, transparent 24%, rgba(24, 144, 255, 0.03) 25%, rgba(24, 144, 255, 0.03) 26%, transparent 27%, transparent 74%, rgba(24, 144, 255, 0.03) 75%, rgba(24, 144, 255, 0.03) 76%, transparent 77%, transparent);
    background-size: 60px 60px;
    transform: rotate(45deg);
    animation: grid-move 20s linear infinite;
  }

  .floating-shapes {
    position: absolute;
    width: 100%;
    height: 100%;

    .shape {
      position: absolute;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(24, 144, 255, 0.1) 0%, rgba(24, 144, 255, 0.05) 100%);
      filter: blur(40px);

      &.shape-1 {
        width: 300px;
        height: 300px;
        top: -100px;
        right: -100px;
        animation: float-1 15s ease-in-out infinite;
      }

      &.shape-2 {
        width: 200px;
        height: 200px;
        bottom: -50px;
        left: -50px;
        animation: float-2 20s ease-in-out infinite;
      }

      &.shape-3 {
        width: 150px;
        height: 150px;
        top: 50%;
        left: 10%;
        animation: float-3 18s ease-in-out infinite;
      }
    }
  }
}

@keyframes grid-move {
  0% { transform: rotate(45deg) translate(0, 0); }
  100% { transform: rotate(45deg) translate(60px, 60px); }
}

@keyframes float-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-50px, 50px) scale(1.1); }
}

@keyframes float-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(50px, -50px) scale(0.9); }
}

@keyframes float-3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-30px, -30px) scale(1.05); }
}

.login-content {
  position: relative;
  z-index: 1;
}

.login-card {
  width: 420px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }
}

.login-header {
  padding: 40px 40px 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-bottom: 1px solid #e8e8e8;

  .logo-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;

    .logo-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .system-info {
      text-align: left;

      .system-title {
        font-size: 24px;
        font-weight: 600;
        color: #262626;
        margin: 0;
        letter-spacing: 0.5px;
      }

      .system-subtitle {
        font-size: 12px;
        color: #8c8c8c;
        margin: 4px 0 0;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
    }
  }
}

.login-form-container {
  padding: 30px 40px 20px;

  .form-title {
    font-size: 18px;
    font-weight: 500;
    color: #262626;
    margin: 0 0 30px;
    text-align: center;
  }
}

.login-form {
  ::v-deep .el-form-item {
    margin-bottom: 24px;

    .el-form-item__error {
      font-size: 12px;
      padding-top: 4px;
    }
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: #f5f7fa;
    border-radius: 8px;
    border: 1px solid transparent;
    transition: all 0.3s ease;

    &:hover {
      background: #ffffff;
      border-color: #d9d9d9;
    }

    &:focus-within {
      background: #ffffff;
      border-color: #1890ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
    }

    .input-icon {
      position: absolute;
      left: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
    }

    ::v-deep .el-input {
      .el-input__inner {
        background: transparent;
        border: none;
        padding: 12px 16px 12px 48px;
        height: 48px;
        font-size: 14px;
        color: #262626;
        border-radius: 8px;

        &::placeholder {
          color: #bfbfbf;
        }
      }
    }

    .show-pwd {
      position: absolute;
      right: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.6;
      }
    }
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .remember-me {
    ::v-deep .el-checkbox__label {
      color: #595959;
      font-size: 14px;
    }
  }

  .forgot-password {
    color: #1890ff;
    font-size: 14px;
    text-decoration: none;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.8;
    }
  }
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  transition: all 0.3s ease;
  letter-spacing: 1px;

  &:hover {
    background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
}

.login-footer {
  padding: 20px;
  text-align: center;
  background: #f8f9fa;
  border-top: 1px solid #e8e8e8;

  .copyright {
    margin: 0;
    font-size: 12px;
    color: #8c8c8c;
  }
}

@media (max-width: 480px) {
  .login-card {
    width: 100%;
    margin: 20px;
  }

  .login-header {
    padding: 30px 30px 20px;
  }

  .login-form-container {
    padding: 20px 30px;
  }
}
</style>