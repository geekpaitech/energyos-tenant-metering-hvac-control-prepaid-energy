<template>
  <el-drawer :visible.sync="filterDrawer.show" title="高级筛选" size="480px" @close="closeDialog">
    <el-form label-width="115px" class="filter-form">
      <el-form-item label="项目名称/编号">
        <el-select
          v-model="filterDrawer.query.managerId"
          filterable
          clearable
          placeholder="项目名称或编号"
          style="width:100%"
          @change="onManagerChange"
        >
          <el-option v-for="item in managerNames" :key="item.id" :label="item.unite" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="绑定信息">
        <el-select
          v-model="filterDrawer.query.bindId"
          filterable
          clearable
          :disabled="!filterDrawer.query.managerId"
          :placeholder="filterDrawer.query.managerId ? '租户名称或编号' : '请先选择项目'"
          style="width:100%"
        >
          <el-option v-for="item in tenantList" :key="item.id" :label="item.unite" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="电表编号">
        <el-input v-model="filterDrawer.query.id" clearable placeholder="请输入" />
      </el-form-item>
      <el-form-item label="电表序列号">
        <el-input v-model="filterDrawer.query.serial" clearable placeholder="请输入" />
      </el-form-item>
      <el-form-item label="物料编码">
        <el-input v-model="filterDrawer.query.materialCode" clearable placeholder="请输入" />
      </el-form-item>
      <el-form-item label="电表名称">
        <el-input v-model="filterDrawer.query.meterName" clearable placeholder="请输入" />
      </el-form-item>
      <el-form-item label="电表类型">
        <el-select v-model="filterDrawer.query.bindType" clearable placeholder="请选择" style="width:100%">
          <el-option v-for="(item, k) in bindTypeOptions" :key="k" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="合闸状态">
        <el-select v-model="filterDrawer.query.switchStatus" clearable placeholder="请选择" style="width:100%">
          <el-option v-for="(item, k) in switchOptions" :key="k" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="在线状态">
        <el-select v-model="filterDrawer.query.onlineStatus" clearable placeholder="请选择" style="width:100%">
          <el-option v-for="(item, k) in onlineOptions" :key="k" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </el-form>
    <div class="drawer-footer">
      <el-button type="primary" @click="onSubmit">查询</el-button>
      <el-button @click="onReset">重置</el-button>
    </div>
  </el-drawer>
</template>

<script>
import { MeterBindType, MeterSwitchStatus, MeterOnlineStatus } from '@/utils/enums/meter'

export default {
  props: {
    filterDrawer: { type: Object, required: true },
    managerNames: { type: Array, default: () => [] },
    tenantList: { type: Array, default: () => [] }
  },
  computed: {
    bindTypeOptions () { return Object.values(MeterBindType) },
    switchOptions () { return Object.values(MeterSwitchStatus) },
    onlineOptions () { return Object.values(MeterOnlineStatus) }
  },
  methods: {
    closeDialog () {
      this.filterDrawer.show = false
    },
    onManagerChange (managerId) {
      this.filterDrawer.query.bindId = ''
      this.$emit('manager-change', managerId)
    },
    onSubmit () {
      this.$emit('filter', { ...this.filterDrawer.query })
      this.closeDialog()
    },
    onReset () {
      this.$emit('reset')
      this.closeDialog()
    }
  }
}
</script>

<style scoped>
.filter-form { padding: 0 16px; }
.drawer-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  border-top: 1px solid #ebeef5;
  text-align: right;
}
</style>
