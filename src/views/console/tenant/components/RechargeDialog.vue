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
        <el-form-item label="租户名">
          <el-input :value="tenantData.name" disabled />
        </el-form-item>
        
        <el-form-item label="账户余额">
          <el-input 
            :value="formatBalance(tenantData.balance)" 
            disabled 
          />
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
  import { payPreOrder, payOfflineRechargePreOrder } from '@/api/pay'
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
          amount: null,
          remark: ''
        },
        rules: {
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
        }
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
      }
    },
    watch: {
      visible(val) {
        if (val) {
          this.initForm()
        }
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
          amount: null,
          remark: ''
        }
        this.$nextTick(() => {
          this.$refs.rechargeForm && this.$refs.rechargeForm.clearValidate()
        })
      },
      
      // 关闭弹窗
      handleClose() {
        this.form = {
          amount: null,
          remark: ''
        }
      },
      
      // 提交充值
      async handleSubmit() {
        this.$refs.rechargeForm.validate(async (valid) => {
          if (valid) {
            try {
              await this.$confirm('确认充值？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
              })
              
              this.submitting = true
              
              const params = {
                tradeType: 'TENANT_CHARGE',
                payChannel: 'PRIVATE_TO_PRIVATE',
                amount: this.form.amount,
                remark: this.form.remark,
                productCode: this.tenantData.id,
                userId: this.userId
              }
              
              // 根据实际情况选择使用哪个接口
              const response = await payPreOrder(params)
              
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
  }
  </style>