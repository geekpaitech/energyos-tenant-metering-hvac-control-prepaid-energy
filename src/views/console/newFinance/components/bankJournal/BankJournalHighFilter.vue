<template>
  <el-drawer
    :visible.sync="filterDrawer.show"
    :title="$t('bankJournalPage.drawerAdvancedFilter')"
    size="800px"
    append-to-body
    @close="closeDialog"
  >
    <div class="drawer_content">
      <el-form label-width="115px">
        <el-form-item :label="$t('bankJournalPage.lblTenantNameNo')">
          <el-select
            v-model="filterDrawer.query.tenantId"
            filterable
            clearable
            :placeholder="$t('bankJournalPage.phTenantNameOrNo')"
            style="width: 100%"
          >
            <el-option
              v-for="item in tenantOptions"
              :key="item.tenantId"
              :label="String(item.tenantId) + ' - ' + $displayBizHybrid(item.name || '')"
              :value="item.tenantId"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('bankJournalPage.lblRecvSubAccount')">
          <el-input v-model="filterDrawer.query.subAccount" clearable :placeholder="$t('bankJournalPage.phInput')" />
        </el-form-item>
        <el-form-item :label="$t('bankJournalPage.lblRemitterAccount')">
          <el-input v-model="filterDrawer.query.payeeName" clearable :placeholder="$t('bankJournalPage.phInput')" />
        </el-form-item>
        <el-form-item :label="$t('bankJournalPage.lblRemitterBankNo')">
          <el-input v-model="filterDrawer.query.bankNumber" clearable :placeholder="$t('bankJournalPage.phInput')" />
        </el-form-item>
        <el-form-item :label="$t('bankJournalPage.lblState')">
          <el-select v-model="filterDrawer.query.status" clearable :placeholder="$t('bankJournalPage.phSelect')" style="width: 100%">
            <el-option v-for="item in resolvedStatusOptions" :key="String(item.value)" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('bankJournalPage.lblBankKind')">
          <el-select v-model="filterDrawer.query.bankType" clearable :placeholder="$t('bankJournalPage.phSelect')" style="width: 100%">
            <el-option v-for="item in resolvedBankTypeOptions" :key="String(item.value)" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('bankJournalPage.lblDateRange')">
          <el-date-picker
            v-model="filterDrawer.query.timeRange"
            type="daterange"
            value-format="yyyy-MM-dd"
            range-separator="-"
            :start-placeholder="$t('bankJournalPage.phDateStart')"
            :end-placeholder="$t('bankJournalPage.phDateEnd')"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" icon="el-icon-search" @click="onSubmit">{{ $t('bankJournalPage.btnSearch') }}</el-button>
          <el-button size="small" icon="el-icon-refresh" @click="onDrawerReset">{{ $t('bankJournalPage.btnReset') }}</el-button>
        </el-form-item>
      </el-form>
    </div>
  </el-drawer>
</template>

<script>
import { BANK_TYPE_DEFS, STATUS_DEFS } from './bankJournalConstants'

export default {
  name: 'BankJournalHighFilter',
  props: {
    filterDrawer: {
      type: Object,
      required: true
    },
    tenantOptions: {
      type: Array,
      default: () => []
    },
    statusOptions: {
      type: Array,
      default: () => []
    },
    bankTypeOptions: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    resolvedStatusOptions () {
      if (this.statusOptions && this.statusOptions.length) return this.statusOptions
      return STATUS_DEFS.map((d) => ({
        value: d.value,
        label: this.$t(`bankJournalPage.${d.labelKey}`)
      }))
    },
    resolvedBankTypeOptions () {
      if (this.bankTypeOptions && this.bankTypeOptions.length) return this.bankTypeOptions
      return BANK_TYPE_DEFS.map((d) => ({
        value: d.value,
        label: this.$t(`bankJournalPage.${d.labelKey}`)
      }))
    }
  },
  methods: {
    closeDialog () {
      this.filterDrawer.show = false
    },
    onSubmit () {
      this.$emit('filter', { ...this.filterDrawer.query })
      this.closeDialog()
    },
    onDrawerReset () {
      this.$emit('reset')
      this.closeDialog()
    }
  }
}
</script>

<style lang="scss" scoped>
.drawer_content {
  padding: 0 16px 16px;
}
</style>
