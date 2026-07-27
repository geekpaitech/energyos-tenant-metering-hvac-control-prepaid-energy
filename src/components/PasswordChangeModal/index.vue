<template>
  <el-dialog
    title="修改密码"
    :visible.sync="visible"
    width="500px"
    :close-on-click-modal="false"
    :append-to-body="true"
    @close="handleClose"
  >
    <el-form
      ref="form"
      :model="form"
      :rules="rules"
      label-width="100px"
      label-position="right"
    >
      <el-form-item label="旧密码" prop="oldPassword">
        <el-input
          v-model="form.oldPassword"
          type="password"
          placeholder="请输入旧密码"
          show-password
        />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input
          v-model="form.newPassword"
          type="password"
          placeholder="请输入新密码"
          show-password
        />
      </el-form-item>
      <el-form-item label="确认新密码" prop="confirmPassword">
        <el-input
          v-model="form.confirmPassword"
          type="password"
          placeholder="请再次输入新密码"
          show-password
        />
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="close">取 消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">确 定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { changePassword } from '@/api/user'

export default {
  name: 'PasswordChangeModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    dialogVisible: {
      get () {
        return this.visible
      },
      set (val) {
        this.$emit('update:visible', val)
      }
    }
  },
  data () {
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== this.form.newPassword) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }
    return {
      loading: false,
      form: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      rules: {
        oldPassword: [
          { required: true, message: '请输入旧密码', trigger: 'blur' }
        ],
        newPassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请再次输入新密码', trigger: 'blur' },
          { validator: validateConfirmPassword, trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    close () {
      this.$emit('update:visible', false)
    },
    handleClose () {
      this.$refs.form.resetFields()
      this.close()
    },
    handleSubmit () {
      this.$refs.form.validate((valid) => {
        if (valid) {
          this.loading = true
          const { oldPassword, newPassword } = this.form
          changePassword({ oldPassword, newPassword })
            .then((res) => {
              if (res.code === 200) {
                this.$message.success('密码修改成功，请重新登录')
                this.close()
                this.$store.dispatch('user/logout').then(() => {
                  // 强制刷新页面，确保路由和状态彻底重置
                  location.reload()
                })
              } else {
                this.$message.error(res.msg || '修改失败')
              }
            })
            .finally(() => {
              this.loading = false
            })
        }
      })
    }
  }
}
</script>
