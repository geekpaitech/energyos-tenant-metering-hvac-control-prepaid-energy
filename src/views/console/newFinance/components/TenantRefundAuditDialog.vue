<template>
  <el-dialog
    :visible.sync="dialogVisible"
    :close-on-click-modal="false"
    width="520px"
    append-to-body
    :title="$t('tenantRefundPage.auditTitle')"
    @close="handleClose"
    @open="initDialog"
  >
    <div class="audit-dialog-content">
      <div class="message-card">
        <div class="message-row">
          <div class="message-label">{{ $t('tenantRefundPage.auditLblApplyAmt') }}</div>
          <div class="message-value">{{ formatMoney(sourceData.applyAmt) }}</div>
        </div>
        <div class="message-row">
          <div class="message-label">{{ $t('tenantRefundPage.auditLblRefundable') }}</div>
          <div class="message-value">{{ formatMoney(refundableBalance) }}</div>
        </div>
        <div class="message-row">
          <div class="message-label">{{ $t('tenantRefundPage.auditLblBankAccount') }}</div>
          <div class="message-value">{{ tenantInfo.bankNumber || sourceData.bankNumber || '-' }}</div>
        </div>
        <div class="message-row">
          <div class="message-label">{{ $t('tenantRefundPage.auditLblOpeningBank') }}</div>
          <div class="message-value">{{ tenantInfo.openingBank || sourceData.openingBank || '-' }}</div>
        </div>
        <div class="message-row">
          <div class="message-label">{{ $t('tenantRefundPage.auditLblAccountName') }}</div>
          <div class="message-value">{{ tenantInfo.payeeName || sourceData.payeeName || '-' }}</div>
        </div>
      </div>

      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px">
        <el-form-item :label="$t('tenantRefundPage.auditLblOpinion')" prop="refundStatus">
          <el-radio-group v-model="formData.refundStatus" @change="handleStatusChange">
            <el-radio :label="2">{{ $t('tenantRefundPage.auditAgree') }}</el-radio>
            <el-radio :label="5">{{ $t('tenantRefundPage.auditReject') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          v-if="formData.refundStatus === 2"
          :label="$t('tenantRefundPage.auditLblRefundAmt')"
          prop="actualAmt"
        >
          <el-input
            v-model="formData.actualAmt"
            :placeholder="$t('tenantRefundPage.phRefundAmt')"
            clearable
            @input="handleAmountInput"
          />
        </el-form-item>

        <el-form-item
          v-if="formData.refundStatus === 5"
          :label="$t('tenantRefundPage.auditLblRefuseReason')"
          prop="refuseMsg"
        >
          <el-input
            v-model="formData.refuseMsg"
            type="textarea"
            :rows="4"
            :placeholder="$t('tenantRefundPage.phRefuseReason')"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <el-dialog
        :visible.sync="smsDialogVisible"
        :close-on-click-modal="false"
        width="420px"
        append-to-body
        :title="$t('tenantRefundPage.smsTitle')"
      >
        <el-form label-width="90px">
          <el-form-item :label="$t('tenantRefundPage.smsLblPhone')">
            {{ maskedPhone }}
          </el-form-item>
          <el-form-item :label="$t('tenantRefundPage.smsLblCode')">
            <el-input v-model="smsCode" :placeholder="$t('tenantRefundPage.phSmsCode')">
              <el-button
                slot="append"
                :disabled="!canSendSms"
                @click="sendSmsCode"
              >
                {{ smsSendButtonText }}
              </el-button>
            </el-input>
          </el-form-item>
        </el-form>
        <span slot="footer">
          <el-button @click="smsDialogVisible = false">{{ $t('tenantRefundPage.btnCancel') }}</el-button>
          <el-button type="primary" :loading="submitting" @click="confirmSubmit">
            {{ $t('tenantRefundPage.btnConfirm') }}
          </el-button>
        </span>
      </el-dialog>
    </div>

    <span slot="footer">
      <el-button @click="handleClose">{{ $t('tenantRefundPage.btnCancel') }}</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ $t('tenantRefundPage.btnConfirm') }}
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
import { authSendSmsCode } from '@/api/user'
import { tenantRefundManagerProcessRefund } from '@/api/tenantRefund'
import { tenantGetById } from '@/api/tenant'

