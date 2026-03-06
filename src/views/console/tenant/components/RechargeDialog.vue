<template>
  <el-dialog
    title="手动充值"
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
      label-width="100px"
    >
      <!-- <el-form-item label="租户名">
        <el-input :value="tenantData.name" disabled />
      </el-form-item> -->
      
      <!-- <el-form-item label="租户ID">
        <el-input :value="tenantData.id" disabled />
      </el-form-item>
       -->
      <!-- 充值类型 - 根据开户情况动态显示 -->
      <el-form-item label="充值类型" prop="bizType">
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
      
      <el-form-item label="充值金额" prop="amount">
        <el-input-number
          v-model="form.amount"
          :min="0.01"
          :max="99999"
          :precision="2"
          placeholder="请输入充值金额"
          style="width: 100%"
        />
      </el-form-item>
      
      <el-form-item label="备注内容" prop="remark">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入备注内容"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <span slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button 
        type="primary" 
        :loading="submitting" 
        @click="handleSubmit"
      >
        {{ submitting ? '充值中...' : '确 定' }}
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
  data() {
    return {
      submitting: false,
      form: {
        bizType: 1,
        amount: null,
        remark: ''
      },
      rules: {
        bizType: [
          { required: true, message: '请选择充值类型', trigger: 'change' }
        ],
        amount: [
          { required: true, message: '请输入充值金额', trigger: 'blur' },
          { 
            type: 'number', 
            min: 0.01, 
            message: '充值金额不能小于0.01元', 
            trigger: 'blur' 
          }
        ],
        remark: [
          { required: true, message: '请输入备注内容', trigger: 'blur' }
        ]
      },
      // 完整的充值类型选项
      bizTypeOptions: [
        { value: 1, label: '电费' },
        { value: 2, label: '水费' }
      ]
    }
  },
  computed: {
    ...mapGetters('user', ['userId']),
    
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    },

    // 🔥 核心逻辑：判断租户开户情况
    hasElectricAccount() {
      // 电费专户开户：meterStatus === 1
      return this.tenantData.meterStatus === 1
    },

    hasWaterAccount() {
      // 水费专户开户：waterStatus === 1
      return this.tenantData.waterStatus === 1
    },

    // 🔥 根据开户情况动态生成可选项
    availableBizTypeOptions() {
      const hasElectric = this.hasElectricAccount
      const hasWater = this.hasWaterAccount

      // 情况1：两个都开户 → 显示两个选项
      if (hasElectric && hasWater) {
        return this.bizTypeOptions
      }

      // 情况2：只开电费 → 只显示电费
      if (hasElectric && !hasWater) {
        return [{ value: 1, label: '电费' }]
      }

      // 情况3：只开水费 → 只显示水费
      if (!hasElectric && hasWater) {
        return [{ value: 2, label: '水费' }]
      }

      // 情况4：都未开户 → 默认显示电费
      return [{ value: 1, label: '电费' }]
    },

    // 🔥 是否可以选择充值类型（只有两个都开户才能选）
    canSelectBizType() {
      return this.hasElectricAccount && this.hasWaterAccount
    },

    // 🔥 默认充值类型
    defaultBizType() {
      const hasElectric = this.hasElectricAccount
      const hasWater = this.hasWaterAccount

      // 优先级：电费 > 水费
      if (hasElectric) return 1
      if (hasWater) return 2
      return 1 // 都未开户默认电费
    },

    // 获取充值类型文本
    bizTypeText() {
      return this.form.bizType === 1 ? '电费' : '水费'
    }
  },

  watch: {
    visible(val) {
      if (val) {
        this.initForm()
      }
    },

    // 🔥 监听租户数据变化，自动调整充值类型
    'tenantData.meterStatus'() {
      this.adjustBizType()
    },
    'tenantData.waterStatus'() {
      this.adjustBizType()
    }
  },

  methods: {
    // 格式化余额
    formatBalance(balance) {
      return '¥' + (balance || 0).toFixed(2)
    },
    
    // 初始化表单
    initForm() {
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
    adjustBizType() {
      // 如果当前选择的类型不在可用选项中，自动切换到默认值
      const currentTypeAvailable = this.availableBizTypeOptions.some(
        option => option.value === this.form.bizType
      )
      
      if (!currentTypeAvailable) {
        this.form.bizType = this.defaultBizType
      }
    },
    
    // 关闭弹窗
    handleClose() {
      this.form = {
        bizType: 1,
        amount: null,
        remark: ''
      }
    },
    
    // 提交充值
    async handleSubmit() {
      this.$refs.rechargeForm.validate(async (valid) => {
        if (valid) {
          try {
            await this.$confirm(
              `确认充值${this.bizTypeText} ¥${this.form.amount.toFixed(2)} 吗？`, 
              '提示', 
              {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
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
              this.$message.success('充值成功')
              this.$emit('success')
              this.dialogVisible = false
            } else {
              this.$message.error(response.msg || '充值失败')
            }
          } catch (error) {
            if (error !== 'cancel') {
              this.$message.error('充值失败')
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