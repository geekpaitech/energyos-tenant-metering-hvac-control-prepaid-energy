<template>
  <el-dialog
    :title="$t('tenantDialogs.batchDebit.title')"
    :visible.sync="dialogVisible"
    width="480px"
    :close-on-click-modal="false"
    class="custom-dialog"
    @close="handleClose"
    @open="handleOpen"
  >
    <el-form
      ref="batchForm"
      :model="form"
      :rules="rules"
      :label-width="dialogLabelWidth"
    >
      <el-form-item :label="$t('tenantDialogs.batchDebit.labelUseType')" prop="useType">
        <el-radio-group v-model="form.useType">
          <el-radio :label="2">{{ $t('tenantDialogs.batchDebit.electric') }}</el-radio>
          <el-radio :label="0">{{ $t('tenantDialogs.batchDebit.water') }}</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item :label="$t('tenantDialogs.batchDebit.labelBillDate')" prop="billDate">
        <el-date-picker
          v-model="form.billDate"
          type="date"
          :placeholder="$t('tenantDialogs.batchDebit.phBillDate')"
          value-format="yyyy-MM-dd"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item :label="$t('tenantDialogs.batchDebit.labelRemark')" prop="remark">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          :placeholder="$t('tenantDialogs.batchDebit.phRemark')"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>

      <el-form-item :label="$t('tenantDialogs.batchDebit.labelDetail')">
        <div class="upload-row">
          <el-upload
            action="#"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
            :file-list="fileList"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :on-exceed="handleExceed"
          >
            <el-button size="small" type="primary">{{ $t('tenantDialogs.batchDebit.uploadBtn') }}</el-button>
          </el-upload>
          <el-button type="text" class="download-link" @click="downloadTemplate">
            <i class="el-icon-download" />
            {{ $t('tenantDialogs.batchDebit.downloadTpl') }}
          </el-button>
        </div>
        <div class="upload-tips">
          {{ $t('tenantDialogs.batchDebit.tipFormat') }}
        </div>
        <div class="upload-tips warn">
          {{ $t('tenantDialogs.batchDebit.tipAmount') }}
        </div>
      </el-form-item>
    </el-form>

    <span slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">{{ $t('tenantDialogs.batchDebit.cancel') }}</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        @click="handleSubmit"
      >
        {{ submitting ? $t('tenantDialogs.batchDebit.submitting') : $t('tenantDialogs.batchDebit.confirm') }}
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
import * as XLSX from 'xlsx'
import { getSimpleTenantList } from '@/api/useReport'
import { batchManualDebit } from '@/api/pay'