export default {
  name: 'TenantRefundAuditDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    sourceData: {
      type: Object,
      default: () => ({})
    },
    userPhone: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      submitting: false,
      tenantInfo: {},
      smsDialogVisible: false,
      smsCode: '',
      smsCooldownSec: 0,
      countDownTimer: null,
      formData: {
        refundStatus: 2,
        actualAmt: '',
        refuseMsg: ''
      }
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
    },
    canSendSms () {
      return this.smsCooldownSec <= 0
    },
    smsSendButtonText () {
      if (this.smsCooldownSec <= 0) return this.$t('tenantRefundPage.btnSendCode')
      return `${this.smsCooldownSec}s`
    },
    formRules () {
      return {
        refundStatus: [
          { required: true, message: this.$t('tenantRefundPage.ruleSelectOpinion'), trigger: 'change' }
        ],
        actualAmt: [
          { required: true, message: this.$t('tenantRefundPage.ruleRefundAmt'), trigger: 'blur' }
        ],
        refuseMsg: [
          { required: true, message: this.$t('tenantRefundPage.ruleRefuseReason'), trigger: 'blur' }
        ]
      }
    },
    maskedPhone () {
      if (!this.userPhone || this.userPhone.length < 11) return this.userPhone || '-'
      return `${this.userPhone.slice(0, 3)}****${this.userPhone.slice(7)}`
    },
    refundableBalance () {
      const bizType = Number(this.sourceData.bizType)
      if (bizType === 1) {
        return this.tenantInfo.meterAccountDto?.realAmt
      }
      if (bizType === 2) {
        return this.tenantInfo.waterAccountDto?.realAmt
      }
      return this.tenantInfo.realAmt
    }
  },
  beforeDestroy () {
    this.clearCountDown()
  },
  methods: {
    async initDialog () {
      this.resetForm()
      await this.loadTenantInfo()
    },
    handleClose () {
      this.dialogVisible = false
      this.smsDialogVisible = false
      this.smsCode = ''
      this.tenantInfo = {}
      this.resetForm()
      this.clearCountDown()
    },
    resetForm () {
      this.formData = {
        refundStatus: 2,
        actualAmt: '',
        refuseMsg: ''
      }
      this.$nextTick(() => {
        this.$refs.formRef && this.$refs.formRef.clearValidate()
      })
    },
    async loadTenantInfo () {
      if (!this.sourceData.tenantId) return
      try {
        const { data } = await tenantGetById({
          id: this.sourceData.tenantId
        })
        this.tenantInfo = data || {}
      } catch (error) {
        console.error('获取租户详情失败:', error)
        this.tenantInfo = {}
      }
    },
    handleStatusChange () {
      this.formData.actualAmt = ''
      this.formData.refuseMsg = ''
      this.$nextTick(() => {
        this.$refs.formRef && this.$refs.formRef.clearValidate()
      })
    },
    handleAmountInput (value) {
      const normalized = String(value || '').replace(/[^\d.]/g, '')
      const matched = normalized.match(/^\d*(?:\.\d{0,2})?/)
      this.formData.actualAmt = matched ? matched[0] : ''
    },
    formatMoney (value) {
      if (value === null || value === undefined || value === '') return '-'
      return `￥${Number(value).toFixed(2)}`
    },
    async handleSubmit () {
      try {
        const valid = await new Promise((resolve) => {
          this.$refs.formRef.validate((pass) => resolve(pass))
        })
        if (!valid) {
          this.$message.warning(this.$t('tenantRefundPage.msgFillAudit'))
          return
        }
        if (this.formData.refundStatus === 2) {
          if (this.formData.actualAmt === '') {
            this.$message.warning(this.$t('tenantRefundPage.msgEnterRefundAmt'))
            return
          }
          if (Number(this.formData.actualAmt) > Number(this.sourceData.applyAmt)) {
            this.$message.warning(this.$t('tenantRefundPage.msgRefundAmtTooHigh'))
            return
          }
          this.smsDialogVisible = true
          if (this.canSendSms) this.sendSmsCode()
          return
        }

        await this.submitAudit()
      } catch (error) {
        console.error('校验失败:', error)
      }
    },
    async confirmSubmit () {
      if (!this.smsCode) {
        this.$message.warning(this.$t('tenantRefundPage.msgEnterSmsCode'))
        return
      }
      await this.submitAudit(this.smsCode)
    },
    async submitAudit (code) {
      const confirmMsg = this.formData.refundStatus === 2
        ? this.$t('tenantRefundPage.confirmAuditPass')
        : this.$t('tenantRefundPage.confirmAuditReject')
      try {
        await this.$confirm(confirmMsg, this.$t('tenantRefundPage.confirmTitle'), {
          confirmButtonText: this.$t('tenantRefundPage.confirmOk'),
          cancelButtonText: this.$t('tenantRefundPage.confirmCancel'),
          type: 'warning'
        })
      } catch (error) {
        return
      }

      try {
        this.submitting = true
        const payload = {
          rid: this.sourceData.rid,
          phone: this.userPhone,
          refundStatus: this.formData.refundStatus,
          actualAmt: this.formData.actualAmt
        }
        if (this.formData.refundStatus === 2) {
          payload.smsCode = code
        }
        if (this.formData.refundStatus === 5) {
          payload.refuseMsg = this.formData.refuseMsg
        }
        const response = await tenantRefundManagerProcessRefund(payload)
        if (response.code === 200) {
          this.$message.success(response.msg || this.$t('tenantRefundPage.msgOpSuccess'))
          this.smsDialogVisible = false
          this.dialogVisible = false
          this.$emit('success')
        } else {
          this.$message.error(response.msg || this.$t('tenantRefundPage.msgOpFail'))
        }
      } catch (error) {
        console.error('退款审核失败:', error)
        this.$apiError.notify(error, this.$t('tenantRefundPage.msgAuditFail'))
      } finally {
        this.submitting = false
      }
    },
    async sendSmsCode () {
      if (!this.canSendSms || !this.userPhone) return
      try {
        const { msg } = await authSendSmsCode({
          phone: this.userPhone,
          eventType: 'METER_PRICE_MODIFY'
        })
        this.$message.success(msg || this.$t('tenantRefundPage.msgSmsSent'))
        let seconds = 60
        this.smsCooldownSec = seconds
        this.countDownTimer = setInterval(() => {
          seconds -= 1
          if (seconds <= 0) {
            this.clearCountDown()
            return
          }
          this.smsCooldownSec = seconds
        }, 1000)
      } catch (error) {
        console.error('发送验证码失败:', error)
        this.$apiError.notify(error, this.$t('tenantRefundPage.msgSmsSendFail'))
      }
    },
    clearCountDown () {
      if (this.countDownTimer) {
        clearInterval(this.countDownTimer)
        this.countDownTimer = null
      }
      this.smsCooldownSec = 0
    }
  }
}
</script>

<style lang="scss" scoped>
.message-card {
  margin-bottom: 20px;
  padding: 18px 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.message-row {
  display: flex;
  margin-bottom: 14px;
  font-size: 14px;

  &:last-child {
    margin-bottom: 0;
  }
}

.message-label {
  width: 120px;
  margin-right: 16px;
  color: #909399;
  text-align: right;
  flex-shrink: 0;
}

.message-value {
  color: #303133;
  word-break: break-all;
}
</style>
