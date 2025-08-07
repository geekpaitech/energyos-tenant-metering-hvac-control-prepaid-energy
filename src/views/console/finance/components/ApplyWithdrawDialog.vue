<template>
    <el-dialog
      :title="'申请提现'"
      :visible.sync="dialogVisible"
      width="650px"
      :close-on-click-modal="false"
      :before-close="handleClose"
      class="apply-withdraw-dialog"
    >
      <div class="dialog-content">
        <!-- 金额计算展示 -->
        <div class="amount-calculation">
          <div class="amount-item">
            <div class="amount-label">实际提现金额</div>
            <div class="amount-value primary">
              ￥{{ formatMoney(summaryInfo.totalWithdAmt) }}
            </div>
          </div>
          
          <div class="amount-symbol" v-if="showCalculation">=</div>
          
          <div class="amount-item" v-if="showCalculation">
            <div class="amount-label">实际结算金额</div>
            <div class="amount-value">
              ￥{{ formatMoney(summaryInfo.realSettleAmt) }}
            </div>
          </div>
          
          <div class="amount-symbol" v-if="showCalculation">-</div>
          
          <div class="amount-item" v-if="showCalculation">
            <div class="amount-label">手续费</div>
            <div class="amount-value">
              ￥{{ formatMoney(summaryInfo.totalHandFeeAmt) }}
            </div>
          </div>
        </div>
  
        <!-- 手续费提示 -->
        <div class="fee-tip" v-if="summaryInfo.totalHandFeeAmt > 0">
          <i class="el-icon-warning-outline"></i>
          <span v-if="withdAmtType === 0">
            本次提现产生手续费￥{{ formatMoney(summaryInfo.totalHandFeeAmt) }}，不在本次提现时扣除。
          </span>
          <span v-else>
            提现时将自动扣除手续费
          </span>
        </div>
  
        <!-- 手续费抵用券 -->
        <div class="voucher-section" v-if="voucherData.voucherAmt > 0">
          <el-checkbox v-model="useVoucher" @change="handleVoucherChange">
            使用"手续费抵用券"（余额：￥{{ formatMoney(voucherData.voucherAmt) }}）
          </el-checkbox>
        </div>
  
        <!-- 打款账户信息 -->
        <div class="account-info">
          <div class="info-title">打款账户</div>
          <el-form label-width="90px" label-position="left">
            <el-form-item label="账户名称：">
              {{ summaryInfo.payeeName || '-' }}
            </el-form-item>
            <el-form-item label="开户银行：">
              {{ summaryInfo.openBank || '-' }}
            </el-form-item>
            <el-form-item label="银行账户：">
              {{ summaryInfo.bankNumber || '-' }}
            </el-form-item>
          </el-form>
        </div>
  
        <!-- 设备欠费提示 -->
        <div class="warning-tip" v-if="!canWithdraw">
          <i class="el-icon-warning"></i>
          您的设备已欠费，请
          <el-link type="primary" @click="goToRecharge">续费</el-link>
          恢复提现功能
        </div>
      </div>
  
      <span slot="footer" class="dialog-footer">
        <el-button @click="handleClose">取 消</el-button>
        <el-button 
          type="primary" 
          @click="handleConfirm"
          :loading="submitting"
          :disabled="!canWithdraw"
        >
          确 认
        </el-button>
      </span>
    </el-dialog>
  </template>
  
  <script>
  import { getWithdrawSummary, applyWithdraw, checkCanWithdraw } from '@/api/tenantRefund'
  
  export default {
    name: 'ApplyWithdrawDialog',
    props: {
      visible: {
        type: Boolean,
        default: false
      },
      data: {
        type: Object,
        default: () => ({})
      },
      voucherData: {
        type: Object,
        default: () => ({})
      }
    },
    data() {
      return {
        useVoucher: false,
        summaryInfo: {},
        canWithdraw: true,
        submitting: false,
        withdAmtType: 1 // 0: 不扣除手续费, 1: 扣除手续费
      }
    },
    computed: {
      dialogVisible: {
        get() {
          return this.visible
        },
        set(val) {
          this.$emit('update:visible', val)
        }
      },
      showCalculation() {
        return this.withdAmtType === 1
      }
    },
    watch: {
      visible(val) {
        if (val) {
          this.init()
        }
      }
    },
    methods: {
      async init() {
        this.useVoucher = false
        await this.checkWithdrawStatus()
        await this.loadSummaryInfo()
      },
  
      // 检查是否可提现
      async checkWithdrawStatus() {
        try {
          const response = await checkCanWithdraw({
            managerId: this.data.managerId
          })
          if (response.code === 200) {
            this.canWithdraw = response.data
          }
        } catch (error) {
          console.error('检查提现状态失败:', error)
        }
      },
  
      // 加载汇总信息
      async loadSummaryInfo() {
        try {
          const response = await getWithdrawSummary({
            withdApplyIds: this.data.withdApplyIds.join(','),
            managerId: this.data.managerId,
            isUserVoucher: this.useVoucher,
            auditSumyId: ''
          })
          
          if (response.code === 200) {
            this.summaryInfo = response.data || {}
          }
        } catch (error) {
          console.error('加载汇总信息失败:', error)
        }
      },
  
      // 使用抵用券变化
      handleVoucherChange() {
        this.loadSummaryInfo()
      },
  
      // 确认提现
      async handleConfirm() {
        try {
          await this.$confirm('确认提交提现申请?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          })
  
          this.submitting = true
          
          const params = {
            withdApplyIds: this.data.withdApplyIds.join(','),
            managerId: this.data.managerId,
            ...this.summaryInfo
          }
          
          const response = await applyWithdraw(params)
          
          if (response.code === 200) {
            this.$message.success('提现申请提交成功')
            this.$emit('success')
            this.handleClose()
          } else {
            this.$message.error(response.msg || '提交失败')
          }
        } catch (error) {
          if (error !== 'cancel') {
            this.$message.error('提交失败')
            console.error('提交失败:', error)
          }
        } finally {
          this.submitting = false
        }
      },
  
      // 关闭弹窗
      handleClose() {
        this.dialogVisible = false
      },
  
      // 跳转充值
      goToRecharge() {
        this.$router.push('/expense-capital')
      },
  
      // 格式化金额
      formatMoney(value) {
        if (!value && value !== 0) return '0.00'
        return Number(value).toLocaleString('zh-CN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      }
    }
  }
  </script>
  
  <style lang="scss" scoped>
  .apply-withdraw-dialog {
    ::v-deep .el-dialog__body {
      padding: 20px 30px;
    }
  }
  
  .dialog-content {
    .amount-calculation {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px;
      background: #F5F7FA;
      border-radius: 4px;
      margin-bottom: 20px;
      
      .amount-item {
        flex: 1;
        text-align: center;
        
        .amount-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }
        
        .amount-value {
          font-size: 24px;
          font-weight: 600;
          color: #333;
          
          &.primary {
            color: #F64C4C;
          }
        }
      }
      
      .amount-symbol {
        width: 40px;
        text-align: center;
        font-size: 20px;
        color: #999;
      }
    }
    
    .fee-tip {
      padding: 12px 16px;
      background: #FFF7E6;
      border: 1px solid #FFE5B4;
      border-radius: 4px;
      margin-bottom: 16px;
      color: #FF9500;
      font-size: 13px;
      
      i {
        margin-right: 6px;
      }
    }
    
    .voucher-section {
      margin-bottom: 20px;
      
      ::v-deep .el-checkbox__label {
        color: #F64C4C;
      }
    }
    
    .account-info {
      border: 1px solid #E8E8E8;
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 20px;
      
      .info-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin-bottom: 16px;
        padding-bottom: 10px;
        border-bottom: 1px solid #E8E8E8;
      }
      
      ::v-deep .el-form-item {
        margin-bottom: 12px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .el-form-item__label {
          color: #666;
        }
        
        .el-form-item__content {
          color: #333;
        }
      }
    }
    
    .warning-tip {
      padding: 12px;
      background: #FFF0F0;
      border: 1px solid #FFCCCC;
      border-radius: 4px;
      color: #F56C6C;
      font-size: 13px;
      text-align: center;
      
      i {
        margin-right: 6px;
      }
    }
  }
  </style>