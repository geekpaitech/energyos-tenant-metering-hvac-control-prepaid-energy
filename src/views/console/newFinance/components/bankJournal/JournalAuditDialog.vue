<template>
  <el-dialog
    :title="$t('bankJournalPage.dialogAuditTitle')"
    :visible.sync="auditDialog.show"
    width="720px"
    append-to-body
    :close-on-click-modal="false"
    @open="initDialog"
    @close="closeDialog"
  >
    <el-form label-width="110px" class="audit-form">
      <div class="remit-box">
        <el-form-item :label="$t('bankJournalPage.lblPayeeName')">
          <span>{{ auditDialog.data.payeeName }}</span>
        </el-form-item>
        <el-form-item :label="$t('bankJournalPage.lblBankNumber')">
          <span>{{ auditDialog.data.bankNumber }}</span>
        </el-form-item>
        <el-form-item :label="$t('bankJournalPage.lblAmountYuan')">
          <span>{{ formatMoney(auditDialog.data.balance) }}</span>
        </el-form-item>
        <el-form-item :label="$t('bankJournalPage.lblSeqNo')">
          <span>{{ auditDialog.data.seqNo }}</span>
        </el-form-item>
      </div>

      <el-form-item :label="$t('bankJournalPage.lblTenantPick')" class="search-row">
        <el-select
          v-model="queryData.tenantId"
          filterable
          clearable
          :placeholder="$t('bankJournalPage.phSearchTenant')"
          style="width: 100%"
          size="small"
          @change="onTenantIdChange"
        >
          <el-option
            v-for="item in dropdownTenantOptions"
            :key="String(item.tenantId)"
            :label="String(item.tenantId) + ' - ' + $displayBizHybrid(item.name || '')"
            :value="item.tenantId"
          />
        </el-select>
      </el-form-item>

      <div v-if="queryData.tenantId" v-loading="accountLoading" class="biz-type-section">
        <template v-if="accountState === 'both'">
          <div class="account-pick">
            <div class="account-pick-head">
              <span class="required-mark">*</span>
              <span class="account-pick-title">{{ $t('bankJournalPage.bizPickTitle') }}</span>
            </div>
            <p class="account-pick-desc">
              {{
                $t('bankJournalPage.bizPickDesc', {
                  electric: $t('bankJournalPage.accountElectricLedger'),
                  water: $t('bankJournalPage.accountWaterLedger')
                })
              }}
            </p>
            <div class="account-cards">
              <div
                class="account-card"
                :class="{ active: bizType === 1 }"
                role="button"
                tabindex="0"
                @click="bizType = 1"
                @keydown.enter.prevent="bizType = 1"
              >
                <div class="account-card-head">
                  <span class="account-card-name">{{ $t('bankJournalPage.accountElectricLedger') }}</span>
                  <i v-if="bizType === 1" class="el-icon-circle-check account-card-badge" />
                </div>
                <p class="account-card-sub">{{ $t('bankJournalPage.cardElectricDesc') }}</p>
              </div>
              <div
                class="account-card"
                :class="{ active: bizType === 2 }"
                role="button"
                tabindex="0"
                @click="bizType = 2"
                @keydown.enter.prevent="bizType = 2"
              >
                <div class="account-card-head">
                  <span class="account-card-name">{{ $t('bankJournalPage.accountWaterLedger') }}</span>
                  <i v-if="bizType === 2" class="el-icon-circle-check account-card-badge" />
                </div>
                <p class="account-card-sub">{{ $t('bankJournalPage.cardWaterDesc') }}</p>
              </div>
            </div>
          </div>
        </template>
        <template v-else-if="accountState === 'meter'">
          <div class="account-single">
            <i class="el-icon-info account-single-icon" />
            <div class="account-single-body">
              <div class="account-single-title">{{ $t('bankJournalPage.rechargeTypeTitle') }}</div>
              <p class="account-single-text">{{ $t('bankJournalPage.singleMeterOnly') }}</p>
            </div>
          </div>
        </template>
        <template v-else-if="accountState === 'water'">
          <div class="account-single">
            <i class="el-icon-info account-single-icon" />
            <div class="account-single-body">
              <div class="account-single-title">{{ $t('bankJournalPage.rechargeTypeTitle') }}</div>
              <p class="account-single-text">{{ $t('bankJournalPage.singleWaterOnly') }}</p>
            </div>
          </div>
        </template>
        <template v-else-if="accountState === 'none' && !accountLoading">
          <el-alert
            :title="$t('bankJournalPage.alertNoMeterWaterAccount')"
            type="warning"
            :closable="false"
            show-icon
          />
        </template>
      </div>
      <div v-else class="biz-type-placeholder muted">{{ $t('bankJournalPage.selectTenantFirstHint') }}</div>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="closeDialog">{{ $t('bankJournalPage.btnCancel') }}</el-button>
      <el-button type="primary" :disabled="submitDisabled" @click="onSubmit">{{ $t('bankJournalPage.btnConfirm') }}</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { pufaBankNumTenantList, pufaHandleRechangeStatus } from '@/api/bankEnterpriseDirect'
