<template>
  <el-drawer
    :visible.sync="drawerVisible"
    direction="rtl"
    size="560px"
    :before-close="handleClose"
    class="tenant-refund-detail-drawer"
  >
    <div slot="title" class="drawer-title">{{ $t('tenantRefundPage.detailTitle') }}</div>

    <div
      v-loading="loading"
      class="drawer-content"
    >
      <div class="summary-card">
        <div class="summary-main">
          <div class="summary-title">{{ $displayBizHybrid(detailInfo.tenantName) || '--' }}</div>
          <div class="summary-subtitle">{{ $t('tenantRefundPage.detailSeqInline') }}{{ detailInfo.rid || '-' }}</div>
        </div>
        <el-tag :type="statusTagType" effect="plain" size="small">
          {{ statusLabel }}
        </el-tag>
      </div>

      <el-descriptions :column="1" border label-class-name="detail-label">
        <el-descriptions-item :label="$t('tenantRefundPage.detailLblRid')">
          {{ detailInfo.rid || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('tenantRefundPage.detailLblTenantId')">
          {{ detailInfo.tenantId || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('tenantRefundPage.detailLblTenantName')">
          {{ $displayBizHybrid(detailInfo.tenantName) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('tenantRefundPage.detailLblManagerName')">
          {{ detailInfo.managerName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('tenantRefundPage.detailLblBizType')">
          {{ bizTypeLabel }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('tenantRefundPage.detailLblPayeeName')">
          {{ detailInfo.payeeName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('tenantRefundPage.detailLblBankNumber')">
          {{ detailInfo.bankNumber || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('tenantRefundPage.detailLblOpeningBank')">
          {{ detailInfo.openingBank || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('tenantRefundPage.detailLblProjectReviewer')">
          {{ detailInfo.projectReviewAct || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('tenantRefundPage.detailLblApplyTime')">
          {{ detailInfo.applyTime || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('tenantRefundPage.detailLblProcessTime')">
          {{ detailInfo.processTime || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('tenantRefundPage.detailLblRefundTime')">
          {{ detailInfo.refundTime || detailInfo.refundDate || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('tenantRefundPage.detailLblRealCash')">
          <span class="money-value">{{ formatMoney(detailInfo.realAmt) }}</span>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('tenantRefundPage.detailLblApplyAmt')">
          <span class="money-value">{{ formatMoney(detailInfo.applyAmt) }}</span>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('tenantRefundPage.detailLblActualAmt')">
          <span class="money-value">{{ formatMoney(detailInfo.actualAmt) }}</span>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('tenantRefundPage.detailLblAuditStatus')">
          <el-tag :type="statusTagType" effect="plain" size="small">
            {{ statusLabel }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="detailInfo.refuseMsg" :label="$t('tenantRefundPage.detailLblRefuseMsg')">
          {{ detailInfo.refuseMsg }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="drawer-footer">
        <el-button @click="handleClose">{{ $t('tenantRefundPage.btnClose') }}</el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script>
export default {
  name: 'TenantRefundDetailDrawer',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    detailInfo: {
      type: Object,
      default: () => ({})
    },
    refundStatusMap: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    drawerVisible: {
      get () {
        return this.visible
      },
      set (val) {
        this.$emit('update:visible', val)
      }
    },
    statusLabel () {
      return this.refundStatusMap[this.detailInfo.refundStatus]?.label || '-'
    },
    bizTypeLabel () {
      const labelMap = {
        1: this.$t('tenantRefundPage.bizElectric'),
        2: this.$t('tenantRefundPage.bizWater')
      }
      return labelMap[Number(this.detailInfo.bizType)] || '-'
    },
    statusTagType () {
      const status = Number(this.detailInfo.refundStatus)
      const typeMap = {
        0: 'warning',
        1: 'danger',
        2: 'primary',
        3: 'success',
        4: 'warning',
        5: 'danger',
        6: 'info'
      }
      return typeMap[status] || 'info'
    }
  },
  methods: {
    handleClose () {
      this.drawerVisible = false
    },
    formatMoney (value) {
      if (value === null || value === undefined || value === '') return '-'
      return `￥${Number(value).toFixed(2)}`
    }
  }
}
</script>

<style lang="scss" scoped>
.tenant-refund-detail-drawer {
  ::v-deep .el-drawer__header {
    margin-bottom: 0;
    padding: 20px;
    border-bottom: 1px solid #ebeef5;
  }

  ::v-deep .el-drawer__body {
    overflow: hidden;
  }
}

.drawer-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.drawer-content {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.summary-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 16px 18px;
  border-radius: 8px;
  background: #f5f7fa;
}

.summary-title {
  margin-bottom: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.summary-subtitle {
  font-size: 13px;
  color: #909399;
}

.money-value {
  color: #303133;
  font-weight: 600;
}

.drawer-footer {
  margin-top: 20px;
  padding-top: 16px;
  text-align: right;
  border-top: 1px solid #ebeef5;
}
</style>