export default {
  name: 'BatchManualDebitDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    managerId: {
      type: [String, Number],
      default: ''
    }
  },
  data () {
    return {
      submitting: false,
      form: {
        useType: 2,
        billDate: '',
        remark: ''
      },
      manualDebitDtoList: [],
      fileList: []
    }
  },
  computed: {
    dialogLabelWidth () {
      return this.$i18n.locale === 'en' ? '120px' : '100px'
    },
    rules () {
      return {
        useType: [
          { required: true, message: this.$t('tenantDialogs.batchDebit.ruleUseType'), trigger: 'change' }
        ],
        billDate: [
          { required: true, message: this.$t('tenantDialogs.batchDebit.ruleBillDate'), trigger: 'change' }
        ],
        remark: [
          { required: true, message: this.$t('tenantDialogs.batchDebit.ruleRemark'), trigger: 'blur' }
        ]
      }
    },
    dialogVisible: {
      get () {
        return this.visible
      },
      set (val) {
        this.$emit('update:visible', val)
      }
    }
  },
  methods: {
    isTenantNameColumn (key) {
      const s = String(key || '').trim()
      const lower = s.toLowerCase()
      if (lower.includes('tenant') && lower.includes('name')) return true
      if (s.includes('名')) return true
      if ((lower === 'name' || lower === 'tenant name') && !lower.includes('id')) return true
      return false
    },
    isTenantIdColumn (key) {
      const s = String(key || '').trim()
      if (this.isTenantNameColumn(key)) return false
      if (/tenant\s*id/i.test(s)) return true
      if (s.includes('租户') && /id/i.test(s)) return true
      if (s.indexOf('ID') !== -1 || s.indexOf('id') !== -1) return true
      return false
    },
    isAmountColumn (key) {
      const s = String(key || '').trim()
      const lower = s.toLowerCase()
      if (s.includes('金额')) return true
      if (lower.includes('amount')) return true
      if (lower.includes('debit')) return true
      return false
    },

    handleOpen () {
      const today = new Date()
      const y = today.getFullYear()
      const m = String(today.getMonth() + 1).padStart(2, '0')
      const d = String(today.getDate()).padStart(2, '0')
      this.form = {
        useType: 2,
        billDate: `${y}-${m}-${d}`,
        remark: ''
      }
      this.manualDebitDtoList = []
      this.fileList = []
      this.$nextTick(() => {
        this.$refs.batchForm && this.$refs.batchForm.clearValidate()
      })
    },

    handleClose () {
      this.manualDebitDtoList = []
      this.fileList = []
      this.submitting = false
    },

    handleExceed () {
      this.$message.warning(this.$t('tenantDialogs.batchDebit.msgExceed'))
    },

    handleFileRemove () {
      this.manualDebitDtoList = []
      this.fileList = []
    },

    readFileAsBinary (file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = reject
        reader.readAsBinaryString(file)
      })
    },

    async handleFileChange (file, fileList) {
      const raw = file.raw
      if (!raw) return

      const name = (raw.name || '').toLowerCase()
      if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
        this.$message.error(this.$t('tenantDialogs.batchDebit.msgBadExt'))
        this.fileList = []
        this.manualDebitDtoList = []
        return
      }

      try {
        const binary = await this.readFileAsBinary(raw)
        const wb = XLSX.read(binary, { type: 'binary' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet)
        const arr = []
        rows.forEach((item) => {
          const keys = {
            tenantName: null,
            tenantId: null,
            amount: null
          }
          for (const key in item) {
            if (this.isTenantNameColumn(key)) {
              keys.tenantName = item[key]
            } else if (this.isTenantIdColumn(key)) {
              keys.tenantId = item[key]
            } else if (this.isAmountColumn(key)) {
              keys.amount = item[key]
            }
          }
          if (keys.tenantId != null && keys.tenantId !== '') {
            arr.push({
              tenantId: keys.tenantId,
              tenantName: keys.tenantName != null ? String(keys.tenantName) : '',
              amount: keys.amount
            })
          }
        })
        this.manualDebitDtoList = arr
        this.fileList = fileList.slice(-1)
        this.$message.success(this.$t('tenantDialogs.batchDebit.msgParsed', { n: arr.length }))
      } catch (e) {
        console.error(e)
        this.$apiError.notify(e, this.$t('tenantDialogs.batchDebit.msgParseFail'))
        this.fileList = []
        this.manualDebitDtoList = []
      }
    },

    async downloadTemplate () {
      const mid = this.managerId
      if (mid === '' || mid === null || mid === undefined) {
        this.$message.warning(this.$t('tenantDialogs.batchDebit.msgNoManager'))
        return
      }
      try {
        const res = await getSimpleTenantList({
          managerId: mid,
          tenantStatus: 0
        })
        if (res.code !== 200) {
          this.$message.error(res.msg || this.$t('tenantDialogs.batchDebit.msgTenantListFail'))
          return
        }
        const list = res.data || []
        const headers = [
          this.$t('tenantDialogs.batchDebit.colTenantId'),
          this.$t('tenantDialogs.batchDebit.colTenantName'),
          this.$t('tenantDialogs.batchDebit.colAmount')
        ]
        const data = list.map((t) => [
          t.tenantId != null ? t.tenantId : '',
          t.name != null ? t.name : '',
          ''
        ])
        const wsData = [headers, ...data]
        const ws = XLSX.utils.aoa_to_sheet(wsData)
        ws['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 12 }]
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, this.$t('tenantDialogs.batchDebit.sheetDetail'))
        XLSX.writeFile(wb, this.$t('tenantDialogs.batchDebit.tplFileName'))
        this.$message.success(this.$t('tenantDialogs.batchDebit.msgTplOk'))
      } catch (e) {
        console.error(e)
        this.$message.error((e && e.msg) || this.$t('tenantDialogs.batchDebit.msgTplFail'))
      }
    },

    exportFailSheet (table) {
      const headers = [
        this.$t('tenantDialogs.batchDebit.colTenantId'),
        this.$t('tenantDialogs.batchDebit.colTenantName'),
        this.$t('tenantDialogs.batchDebit.colAmount'),
        this.$t('tenantDialogs.batchDebit.colError')
      ]
      const wsData = [headers]
      ;(table || []).forEach((item) => {
        wsData.push([
          item.tenantId != null ? item.tenantId : '',
          item.tenantName != null ? item.tenantName : '',
          item.amount != null ? item.amount : '',
          item.errorMsg != null ? item.errorMsg : ''
        ])
      })
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      ws['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 12 }, { wch: 36 }]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, this.$t('tenantDialogs.batchDebit.sheetFail'))
      XLSX.writeFile(wb, this.$t('tenantDialogs.batchDebit.failFileName'))
    },

    buildSubmitList () {
      const remark = this.form.remark
      const billDate = this.form.billDate
      const useType = this.form.useType
      return this.manualDebitDtoList
        .map((row) => {
          const amt = Number(row.amount)
          return {
            tenantId: row.tenantId,
            tenantName: row.tenantName,
            amount: Number.isFinite(amt) ? amt : NaN,
            remark,
            billDate,
            useType
          }
        })
        .filter((row) => Number.isFinite(row.amount) && row.amount > 0)
    },

    async handleSubmit () {
      if (this.manualDebitDtoList.length === 0) {
        this.$message.warning(this.$t('tenantDialogs.batchDebit.msgNoFile'))
        return
      }
      const manualDebitDtoList = this.buildSubmitList()
      if (manualDebitDtoList.length === 0) {
        this.$message.warning(this.$t('tenantDialogs.batchDebit.msgNoPositive'))
        return
      }

      this.$refs.batchForm.validate(async (valid) => {
        if (!valid) return
        try {
          await this.$confirm(
            this.$t('tenantDialogs.batchDebit.confirmBody'),
            this.$t('tenantDialogs.batchDebit.confirmTitle'),
            {
              confirmButtonText: this.$t('tenantDialogs.batchDebit.confirm'),
              cancelButtonText: this.$t('tenantDialogs.batchDebit.cancel'),
              type: 'warning'
            }
          )
        } catch (e) {
          if (e === 'cancel') return
        }

        this.submitting = true
        try {
          const payload = {
            managerId: String(this.managerId),
            manualDebitDtoList
          }
          const res = await batchManualDebit(payload)
          if (res.code === 200) {
            if (res.data && res.data.length) {
              this.exportFailSheet(res.data)
            }
            this.$message.success(res.msg || this.$t('tenantDialogs.batchDebit.msgSubmitOk'))
            this.$emit('success')
            this.dialogVisible = false
          }
        } catch (err) {
          this.$message.error((err && err.msg) || this.$t('tenantDialogs.deduct.msgFail'))
        } finally {
          this.submitting = false
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.custom-dialog {
  ::v-deep .el-dialog__body {
    padding: 16px 20px 8px;
  }
}

.upload-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.download-link {
  padding: 0;
}

.upload-tips {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
  &.warn {
    color: #f56c6c;
  }
}
</style>
