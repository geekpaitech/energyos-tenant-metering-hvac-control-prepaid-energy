<template>
    <el-drawer
      :title="'提现详情'"
      :visible.sync="drawerVisible"
      direction="rtl"
      size="600px"
      :before-close="handleClose"
      class="withdraw-detail-drawer"
    >
      <div class="drawer-content">
        <el-descriptions :column="1" border label-class-name="detail-label">
          <el-descriptions-item label="流水号">
            {{ detailInfo.id || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="账单日期">
            {{ detailInfo.occurDate || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="结算日期">
            {{ detailInfo.createTime || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="提现日期">
            {{ detailInfo.updateTime || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="结算金额">
            <span v-if="detailInfo.withdAmount">
              ￥{{ formatMoney(detailInfo.withdAmount) }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="费率">
            <span v-if="detailInfo.tariff">
              {{ (detailInfo.tariff * 100).toFixed(2) }}%
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="手续费">
            <span v-if="detailInfo.handFee">
              ￥{{ formatMoney(detailInfo.handFee) }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="提现金额">
            <span v-if="detailInfo.balance" class="amount-value">
              ￥{{ formatMoney(detailInfo.balance) }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="银行开户行">
            {{ detailInfo.openingBank || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="银行账户">
            {{ detailInfo.bankNumber || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="提现方式">
            {{ getWithdrawTypeLabel(detailInfo.withdType) }}
          </el-descriptions-item>
          <el-descriptions-item label="资金类型">
            {{ getPayTypeLabel(detailInfo.payType) }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag
              :type="getStatusTagType(detailInfo.status)"
              size="small"
              effect="plain"
            >
              {{ getStatusLabel(detailInfo.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="备注">
            {{ detailInfo.remark || '-' }}
          </el-descriptions-item>
        </el-descriptions>
  
        <!-- 操作按钮 -->
        <div class="drawer-footer">
          <el-button @click="handleClose">关闭</el-button>
        </div>
      </div>
    </el-drawer>
  </template>
  
  <script>
  export default {
    name: 'WithdrawDetailDialog',
    props: {
      visible: {
        type: Boolean,
        default: false
      },
      data: {
        type: Object,
        default: () => ({})
      }
    },
    data() {
      return {
        detailInfo: {},
        // 提现方式
        withdrawTypeOptions: {
          0: { label: '线下' },
          1: { label: '线上' }
        },
        // 资金类型
        payTypeOptions: {
          0: { label: '私账' },
          1: { label: '公账' }
        },
        // 状态选项
        statusOptions: [
        { value: 0, label: '未提现' },
          { value: 3, label: '审核中' },
          { value: 4, label: '已提现' }
        ]
      }
    },
    computed: {
      drawerVisible: {
        get() {
          return this.visible
        },
        set(val) {
          this.$emit('update:visible', val)
        }
      }
    },
    watch: {
      data: {
        handler(val) {
          this.detailInfo = { ...val }
        },
        deep: true,
        immediate: true
      }
    },
    methods: {
      handleClose() {
        this.drawerVisible = false
      },
  
      formatMoney(value) {
        if (!value && value !== 0) return '0.00'
        return Number(value).toLocaleString('zh-CN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      },
  
      getStatusLabel(status) {
        const option = this.statusOptions.find(item => item.value === status)
        return option ? option.label : '-'
      },
  
      getStatusTagType(status) {
        const typeMap = {
          0: 'info',
          3: 'warning',
          4: 'primary'
        }
        return typeMap[status] || 'info'
      },
  
      getWithdrawTypeLabel(type) {
        return this.withdrawTypeOptions[type]?.label || '-'
      },
  
      getPayTypeLabel(type) {
        return this.payTypeOptions[type]?.label || '-'
      }
    }
  }
  </script>
  
  <style lang="scss" scoped>
  .withdraw-detail-drawer {
    ::v-deep .el-drawer__body {
      padding: 0;
    }
  }
  
  .drawer-content {
    padding: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
    
    ::v-deep .el-descriptions {
      flex: 1;
      
      .detail-label {
        background: #F5F7FA;
        width: 120px;
        font-weight: 600;
      }
      
      .amount-value {
        color: #F64C4C;
        font-weight: 600;
      }
    }
    
    .drawer-footer {
      padding-top: 20px;
      text-align: right;
      border-top: 1px solid #E8E8E8;
    }
  }
  </style>