import { tenantGetById } from '@/api/tenant'

export default {
  name: 'JournalAuditDialog',
  props: {
    auditDialog: {
      type: Object,
      required: true
    },
    tenantOptions: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      bankMatchRows: [],
      queryData: {
        tenantId: ''
      },
      accountLoading: false,
      tenantDetail: null,
      bizType: null
    }
  },
  computed: {
    /** 下拉：项目租户 + 银行匹配推荐，按 tenantId 去重 */
    dropdownTenantOptions () {
      const m = new Map()
      const add = (tenantId, name) => {
        if (tenantId === '' || tenantId === null || tenantId === undefined) return
        const key = String(tenantId)
        if (!m.has(key)) m.set(key, { tenantId, name: name || '' })
      }
      ;(this.tenantOptions || []).forEach((t) => add(t.tenantId, t.name))
      this.bankMatchRows.forEach((r) => add(r.tenantId, r.tenantName))
      return [...m.values()]
    },
    hasMeterAccount () {
      return this.tenantDetail != null && this.tenantDetail.meterAccountDto != null
    },
    hasWaterAccount () {
      return this.tenantDetail != null && this.tenantDetail.waterAccountDto != null
    },
    /** both | meter | water | none */
    accountState () {
      if (!this.queryData.tenantId || !this.tenantDetail) return ''
      const m = this.hasMeterAccount
      const w = this.hasWaterAccount
      if (m && w) return 'both'
      if (m) return 'meter'
      if (w) return 'water'
      return 'none'
    },
    submitDisabled () {
      if (!this.queryData.tenantId) return true
      if (this.accountLoading) return true
      if (this.accountState === 'none') return true
      return this.bizType !== 1 && this.bizType !== 2
    }
  },
  methods: {
    formatMoney (v) {
      if (v === null || v === undefined || v === '') return '-'
      return Number(v).toFixed(2)
    },
    onTenantIdChange (val) {
      this.applyTenantAccounts(val)
    },
    initDialog () {
      this.getParamsData()
    },
    closeDialog () {
      this.queryData.tenantId = ''
      this.bankMatchRows = []
      this.tenantDetail = null
      this.bizType = null
      this.auditDialog.show = false
    },
    async getParamsData () {
      try {
        const res = await pufaBankNumTenantList({
          payeeName: this.auditDialog.data.payeeName,
          bankNumber: this.auditDialog.data.bankNumber
        })
        if (res.code === 200 && res.data) {
          let raw = []
          if (Array.isArray(res.data)) raw = res.data
          else if (Array.isArray(res.data.dataList)) raw = res.data.dataList
          this.bankMatchRows = raw.map((row) => ({
            managerName: row.managerName,
            tenantId: row.tenantId != null ? row.tenantId : row.id,
            tenantName: row.tenantName != null ? row.tenantName : row.name
          }))
        } else {
          this.bankMatchRows = []
        }
      } catch (e) {
        this.$message.error(e.msg || this.$t('bankJournalPage.msgBankMatchFail'))
        this.bankMatchRows = []
      }
    },
    async applyTenantAccounts (tenantId) {
      this.tenantDetail = null
      this.bizType = null
      if (tenantId === '' || tenantId === null || tenantId === undefined) return
      this.accountLoading = true
      try {
        const res = await tenantGetById({ id: tenantId })
        if (res.code !== 200 || !res.data) {
          this.$message.warning(res.msg || this.$t('bankJournalPage.msgTenantWalletFail'))
          return
        }
        const detail = res.data
        this.tenantDetail = detail
        const hasM = detail.meterAccountDto != null
        const hasW = detail.waterAccountDto != null
        if (hasM && hasW) this.bizType = 1
        else if (hasM) this.bizType = 1
        else if (hasW) this.bizType = 2
        else this.bizType = null
      } catch (e) {
        this.$message.error(e.msg || this.$t('bankJournalPage.msgTenantWalletFail'))
      } finally {
        this.accountLoading = false
      }
    },
    async onSubmit () {
      if (this.submitDisabled) {
        if (!this.queryData.tenantId) this.$message.warning(this.$t('bankJournalPage.msgPickTenant'))
        else if (this.accountState === 'none') this.$message.warning(this.$t('bankJournalPage.msgNoWalletBook'))
        else this.$message.warning(this.$t('bankJournalPage.msgPickRechargeType'))
        return
      }
      try {
        await this.$confirm(this.$t('bankJournalPage.confirmApprove'), this.$t('bankJournalPage.confirmTitle'), {
          type: 'warning',
          confirmButtonText: this.$t('bankJournalPage.confirmOk'),
          cancelButtonText: this.$t('bankJournalPage.confirmCancel')
        })
        const res = await pufaHandleRechangeStatus({
          id: this.auditDialog.data.id,
          tenantId: this.queryData.tenantId,
          bizType: this.bizType
        })
        if (res.code === 200) {
          this.$message.success(res.msg || this.$t('bankJournalPage.msgOpSuccess'))
          this.closeDialog()
          this.$emit('search')
        }
      } catch (e) {
        if (e !== 'cancel' && e.msg) this.$message.error(e.msg)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.remit-box {
  padding-bottom: 8px;
  margin-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}
.search-row {
  margin-bottom: 8px;
}
.tenant-table {
  margin-bottom: 16px;
}
.biz-type-section {
  min-height: 48px;
  margin-top: 8px;
}
.biz-type-placeholder {
  padding: 8px 0 4px;
  font-size: 13px;
}
.muted {
  color: #909399;
}

.account-pick {
  padding: 12px 14px;
  background: #fafbfc;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}
.account-pick-head {
  margin-bottom: 6px;
}
.required-mark {
  color: #f56c6c;
  margin-right: 4px;
  font-weight: 600;
}
.account-pick-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
.account-pick-desc {
  margin: 0 0 14px;
  font-size: 13px;
  color: #606266;
  line-height: 1.55;
}
.account-cards {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.account-card {
  flex: 1 1 200px;
  min-height: 88px;
  padding: 14px 16px;
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  outline: none;
}
.account-card:hover {
  border-color: #c0c4cc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.account-card.active {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.2);
}
.account-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.account-card-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.account-card-badge {
  font-size: 20px;
  color: #67c23a;
}
.account-card-sub {
  margin: 8px 0 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.45;
}

.account-single {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  background: #f4f9ff;
  border: 1px solid #d9ecff;
  border-radius: 8px;
}
.account-single-icon {
  font-size: 18px;
  color: #409eff;
  margin-top: 2px;
}
.account-single-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}
.account-single-text {
  margin: 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}
</style>
