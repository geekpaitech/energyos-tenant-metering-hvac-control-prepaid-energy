<template>
  <el-dialog
    :title="$t('bankJournalPage.dialogRefundTitle')"
    :visible.sync="refundDialog.show"
    width="515px"
    append-to-body
    :close-on-click-modal="false"
    @close="closeDialog"
  >
    <el-form ref="formRef" :model="queryData" :rules="rules" label-width="110px">
      <div class="remit-box">
        <el-form-item :label="$t('bankJournalPage.lblRefundAmount')">
          <span>{{ formatMoney(refundDialog.data.balance) }}</span>
        </el-form-item>
        <el-form-item :label="$t('bankJournalPage.lblSeqNo')">
          <span>{{ refundDialog.data.seqNo }}</span>
        </el-form-item>
        <el-form-item :label="$t('bankJournalPage.lblPayeeName')">
          <span>{{ refundDialog.data.payeeName }}</span>
        </el-form-item>
        <el-form-item :label="$t('bankJournalPage.lblBankNumber')">
          <span>{{ refundDialog.data.bankNumber }}</span>
        </el-form-item>
        <el-form-item :label="$t('bankJournalPage.lblRecvAccount')">
          <span>{{ refundDialog.data.receivAccount }}</span>
        </el-form-item>
        <el-form-item :label="$t('bankJournalPage.lblRecvAccountNum')">
          <span>{{ refundDialog.data.receivAccountNum }}</span>
        </el-form-item>
      </div>
      <el-form-item :label="$t('bankJournalPage.lblPayoutDate')" prop="refundDate">
        <el-date-picker
          v-model="queryData.refundDate"
          type="date"
          value-format="yyyy-MM-dd"
          :placeholder="$t('bankJournalPage.phSelect')"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item :label="$t('bankJournalPage.lblRefundReason')" prop="refundReason">
        <el-input
          v-model="queryData.refundReason"
          type="textarea"
          maxlength="50"
          show-word-limit
          :placeholder="$t('bankJournalPage.phInput')"
        />
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="closeDialog">{{ $t('bankJournalPage.btnCancel') }}</el-button>
      <el-button type="primary" :loading="submitting" @click="onSubmitFeiShu">{{ $t('bankJournalPage.btnFeishuSubmit') }}</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { pufaFeiShuSend, pufaApplyForRefund } from '@/api/bankEnterpriseDirect'

export default {
  name: 'RefundDialog',
  props: {
    refundDialog: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      queryData: {
        feishuApplyNo: '',
        refundDate: '',
        refundReason: ''
      },
      submitting: false
    }
  },
  computed: {
    rules () {
      return {
        refundDate: [{ required: true, message: this.$t('bankJournalPage.rulePayoutDate'), trigger: 'change' }],
        refundReason: [{ required: true, message: this.$t('bankJournalPage.ruleRefundReason'), trigger: 'blur' }]
      }
    }
  },
  methods: {
    formatMoney (v) {
      if (v === null || v === undefined || v === '') return '-'
      return Number(v).toFixed(2)
    },
    closeDialog () {
      this.queryData.feishuApplyNo = ''
      this.queryData.refundDate = ''
      this.queryData.refundReason = ''
      this.refundDialog.show = false
      this.$nextTick(() => this.$refs.formRef && this.$refs.formRef.clearValidate())
    },
    async onSubmitFeiShu () {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return
        try {
          await this.$confirm(this.$t('bankJournalPage.confirmApprove'), this.$t('bankJournalPage.confirmTitle'), {
            type: 'warning',
            confirmButtonText: this.$t('bankJournalPage.confirmOk'),
            cancelButtonText: this.$t('bankJournalPage.confirmCancel')
          })
          this.submitting = true
          const fs = await pufaFeiShuSend({
            refundDate: this.queryData.refundDate,
            refundReason: this.queryData.refundReason,
            id: this.refundDialog.data.id
          })
          if (fs.code !== 200) {
            this.$message.error(fs.msg || this.$t('bankJournalPage.msgFeishuApplyFail'))
            return
          }
          this.queryData.feishuApplyNo = fs.data
          const res = await pufaApplyForRefund({
            id: this.refundDialog.data.id,
            applyNo: this.queryData.feishuApplyNo,
            refundDate: this.queryData.refundDate,
            refundRemark: this.queryData.refundReason,
            status: 3
          })
          if (res.code === 200) {
            this.$message.success(res.msg || this.$t('bankJournalPage.msgSubmitted'))
            this.$emit('search')
            this.closeDialog()
          }
        } catch (e) {
          if (e !== 'cancel' && e.msg) this.$message.error(e.msg)
        } finally {
          this.submitting = false
        }
      })
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
</style>
