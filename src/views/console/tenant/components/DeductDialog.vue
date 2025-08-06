<template>
    <el-dialog
      title="手动扣款"
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
        label-width="100px"
      >
        <el-form-item label="租户名">
          <el-input :value="tenantData.name" disabled />
        </el-form-item>
        
        <el-form-item label="租户ID">
          <el-input :value="tenantData.id" disabled />
        </el-form-item>
        
        <el-form-item label="扣款类型" prop="debitType">
          <el-select
            v-model="form.debitType"
            placeholder="请选择扣款类型"
            style="width: 100%"
          >
            <el-option
              v-for="item in debitTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="扣款金额" prop="amount">
          <el-input-number
            v-model="form.amount"
            :min="0.01"
            :max="99999"
            :precision="2"
            placeholder="请输入扣款金额"
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
          {{ submitting ? '扣款中...' : '确 定' }}
        </el-button>
      </span>
    </el-dialog>
  </template>
  
  <script>
  import { payPreOrder } from '@/api/pay'
  import { mapGetters } from 'vuex'
  
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
    data() {
      return {
        submitting: false,
        form: {
          debitType: 'INITIAL_ARREARS',
          amount: null,
          remark: ''
        },
        rules: {
          debitType: [
            { required: true, message: '请选择扣款类型', trigger: 'change' }
          ],
          amount: [
            { required: true, message: '请输入扣款金额', trigger: 'blur' },
            { 
              type: 'number', 
              min: 0.01, 
              message: '扣款金额不能小于0.01元', 
              trigger: 'blur' 
            }
          ],
          remark: [
            { required: true, message: '请输入备注内容', trigger: 'blur' }
          ]
        },
        // 扣款类型选项
        debitTypeOptions: [
          { value: 'INITIAL_ARREARS', label: '初期欠费' },
          { value: 'ELECTRICITY_FEE', label: '电费' },
          { value: 'WATER_FEE', label: '水费' },
          { value: 'PROPERTY_FEE', label: '物业费' },
          { value: 'OTHER_FEE', label: '其他费用' }
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
      // 初始化表单
      initForm() {
        this.form = {
          debitType: 'INITIAL_ARREARS',
          amount: null,
          remark: ''
        }
        this.$nextTick(() => {
          this.$refs.deductForm && this.$refs.deductForm.clearValidate()
        })
      },
      
      // 关闭弹窗
      handleClose() {
        this.form = {
          debitType: 'INITIAL_ARREARS',
          amount: null,
          remark: ''
        }
      },
      
      // 提交扣款
      async handleSubmit() {
        this.$refs.deductForm.validate(async (valid) => {
          if (valid) {
            try {
              await this.$confirm('确认扣款？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
              })
              
              this.submitting = true
              
              const params = {
                debitType: this.form.debitType,
                amount: this.form.amount,
                remark: this.form.remark,
                userId: this.userId,
                productCode: this.tenantData.id,
                payChannel: 'DEDUCTION',
                tradeType: 'TENANT_DEDUCTION'
              }
              
              const response = await payPreOrder(params)
              
              if (response.code === 200) {
                this.$message.success('扣款成功')
                this.$emit('success')
                this.dialogVisible = false
              } else {
                this.$message.error(response.msg || '扣款失败')
              }
            } catch (error) {
              if (error !== 'cancel') {
                this.$message.error('扣款失败')
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
  }
  </style>