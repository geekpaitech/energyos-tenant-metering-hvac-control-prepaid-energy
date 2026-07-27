<template>
  <el-dialog
    :title="$t('tenantDialogs.recharge.title')"
    :visible.sync="dialogVisible"
    width="480px"
    :close-on-click-modal="false"
    class="custom-dialog"
    @close="handleClose"
  >
    <el-form
      ref="rechargeForm"
      :model="form"
      :rules="rules"
      :label-width="dialogLabelWidth"
    >
      <el-form-item :label="$t('tenantDialogs.recharge.labelBizType')" prop="bizType">
        <el-radio-group
          v-model="form.bizType"
          :disabled="!canSelectBizType"
        >
          <el-radio
            v-for="item in availableBizTypeOptions"
            :key="item.value"
            :label="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item :label="$t('tenantDialogs.recharge.labelAmount')" prop="amount">
        <el-input-number
          v-model="form.amount"
          :min="0.01"
          :max="99999"
          :precision="2"
          :placeholder="$t('tenantDialogs.recharge.phAmount')"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item :label="$t('tenantDialogs.recharge.labelRemark')" prop="remark">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          :placeholder="$t('tenantDialogs.recharge.phRemark')"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <span slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">{{ $t('tenantDialogs.recharge.cancel') }}</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        @click="handleSubmit"
      >
        {{ submitting ? $t('tenantDialogs.recharge.submitting') : $t('tenantDialogs.recharge.confirm') }}
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
import { payOfflineRechargePreOrder } from '@/api/pay'
import { mapGetters } from 'vuex'

