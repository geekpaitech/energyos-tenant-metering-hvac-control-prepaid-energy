<template>
  <el-dialog
    title="设置"
    :close-on-click-modal="false"
    :visible.sync="logicDialog.show"
    width="500px"
    @open="initDialog"
    @close="closeDialog"
  >
    <div class="tip-box">
      <i class="el-icon-warning" />
      <span>当前付费模式为【预付费】，请更改为【强控】，方可分合闸</span>
    </div>
    <el-form label-width="90px">
      <el-form-item label="付费模式">
        <el-radio-group v-model="queryData.logicPayType">
          <el-radio :label="0">预付费</el-radio>
          <el-radio :label="1">强控</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <div slot="footer">
      <el-button @click="closeDialog">取 消</el-button>
      <el-button type="primary" @click="onSubmit">确 认</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { meterUpdataeMeterBase, meterPageMeterInfoByAdmin } from '@/api/adminDb'

export default {
  props: {
    logicDialog: {
      type: Object,
      default: () => ({ show: false, data: {} })
    }
  },
  data () {
    return { queryData: { logicPayType: 1 } }
  },
  methods: {
    onSubmit () {
      this.$confirm('确认修改付费模式?', '提示', { type: 'warning' })
        .then(async () => {
          const { msg } = await meterUpdataeMeterBase(this.queryData)
          this.$message.success(msg || '修改成功')
          this.closeDialog()
          this.$emit('search')
        })
        .catch(() => {})
    },
    closeDialog () {
      this.logicDialog.show = false
    },
    async initDialog () {
      const { data: { dataList } } = await meterPageMeterInfoByAdmin({
        id: this.logicDialog.data.id,
        page: { size: 1, current: 1 }
      })
      if (dataList && dataList[0]) {
        this.queryData = { ...dataList[0] }
      }
    }
  }
}
</script>

<style scoped>
.tip-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 16px;
  background: #fef0f0;
  border: 1px solid #fbc4c4;
  color: #f56c6c;
  border-radius: 4px;
}
</style>
