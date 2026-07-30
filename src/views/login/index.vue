<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <div class="left-hero">
      <div class="left-hero__top">
        <img class="left-hero__logo" src="@/assets/images/wyy-logo.png" alt="极派科技Logo" />
        <div class="left-hero__brand">极派科技</div>
      </div>
      <div class="left-hero__title">智能视觉·物联中台</div>
      <div class="left-hero__slogan">让管理更简单 · 让能耗更透明</div>
    </div>

    <!-- 右侧登录表单 -->
    <div class="login-section">
      <div class="login-form-container">
        <div class="form-header">
          <div class="brand-mini">
            <img class="brand-mini__logo" src="@/assets/images/wyy-logo.png" alt="极派科技Logo" />
            <div class="brand-mini__text">
              <div class="brand-mini__name">智能视觉·物联中台</div>
              <div class="brand-mini__en">Digital IoT Platform</div>
            </div>
          </div>
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
              placeholder="请输入账号"
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
            <el-button type="text" size="small" @click="openSupportDialog">技术支持</el-button>
          </p>
          <p class="help-text">
            没有账号？<el-button type="text" size="small" @click="openRegisterDialog">立即注册</el-button>
          </p>
        </div>
      </div>
    </div>

    <el-dialog
      :visible.sync="registerDialogVisible"
      width="420px"
      top="0"
      append-to-body
      custom-class="trial-register-dialog"
      modal-class="trial-register-modal"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="handleRegisterDialogClose"
    >
      <div slot="title" class="trial-register-title">注册体验账号</div>
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        label-position="top"
        autocomplete="off"
        hide-required-asterisk
        class="register-form"
      >
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="registerForm.phone"
            placeholder="请输入手机号"
            size="large"
            maxlength="11"
            clearable
            type="tel"
            autocomplete="tel"
            name="trialPhone"
          />
        </el-form-item>

        <el-form-item label="验证码" prop="code">
          <div class="code-row">
            <el-input
              v-model="registerForm.code"
              placeholder="请输入验证码"
              size="large"
              maxlength="6"
              autocomplete="one-time-code"
              name="trialCode"
            />
            <el-button
              class="code-btn"
              size="large"
              :loading="smsLoading"
              :disabled="smsLoading || smsCountdown > 0"
              @click="handleSendRegisterCode"
            >
              {{ smsBtnText }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="登录密码" prop="password">
          <el-input
            v-model="registerForm.password"
            placeholder="8-16位密码"
            size="large"
            show-password
            autocomplete="new-password"
            name="trialPassword"
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            placeholder="请再次输入密码"
            size="large"
            show-password
            autocomplete="new-password"
            name="trialConfirmPassword"
          />
        </el-form-item>
      </el-form>

      <span slot="footer">
        <el-button size="large" @click="registerDialogVisible = false">取消</el-button>
        <el-button :type="registerStep === 'login' ? 'success' : 'primary'" size="large" :loading="registerLoading" @click="handleRegisterPrimary">
          {{ registerPrimaryText }}
        </el-button>
      </span>
    </el-dialog>

    <el-dialog
      :visible.sync="supportDialogVisible"
      width="420px"
      top="0"
      append-to-body
      custom-class="support-qrcode-dialog"
      modal-class="support-qrcode-modal"
      :close-on-click-modal="true"
      :close-on-press-escape="true"
      @close="handleSupportDialogClose"
    >
      <div slot="title" class="support-qrcode-title">技术支持</div>
      <div class="support-qrcode">
        <div class="support-qrcode__subtitle">微信扫码咨询客服</div>
        <div class="support-qrcode__card">
          <img class="support-qrcode__img" :src="supportQrcodeImg" alt="技术支持二维码" />
        </div>
        <div class="support-qrcode__hint">如无法识别，请保存图片后用微信扫一扫</div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { trialSendSmsCode, registerExperienceAccount } from '@/api/user'
import supportQrcodeImg from '@/assets/ewm.png'

export default {
  name: 'Login',
  data () {
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
    const validatePhone = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入正确的手机号'))
        return
      }
      if (!/^1\d{10}$/.test(value)) {
        callback(new Error('请输入正确的手机号'))
        return
      }
      callback()
    }
    const validateRegisterPassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入8-16位密码'))
        return
      }
      if (value.length < 8 || value.length > 16) {
        callback(new Error('请输入8-16位密码'))
        return
      }
      callback()
    }
    const validateConfirmPassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请再次输入密码'))
        return
      }
      if (value !== this.registerForm.password) {
        callback(new Error('两次输入的密码不一致'))
        return
      }
      callback()
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
      rememberMe: false,
      registerDialogVisible: false,
      supportDialogVisible: false,
      registerLoading: false,
      smsLoading: false,
      smsCountdown: 0,
      smsTimer: null,
      registerStep: 'register',
      supportQrcodeImg,
      registerForm: {
        phone: '',
        code: '',
        password: '',
        confirmPassword: ''
      },
      registerRules: {
        phone: [{ required: true, trigger: 'blur', validator: validatePhone }],
        code: [{ required: true, trigger: 'blur', message: '请输入验证码' }],
        password: [{ required: true, trigger: 'blur', validator: validateRegisterPassword }],
        confirmPassword: [{ required: true, trigger: 'blur', validator: validateConfirmPassword }]
      }
    }
  },
  computed: {
    smsBtnText () {
      return this.smsCountdown > 0 ? `${this.smsCountdown}s` : '获取验证码'
    },
    registerPrimaryText () {
      return this.registerStep === 'login' ? '去登录' : '立即注册'
    }
  },
  watch: {
    $route: {
      handler (route) {
        const raw = route.query && route.query.redirect
        if (!raw) {
          this.redirect = undefined
          return
        }
        // 退出登录时 redirect 可能被 encode 过，这里统一兼容 decode
        try {
          this.redirect = decodeURIComponent(String(raw))
        } catch (e) {
          this.redirect = String(raw)
        }
      },
      immediate: true
    }
  },
  beforeDestroy () {
    this.clearRegisterCountdown()
  },
  methods: {
    showPwd () {
      if (this.passwordType === 'password') {
        this.passwordType = ''
      } else {
        this.passwordType = 'password'
      }
      this.$nextTick(() => {
        this.$refs.password && this.$refs.password.focus()
      })
    },
    handleLogin () {
      this.$refs.loginForm.validate(valid => {
        if (!valid) {
          return false
        }
        this.loading = true
        const loginData = {
          username: this.loginForm.username,
          password: this.loginForm.password
        }
        this.$store.dispatch('user/login', loginData).then(() => {
          this.$message.success('登录成功')
          // 不再默认跳到不存在的 /dashboard；交给全局路由守卫在动态路由就绪后决定首页
          this.$router.push({ path: this.redirect || '/' }).catch(() => {})
        }).catch((error) => {
          this.$apiError.notify(error, '登录失败')
        }).finally(() => {
          this.loading = false
        })
      })
    },
    openRegisterDialog () {
      this.clearLoginCache()
      this.resetRegisterDialog()
      this.registerDialogVisible = true
      this.$nextTick(() => {
        this.$refs.registerFormRef && this.$refs.registerFormRef.clearValidate()
      })
    },
    openSupportDialog () {
      this.supportDialogVisible = true
    },
    handleRegisterDialogClose () {
      this.registerDialogVisible = false
      this.resetRegisterDialog()
    },
    handleSupportDialogClose () {
      this.supportDialogVisible = false
    },
    clearLoginCache () {
      this.$store.dispatch('user/resetToken').catch(() => {})
      try {
        localStorage.removeItem('selectedPlatform')
        localStorage.removeItem('tree-panel-state')
        localStorage.removeItem('submenu-collapsed-groups')
        localStorage.removeItem('tree-selection-state')
      } catch (e) {}
      try {
        sessionStorage.removeItem('token_expired_refreshed')
      } catch (e) {}
    },
    resetRegisterDialog () {
      this.registerLoading = false
      this.smsLoading = false
      this.registerStep = 'register'
      this.smsCountdown = 0
      this.clearRegisterCountdown()
      if (this.$refs.registerFormRef) {
        this.$refs.registerFormRef.resetFields()
        this.$refs.registerFormRef.clearValidate()
        return
      }
      this.registerForm.phone = ''
      this.registerForm.code = ''
      this.registerForm.password = ''
      this.registerForm.confirmPassword = ''
    },
    clearRegisterCountdown () {
      if (this.smsTimer) {
        clearInterval(this.smsTimer)
        this.smsTimer = null
      }
    },
    startRegisterCountdown (seconds) {
      this.clearRegisterCountdown()
      this.smsCountdown = seconds
      this.smsTimer = setInterval(() => {
        if (this.smsCountdown <= 1) {
          this.smsCountdown = 0
          this.clearRegisterCountdown()
          return
        }
        this.smsCountdown -= 1
      }, 1000)
    },
    handleSendRegisterCode () {
      if (!this.$refs.registerFormRef) return
      this.$refs.registerFormRef.validateField('phone', (msg) => {
        if (msg) return
        this.smsLoading = true
        trialSendSmsCode({
          phone: this.registerForm.phone,
          eventType: 'METER_PRICE_MODIFY'
        }).then((res) => {
          if (res && (res.code === 0 || res.code === 200)) {
            this.$message.success(res.msg || '验证码已发送')
            this.startRegisterCountdown(60)
            return
          }
          this.$message.error((res && res.msg) || '验证码发送失败')
        }).catch((e) => {
          this.$apiError.notify(e, '验证码发送失败')
        }).finally(() => {
          this.smsLoading = false
        })
      })
    },
    handleRegisterPrimary () {
      if (this.registerStep === 'login') {
        this.registerDialogVisible = false
        this.$nextTick(() => {
          this.$refs.username && this.$refs.username.focus()
        })
        return
      }
      this.handleRegister()
    },
    handleRegister () {
      if (!this.$refs.registerFormRef) return
      this.$refs.registerFormRef.validate((valid) => {
        if (!valid) return
        this.registerLoading = true
        registerExperienceAccount({
          phone: this.registerForm.phone,
          code: this.registerForm.code,
          password: this.registerForm.password
        }).then((res) => {
          if (res && (res.code === 0 || res.code === 200)) {
            this.$message.success(res.msg || '注册成功')
            this.registerStep = 'login'
            this.loginForm.username = this.registerForm.phone
            this.loginForm.password = this.registerForm.password
            this.registerLoading = false
            return
          }
          this.$message.error((res && res.msg) || '注册失败')
          this.registerLoading = false
        }).catch((e) => {
          this.$apiError.notify(e, '注册失败')
          this.registerLoading = false
        })
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
  background: url('~@/assets/bj_1.jpg') center / cover no-repeat;
  overflow: hidden;
  --login-panel-w: clamp(420px, 34vw, 560px);
  align-items: stretch;
  justify-content: flex-end;
}

.left-hero {
  position: absolute;
  left: clamp(40px, 6vw, 96px);
  top: clamp(44px, 10vh, 140px);
  max-width: min(520px, calc(100% - var(--login-panel-w) - 120px));
  z-index: 1;
  color: rgba(15, 23, 42, 0.92);
}

.left-hero__top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.left-hero__logo {
  width: 34px;
  height: 34px;
  object-fit: contain;
  flex-shrink: 0;
}

.left-hero__brand {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.2px;
  color: rgba(15, 23, 42, 0.74);
}

.left-hero__title {
  margin-top: 18px;
  font-size: 44px;
  font-weight: 800;
  letter-spacing: -0.6px;
  line-height: 1.1;
  color: rgba(15, 23, 42, 0.78);
  text-shadow: 0 10px 30px rgba(15, 23, 42, 0.10);
}

.left-hero__subtitle {
  display: none;
}

.left-hero__slogan {
  margin-top: 12px;
  font-size: 14px;
  color: rgba(100, 116, 139, 0.88);
  letter-spacing: 0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  text-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: var(--login-panel-w);
  height: 100%;
  background:
    radial-gradient(1200px 600px at 30% 20%, rgba(15, 23, 42, 0.06) 0%, rgba(15, 23, 42, 0) 55%),
    radial-gradient(900px 520px at 70% 78%, rgba(15, 23, 42, 0.04) 0%, rgba(15, 23, 42, 0) 52%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.82) 0%, rgba(255, 255, 255, 0.62) 100%);
  border-left: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow:
    -18px 0 42px rgba(15, 23, 42, 0.10),
    inset 1px 0 0 rgba(255, 255, 255, 0.55);
  -webkit-backdrop-filter: saturate(160%) blur(18px);
  backdrop-filter: saturate(160%) blur(18px);
  pointer-events: none;
  z-index: 0;
}

.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  .circle { display: none; }
  z-index: 0;
}

.login-section {
  width: var(--login-panel-w);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 56px;
  margin-right: 0;
  position: relative;
  z-index: 1;
}

.login-form-container {
  width: 100%;
  max-width: 400px;
}

.form-header {
  margin-bottom: 20px;
}

.brand-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.brand-mini__logo {
  width: 44px;
  height: 44px;
  object-fit: contain;
  flex-shrink: 0;
}

.brand-mini__text {
  min-width: 0;
  text-align: center;
}

.brand-mini__name {
  font-size: 18px;
  font-weight: 650;
  color: rgba(15, 23, 42, 0.82);
  line-height: 1.2;
  letter-spacing: 0.2px;
}

.brand-mini__en {
  margin-top: 4px;
  font-size: 11px;
  color: rgba(100, 116, 139, 0.72);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.login-form {
  .el-form-item {
    margin-bottom: 20px;
  }

  ::v-deep .el-input__prefix,
  ::v-deep .el-input__suffix {
    top: 0;
    height: 100%;
    display: flex;
    align-items: center;
  }

  ::v-deep .el-input__prefix {
    left: 14px;
  }

  ::v-deep .el-input__suffix {
    right: 14px;
  }

  ::v-deep .el-input__suffix-inner {
    height: 100%;
    display: flex;
    align-items: center;
  }

  ::v-deep .el-input__inner {
    height: 56px;
    line-height: 56px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.75);
    color: #0f172a;
    font-size: 16px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    outline: none;
    padding-top: 0;
    padding-bottom: 0;
    padding-left: 44px;
    padding-right: 44px;

    &:focus {
      border-color: rgba(37, 99, 235, 0.9) !important;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.16) !important;
      outline: none !important;
    }

    &:hover {
      border-color: rgba(100, 116, 139, 0.55);
    }
  }

  ::v-deep .el-input__inner::placeholder {
    color: rgba(100, 116, 139, 0.75);
  }

  ::v-deep .el-input__prefix {
    color: rgba(51, 65, 85, 0.7);
  }

  ::v-deep .el-input__icon {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  ::v-deep .el-form-item__error {
    padding-left: 44px;
    line-height: 1.2;
  }
}

.form-options {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
  padding-left: 10px;
}

.login-btn {
  width: 100%;
  height: 56px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border: none;
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.22);

  &:hover {
    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  }
}

