<template>
  <el-dialog
    title="切换项目"
    :close-on-click-modal="false"
    :visible.sync="bindDialog.show"
    width="600px"
    @close="closeDialog"
  >
    <el-table :data="bindDialog.selects" height="280" border size="small">
      <el-table-column prop="managerId" label="项目编号" width="120" />
      <el-table-column prop="managerName" label="项目名称" min-width="180" />
      <el-table-column prop="num" label="水表数量" width="100" />
    </el-table>
    <el-form label-width="120px" style="margin-top:20px">
      <el-form-item label="项目名称/编号">
        <el-select v-model="queryData.changeManagerId" filterable clearable placeholder="项目名称或编号" style="width:100%">
          <el-option v-for="item in managerNames" :key="item.id" :label="item.unite" :value="item.id" />
        </el-select>
      </el-form-item>
    </el-form>
    <p v-if="queryData.msg" class="msg">{{ queryData.msg }}</p>
    <span slot="footer">
      <el-button @click="closeDialog">取 消</el-button>
      <el-button type="primary" @click="onSubmit">确 认</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { adminWaterChangeWaterManager, adminDbGetManagerListByUser } from '@/api/adminWater'
import { mapManagerOptions } from '../utils'

export default {
  props: {
    bindDialog: {
      type: Object,
      default: () => ({ show: false, waterIdList: [], selects: [] })
    }
  },
  data () {
    return {
      managerNames: [],
      queryData: { msg: null, changeManagerId: '' }
    }
  },
  watch: {
    'bindDialog.show' (v) {
      if (v && !this.managerNames.length) this.loadManagers()
    }
  },
  methods: {
    async loadManagers () {
      const { data } = await adminDbGetManagerListByUser()
      const list = Array.isArray(data) ? data : (data?.dataList || [])
      this.managerNames = mapManagerOptions(list)
    },
    async onSubmit () {
      if (!this.queryData.changeManagerId) {
        this.$message.warning('请选择目标项目')
        return
      }
      try {
        await this.$confirm('确认切换项目？', '提示', { type: 'warning' })
      } catch (e) {
        return
      }
      const { data, msg } = await adminWaterChangeWaterManager({
        waterIdList: this.bindDialog.waterIdList,
        targetManagerId: this.queryData.changeManagerId
      })
      if (data) {
        this.queryData.msg = data
      } else {
        this.$message.success(msg || '切换成功')
        this.$emit('search')
        this.closeDialog()
      }
    },
    closeDialog () {
      this.bindDialog.show = false
      this.queryData.msg = null
      this.queryData.changeManagerId = ''
    }
  }
}
</script>

<style scoped>
.msg {
  color: #f56c6c;
  margin-top: 12px;
}
</style>
