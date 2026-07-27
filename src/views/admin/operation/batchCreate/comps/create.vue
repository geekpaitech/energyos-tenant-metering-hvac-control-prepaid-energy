<template>
  <el-dialog
    :close-on-click-modal="false"
    :visible.sync="createDialog.show"
    width="500px"
    title="补单"
    @close="closeDialog"
    @open="openDialog"
  >
    <el-form ref="form" label-width="auto">
      <div class="section-title">缩限条件</div>
      <el-form-item label="设备已绑定租户" label-width="150" />
      <el-form-item label="补单数据「总费用」&gt;">
        <el-input-number
          v-model="money"
          :precision="2"
          :min="0"
          style="width:100%"
        />
      </el-form-item>
      <div class="section-title">账单日期</div>
      <el-form-item label="起始日期" label-width="80">
        <el-date-picker
          v-model="settleDate"
          :picker-options="pickerOptions"
          placeholder="起始日期"
          type="date"
          format="yyyy-MM-dd"
          value-format="yyyy-MM-dd"
          style="width:100%"
        />
      </el-form-item>
      <el-form-item label="备注内容" label-width="80">
        <el-input
          v-model="remark"
          show-word-limit
          maxlength="50"
          type="textarea"
          clearable
          placeholder="备注内容"
        />
        <div class="quick-notes">
          <el-tag
            v-for="(item, idx) in quickData"
            :key="idx"
            class="quick-tag"
            size="small"
            type="info"
            @click="selectQuick(item)"
          >{{ item }}</el-tag>
        </div>
      </el-form-item>
    </el-form>
    <span slot="footer">
      <el-button @click="closeDialog">取 消</el-button>
      <el-button type="primary" @click="onSubmit">确 认</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { settleToolsDoSettleManagerRepair } from '@/api/adminDb'

const REMARK_CACHE_KEY = 'batchCreate_remark'

export default {
  name: 'BatchCreateCreate',
  props: {
    createDialog: {
      type: Object,
      default () {
        return { show: false, id: '' }
      },
      required: true
    }
  },
  data () {
    return {
      settleDate: '',
      remark: '',
      money: 1,
      pickerOptions: {
        disabledDate (time) {
          return time.getTime() > Date.now() - 86400000
        }
      },
      quickData: []
    }
  },
  methods: {
    async onSubmit () {
      try {
        await this.$confirm('确认保存补单数据?', '提示', { type: 'warning' })
        const query = {
          repairBalanceMin: this.money * 1,
          settleDate: this.settleDate,
          smrId: this.createDialog.id,
          remark: this.remark
        }
        const { msg } = await settleToolsDoSettleManagerRepair(query)
        try { localStorage.setItem(REMARK_CACHE_KEY, this.remark) } catch (e) { /* ignore */ }
        this.$message.success(msg)
        this.closeDialog()
        this.$emit('search')
      } catch (e) { /* cancelled */ }
    },
    closeDialog () {
      this.money = 1
      this.remark = ''
      this.createDialog.show = false
    },
    selectQuick (item) {
      this.remark = item
    },
    openDialog () {
      this.quickData = ['数据用能初始化']
      try {
        const cached = localStorage.getItem(REMARK_CACHE_KEY)
        if (cached) this.remark = cached
      } catch (e) { /* ignore */ }
    }
  }
}
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
}

.quick-notes {
  margin-top: 8px;
}

.quick-tag {
  cursor: pointer;
  margin-right: 8px;
}
</style>
