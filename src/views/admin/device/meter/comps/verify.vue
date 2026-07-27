<template>
  <el-dialog
    title="确认操作"
    :close-on-click-modal="false"
    :visible.sync="verifyDialog.show"
    width="450px"
    @open="initDialog"
    @close="closeDialog"
  >
    <el-form label-width="90px">
      <el-form-item label="电表ID">{{ verifyDialog.meterId }}</el-form-item>
      <el-form-item label="电表名称">{{ verifyDialog.meterName }}</el-form-item>
      <el-form-item label="操作">
        <el-select v-model="queryData.switchStatus" placeholder="请选择" style="width:100%">
          <el-option v-for="(item, key) in switchOptions" :key="key" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="绑定手机">{{ codePhone }}</el-form-item>
      <el-form-item label="验证码">
        <el-input v-model="queryData.code" placeholder="请输入">
          <el-button slot="append" :disabled="countDown > 0" @click="getAuthSendSmsCode">
            {{ countDown > 0 ? `${countDown}s` : '发送验证码' }}
          </el-button>
        </el-input>
      </el-form-item>
    </el-form>
    <span slot="footer">
      <el-button @click="closeDialog">取 消</el-button>
      <el-button type="primary" :loading="submitting" @click="onSubmit">确 认</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { authSendSmsCode, tenantDoMeterSwitchOffOn } from '@/api/adminDb'
import { MeterSwitchStatus } from '@/utils/enums/meter'

export default {
  props: {
    verifyDialog: {
      type: Object,
      default: () => ({ show: false, type: 0, meterId: '', meterName: '' })
    }
  },
  data () {
    return {
      countDown: 0,
      countTimer: null,
      submitting: false,
      codePhone: '',
      queryData: { code: '', switchStatus: 0 }
    }
  },
  computed: {
    switchOptions () {
      return Object.values(MeterSwitchStatus)
    },
    phone () {
      return this.$store.state.user?.phone || ''
    }
  },
  beforeDestroy () {
    if (this.countTimer) clearInterval(this.countTimer)
  },
  methods: {
    async getAuthSendSmsCode () {
      if (this.countDown > 0 || !this.phone) return
      const { msg } = await authSendSmsCode({ phone: this.phone, eventType: 'METER_PRICE_MODIFY' })
      this.$message.success(msg || '已发送')
      this.countDown = 60
      this.countTimer = setInterval(() => {
        this.countDown -= 1
        if (this.countDown <= 0) clearInterval(this.countTimer)
      }, 1000)
    },
    async onSubmit () {
      this.submitting = true
      try {
        const { msg } = await tenantDoMeterSwitchOffOn({
          meterId: this.verifyDialog.meterId,
          verifyCode: this.queryData.code,
          verifyPhone: this.phone,
          switchStatus: this.queryData.switchStatus
        })
        this.$message.success(msg || '操作成功')
        this.closeDialog()
        this.$emit('search')
      } finally {
        this.submitting = false
      }
    },
    closeDialog () {
      this.queryData.code = ''
      this.verifyDialog.show = false
    },
    initDialog () {
      this.queryData.switchStatus = this.verifyDialog.type
      const phone = this.phone
      this.codePhone = phone ? phone.substr(0, 3) + '****' + phone.substr(7) : '-'
    }
  }
}
</script>