export default {
  name: 'RechargeDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    tenantData: {
      type: Object,
      default: () => ({})
    }
  },
  data () {
    return {
      submitting: false,
      form: {
        bizType: 1,
        amount: null,
        remark: ''
      }
    }
  },
  computed: {
    dialogLabelWidth () {
      return this.$i18n.locale === 'en' ? '120px' : '100px'
    },
    rules () {
      return {
        bizType: [
          { required: true, message: this.$t('tenantDialogs.recharge.ruleBizType'), trigger: 'change' }
        ],
        amount: [
          { required: true, message: this.$t('tenantDialogs.recharge.ruleAmount'), trigger: 'blur' },
          {
            type: 'number',
            min: 0.01,
            message: this.$t('tenantDialogs.recharge.ruleAmountMin'),
            trigger: 'blur'
          }
        ],
        remark: [
          { required: true, message: this.$t('tenantDialogs.recharge.ruleRemark'), trigger: 'blur' }
        ]
      }
    },
    bizTypeOptions () {
      return [
        { value: 1, label: this.$t('tenantDialogs.recharge.electric') },
        { value: 2, label: this.$t('tenantDialogs.recharge.water') }
      ]
    },
    ...mapGetters('user', ['userId']),

    dialogVisible: {
      get () {
        return this.visible
      },
      set (val) {
        this.$emit('update:visible', val)
      }
    },

    // 🔥 核心逻辑：判断租户开户情况
    hasElectricAccount () {
      // 电费专户开户：meterStatus === 1
      return this.tenantData.meterStatus === 1
    },

    hasWaterAccount () {
      // 水费专户开户：waterStatus === 1
      return this.tenantData.waterStatus === 1
    },

    // 🔥 根据开户情况动态生成可选项
    availableBizTypeOptions () {
      const hasElectric = this.hasElectricAccount
      const hasWater = this.hasWaterAccount

      // 情况1：两个都开户 → 显示两个选项
      if (hasElectric && hasWater) {
        return this.bizTypeOptions
      }

      // 情况2：只开电费 → 只显示电费
      if (hasElectric && !hasWater) {
        return [{ value: 1, label: this.$t('tenantDialogs.recharge.electric') }]
      }

      // 情况3：只开水费 → 只显示水费
      if (!hasElectric && hasWater) {
        return [{ value: 2, label: this.$t('tenantDialogs.recharge.water') }]
      }

      // 情况4：都未开户 → 默认显示电费
      return [{ value: 1, label: this.$t('tenantDialogs.recharge.electric') }]
    },

    // 🔥 是否可以选择充值类型（只有两个都开户才能选）
    canSelectBizType () {
      return this.hasElectricAccount && this.hasWaterAccount
    },

    // 🔥 默认充值类型
    defaultBizType () {
      const hasElectric = this.hasElectricAccount
      const hasWater = this.hasWaterAccount

      // 优先级：电费 > 水费
      if (hasElectric) return 1
      if (hasWater) return 2
      return 1 // 都未开户默认电费
    },

    // 获取充值类型文本
    bizTypeText () {
      return this.form.bizType === 1
        ? this.$t('tenantDialogs.recharge.electric')
        : this.$t('tenantDialogs.recharge.water')
    }
  },

  watch: {
    visible (val) {
      if (val) {
        this.initForm()
      }
    },

    // 🔥 监听租户数据变化，自动调整充值类型
    'tenantData.meterStatus' () {
      this.adjustBizType()
    },
    'tenantData.waterStatus' () {
      this.adjustBizType()
    }
  },

  methods: {
    // 格式化余额
    formatBalance (balance) {
      return '¥' + (balance || 0).toFixed(2)
    },

    // 初始化表单
    initForm () {
      this.form = {
        bizType: this.defaultBizType, // 🔥 使用计算出的默认值
        amount: null,
        remark: ''
      }
      this.$nextTick(() => {
        this.$refs.rechargeForm && this.$refs.rechargeForm.clearValidate()
      })
    },

    // 🔥 调整充值类型（当租户开户状态变化时）
    adjustBizType () {
      // 如果当前选择的类型不在可用选项中，自动切换到默认值
      const currentTypeAvailable = this.availableBizTypeOptions.some(
        option => option.value === this.form.bizType
      )

      if (!currentTypeAvailable) {
        this.form.bizType = this.defaultBizType
      }
    },

    // 关闭弹窗
    handleClose () {
      this.form = {
        bizType: 1,
        amount: null,
        remark: ''
      }
    },

    // 提交充值
    async handleSubmit () {
      this.$refs.rechargeForm.validate(async (valid) => {
        if (valid) {
          try {
            await this.$confirm(
              this.$t('tenantDialogs.recharge.confirmBody', {
                type: this.bizTypeText,
                amount: this.form.amount.toFixed(2)
              }),
              this.$t('tenantDialogs.recharge.confirmTitle'),
              {
                confirmButtonText: this.$t('tenantDialogs.recharge.confirm'),
                cancelButtonText: this.$t('tenantDialogs.recharge.cancel'),
                type: 'warning'
              }
            )

            this.submitting = true

            const params = {
              tradeType: 'TENANT_CHARGE',
              payChannel: 'PRIVATE_TO_PRIVATE',
              amount: this.form.amount,
              remark: this.form.remark,
              productCode: this.tenantData.id,
              userId: this.userId,
              bizType: this.form.bizType
            }

            const response = await payOfflineRechargePreOrder(params)

            if (response.code === 200) {
              this.$message.success(this.$t('tenantDialogs.recharge.msgSuccess'))
              this.$emit('success')
              this.dialogVisible = false
            } else {
              this.$message.error(response.msg || this.$t('tenantDialogs.recharge.msgFail'))
            }
          } catch (error) {
            if (error !== 'cancel') {
              this.$apiError.notify(error, this.$t('tenantDialogs.recharge.msgFail'))
              console.error('充值失败:', error)
            }
          } finally {
            this.submitting = false
          }
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.custom-dialog {
  ::v-deep .el-dialog__body {
    padding: 20px 20px 10px;
  }

  // 🔥 修改：直接设置按钮宽度
  ::v-deep .dialog-footer {
    .el-button {
      min-width: 80px;
      height: 40px;
      font-size: 15px;
      font-weight: 500;
    }
  }
}
</style>