.login-footer {
  text-align: center;
  margin-top: 18px;

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

.trial-register-title {
  font-size: 16px;
  font-weight: 650;
  color: rgba(15, 23, 42, 0.88);
  letter-spacing: 0.2px;
}

::v-deep .trial-register-dialog {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 28px 70px rgba(15, 23, 42, 0.22);
  position: fixed;
  top: 50% !important;
  left: 50%;
  transform: translate(-50%, -50%);
  margin: 0 !important;
  max-width: calc(100vw - 32px);
}

::v-deep .trial-register-dialog .el-dialog__header {
  padding: 18px 20px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
}

::v-deep .trial-register-dialog .el-dialog__headerbtn {
  top: 14px;
  right: 14px;
}

::v-deep .trial-register-dialog .el-dialog__headerbtn .el-dialog__close {
  font-size: 18px;
  color: rgba(51, 65, 85, 0.55);
}

::v-deep .trial-register-dialog .el-dialog__body {
  padding: 16px 20px 8px;
}

::v-deep .trial-register-dialog .el-dialog__footer {
  padding: 12px 20px 18px;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
}

::v-deep .trial-register-modal {
  background-color: rgba(15, 23, 42, 0.42);
  backdrop-filter: blur(3px);
}

::v-deep .support-qrcode-dialog {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 28px 70px rgba(15, 23, 42, 0.22);
  position: fixed;
  top: 50% !important;
  left: 50%;
  transform: translate(-50%, -50%);
  margin: 0 !important;
  max-width: calc(100vw - 32px);
}

::v-deep .support-qrcode-dialog .el-dialog__header {
  padding: 18px 20px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
}

::v-deep .support-qrcode-dialog .el-dialog__headerbtn {
  top: 14px;
  right: 14px;
}

::v-deep .support-qrcode-dialog .el-dialog__headerbtn .el-dialog__close {
  font-size: 18px;
  color: rgba(51, 65, 85, 0.55);
}

::v-deep .support-qrcode-dialog .el-dialog__body {
  padding: 16px 20px 20px;
}

::v-deep .support-qrcode-modal {
  background-color: rgba(15, 23, 42, 0.46);
  backdrop-filter: blur(3px);
}

.support-qrcode-title {
  font-size: 16px;
  font-weight: 650;
  color: rgba(15, 23, 42, 0.88);
  letter-spacing: 0.2px;
}

.support-qrcode {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.support-qrcode__subtitle {
  font-size: 13px;
  font-weight: 600;
  color: rgba(51, 65, 85, 0.72);
}

.support-qrcode__card {
  margin-top: 14px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.10);
}

.support-qrcode__img {
  width: 280px;
  height: 280px;
  object-fit: contain;
  display: block;
  border-radius: 12px;
  background: #fff;
}

.support-qrcode__hint {
  margin-top: 12px;
  font-size: 12px;
  color: rgba(100, 116, 139, 0.82);
}

.support-qrcode__hint::before {
  content: '• ';
  color: rgba(148, 163, 184, 0.9);
}

::v-deep .register-form .el-form-item {
  margin-bottom: 18px;
}

::v-deep .register-form .el-form-item__label {
  padding: 0 0 8px;
  line-height: 1.2;
  font-size: 12px;
  font-weight: 600;
  color: rgba(51, 65, 85, 0.72);
}

::v-deep .register-form .el-input__inner {
  height: 48px;
  line-height: 48px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.30);
  background: rgba(255, 255, 255, 0.78);
  color: rgba(15, 23, 42, 0.92);
  font-size: 14px;
  padding-left: 14px;
  padding-right: 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

::v-deep .register-form .el-input__inner:focus {
  border-color: rgba(37, 99, 235, 0.9);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.14);
  background: rgba(255, 255, 255, 0.92);
}

::v-deep .register-form .el-form-item__error {
  position: static;
  padding-top: 0;
  margin-top: 6px;
  line-height: 1.2;
}

.code-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.code-row .el-input {
  flex: 1 1 auto;
}

.code-btn {
  flex: 0 0 120px;
  border-radius: 12px;
}

// 响应式设计
@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
    justify-content: center;
  }

  .left-hero {
    display: none;
  }

  .login-container::before {
    width: 100%;
    height: 100%;
  }

  .login-section {
    width: min(92vw, 460px);
    margin: 0 auto;
    padding: 40px 24px 28px;
  }
}

@media (max-width: 640px) {
  .login-section {
    padding: 20px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.78);
  }
}

@media (max-height: 760px) {
  .login-section {
    padding: 22px 22px 18px;
  }

  .form-header {
    margin-bottom: 18px;
  }

  .login-form .el-form-item {
    margin-bottom: 14px;
  }

  .login-footer {
    margin-top: 14px;
  }
}
</style>
