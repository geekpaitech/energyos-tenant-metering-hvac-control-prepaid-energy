<template>
  <el-dialog
    :close-on-click-modal="false"
    :visible.sync="addDialog.show"
    width="450px"
    title="新增手动账单查询"
    @close="closeDialog"
  >
    <el-form label-width="90px">
      <el-form-item label="项目名称/编号">
        <el-select
          v-model="queryData.managerId"
          filterable
          clearable
          placeholder="项目名称/编号"
          style="width:100%"
          @change="changeManager"
        >
          <el-option
            v-for="item in managerNames"
            :key="item.id"
            :label="item.unite"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="租户名称/编号">
        <el-select
          v-model="tenantIds"
          multiple
          filterable
          clearable
          :disabled="!queryData.managerId"
          :placeholder="queryData.managerId ? '租户名称或编号' : '请先选择项目'"
          style="width:100%"
        >
          <el-option
            v-for="item in tenantList"
            :key="item.id"
            :label="item.unite"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="起始日期">
        <el-date-picker
          v-model="queryData.startDateTime"
          placeholder="请选择"
          :picker-options="pickerOptions"
          type="datetime"
          format="yyyy-MM-dd HH:mm:ss"
          value-format="yyyy-MM-dd HH:mm:ss"
          style="width:100%"
        />
      </el-form-item>
      <el-form-item label="设备类型">
        <el-select v-model="queryData.deviceType" placeholder="请选择" style="width:100%">
          <el-option
            v-for="item in DeviceTypeList"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <span slot="footer">
      <el-button @click="closeDialog">取 消</el-button>
      <el-button type="primary" @click="onSubmit">确 认</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { settleToolsApplyQueryManagerRepair, adminDbGetSimpleTenantList } from '@/api/adminDb'
import { mapTenantOptions } from '@/views/admin/device/meter/utils'

const DeviceTypeList = [
  { value: '1', label: '电表' },
  { value: '2', label: '水表' }
]

export default {
  name: 'BatchCreateAdd',
  props: {
    addDialog: { type: Object, default: () => ({ show: false }), required: true },
    managerNames: { type: Array, default: () => [] }
  },
  data () {
    return {
      DeviceTypeList,
      queryData: { managerId: '', startDateTime: '', deviceType: '' },
      tenantIds: [],
      tenantList: [],
      pickerOptions: {
        disabledDate (time) {
          return time.getTime() > Date.now() - 86400000
        }
      }
    }
  },
  methods: {
    closeDialog () {
      this.queryData = { managerId: '', startDateTime: '', deviceType: '' }
      this.tenantIds = []
      this.tenantList = []
      this.addDialog.show = false
    },
    async onSubmit () {
      try {
        await this.$confirm('是否增加手动账单?', '提示', { type: 'warning' })
      } catch (e) {
        return
      }
      try {
        const { msg } = await settleToolsApplyQueryManagerRepair(this.queryData, this.tenantIds)
        this.$message.success(msg)
        this.closeDialog()
        this.$emit('search')
      } catch (e) {
        this.$message.error(e?.message || '提交失败')
      }
    },
    async changeManager (val) {
      if (!val) {
        this.tenantIds = []
        this.tenantList = []
        return
      }
      this.queryData.managerId = val
      await this.getTenantList()
    },
    async getTenantList () {
      try {
        const { data } = await adminDbGetSimpleTenantList({ managerId: this.queryData.managerId, tenantStatus: 0 })
        const list = Array.isArray(data) ? data : (data?.dataList || data?.list || [])
        this.tenantList = mapTenantOptions(list)
      } catch (e) {
        this.tenantList = []
      }
    }
  }
}
</script>
