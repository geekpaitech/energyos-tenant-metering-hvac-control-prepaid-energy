<template>
  <el-dialog
    :title="$t('tenantDialogs.deduct.title')"
    :visible.sync="dialogVisible"
    width="480px"
    :close-on-click-modal="false"
    class="custom-dialog"
    @close="handleClose"
  >
    <el-form
      ref="deductForm"
      :model="form"
      :rules="rules"
      :label-width="dialogLabelWidth"
    >
      <el-form-item :label="$t('tenantDialogs.deduct.labelUseType')" prop="useType">
        <el-radio-group
          v-model="form.useType"
          :disabled="!canSelectUseType"
        >
          <el-radio
            v-for="item in availableUseTypeOptions"
            :key="item.value"
            :label="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item :label="$t('tenantDialogs.deduct.labelBillDate')" prop="billDate">
        <el-date-picker
          v-model="form.billDate"
          type="date"
          :placeholder="$t('tenantDialogs.deduct.phBillDate')"
          value-format="yyyy-MM-dd"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item :label="$t('tenantDialogs.deduct.labelAmount')" prop="amount">
        <el-input-number
          v-model="form.amount"
          :min="0.01"
          :max="99999"
          :precision="2"
          :placeholder="$t('tenantDialogs.deduct.phAmount')"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item :label="$t('tenantDialogs.deduct.labelRemark')" prop="remark">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          :placeholder="$t('tenantDialogs.deduct.phRemark')"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <span slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">{{ $t('tenantDialogs.deduct.cancel') }}</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        @click="handleSubmit"
      >
        {{ submitting ? $t('tenantDialogs.deduct.submitting') : $t('tenantDialogs.deduct.confirm') }}
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
import { manualDebit } from '@/api/pay'

export default {
  name: 'DeductDialog',
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
        useType: 2, // 🔥 默认电费改为2
        billDate: '',
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
        useType: [
          { required: true, message: this.$t('tenantDialogs.deduct.ruleUseType'), trigger: 'change' }
        ],
        billDate: [
          { required: true, message: this.$t('tenantDialogs.deduct.ruleBillDate'), trigger: 'change' }
        ],
        amount: [
          { required: true, message: this.$t('tenantDialogs.deduct.ruleAmount'), trigger: 'blur' },
          {
            type: 'number',
            min: 0.01,
            message: this.$t('tenantDialogs.deduct.ruleAmountMin'),
            trigger: 'blur'
          }
        ],
        remark: [
          { required: true, message: this.$t('tenantDialogs.deduct.ruleRemark'), trigger: 'blur' }
        ]
      }
    },
    useTypeOptions () {
      return [
        { value: 2, label: this.$t('tenantDialogs.deduct.electric') },
        { value: 0, label: this.$t('tenantDialogs.deduct.water') }
      ]
    },
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
      return this.tenantData.meterStatus === 1
    },

    hasWaterAccount () {
      return this.tenantData.waterStatus === 1
    },

    // 🔥 根据开户情况动态生成可选项
    availableUseTypeOptions () {
      const hasElectric = this.hasElectricAccount
      const hasWater = this.hasWaterAccount

      // 情况1：两个都开户 → 显示两个选项
      if (hasElectric && hasWater) {
        return this.useTypeOptions
      }

      // 情况2：只开电费 → 只显示电费
      if (hasElectric && !hasWater) {
        return [{ value: 2, label: this.$t('tenantDialogs.deduct.electric') }]
      }

      // 情况3：只开水费 → 只显示水费
      if (!hasElectric && hasWater) {
        return [{ value: 0, label: this.$t('tenantDialogs.deduct.water') }]
      }

      // 情况4：都未开户 → 默认显示电费
      return [{ value: 2, label: this.$t('tenantDialogs.deduct.electric') }]
    },

    // 🔥 是否可以选择扣款类型（只有两个都开户才能选）
    canSelectUseType () {
      return this.hasElectricAccount && this.hasWaterAccount
    },

    // 🔥 默认扣款类型
    defaultUseType () {
      const hasElectric = this.hasElectricAccount
      const hasWater = this.hasWaterAccount

      // 优先级：电费 > 水费
      if (hasElectric) return 2 // 🔥 电费改为2
      if (hasWater) return 0 // 🔥 水费改为0
      return 2 // 都未开户默认电费
    },

    // 🔥 获取扣款类型文本
    useTypeText () {
      return this.form.useType === 2
        ? this.$t('tenantDialogs.deduct.electric')
        : this.$t('tenantDialogs.deduct.water')
    }
  },

  watch: {
    visible (val) {
      if (val) {
        this.initForm()
      }
    },

    // 🔥 监听租户数据变化，自动调整扣款类型
    'tenantData.meterStatus' () {
      this.adjustUseType()
    },
    'tenantData.waterStatus' () {
      this.adjustUseType()
    }
  },

  methods: {
    // 初始化表单
    initForm () {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')

      this.form = {
        useType: this.defaultUseType, // 🔥 使用计算出的默认值
        billDate: `${year}-${month}-${day}`,
        amount: null,
        remark: ''
      }
      this.$nextTick(() => {
        this.$refs.deductForm && this.$refs.deductForm.clearValidate()
      })
    },

    // 🔥 调整扣款类型（当租户开户状态变化时）
    adjustUseType () {
      const currentTypeAvailable = this.availableUseTypeOptions.some(
        option => option.value === this.form.useType
      )

      if (!currentTypeAvailable) {
        this.form.useType = this.defaultUseType
      }
    },

    // 关闭弹窗
    handleClose () {
      this.form = {
        useType: 2,
        billDate: '',
        amount: null,
        remark: ''
      }
    },

    // 提交扣款
    async handleSubmit () {
      this.$refs.deductForm.validate(async (valid) => {
        if (valid) {
          try {
            await this.$confirm(
              this.$t('tenantDialogs.deduct.confirmBody', {
                type: this.useTypeText,
                amount: Number(this.form.amount).toFixed(2)
              }),
              this.$t('tenantDialogs.deduct.confirmTitle'),
              {
                confirmButtonText: this.$t('tenantDialogs.deduct.confirm'),
                cancelButtonText: this.$t('tenantDialogs.deduct.cancel'),
                type: 'warning'
              }
            )

            this.submitting = true

            const params = {
              amount: this.form.amount,
              billDate: this.form.billDate,
              remark: this.form.remark,
              tenantId: this.tenantData.id,
              tenantName: this.tenantData.name,
              useType: this.form.useType
            }

            const response = await manualDebit(params)

            if (response.code === 200) {
              this.$message.success(this.$t('tenantDialogs.deduct.msgSuccess'))
              this.$emit('success')
              this.dialogVisible = false
            } else {
              this.$message.error(response.msg || this.$t('tenantDialogs.deduct.msgFail'))
            }
          } catch (error) {
            if (error !== 'cancel') {
              this.$apiError.notify(error, this.$t('tenantDialogs.deduct.msgFail'))
              console.error('扣款失败:', error)
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
