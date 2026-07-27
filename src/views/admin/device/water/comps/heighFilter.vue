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
      <el-form-item label="设备号">
        <el-input v-model="filterDrawer.query.serial" clearable placeholder="请输入" />
      </el-form-item>
      <el-form-item label="水表编号">
        <el-input v-model="filterDrawer.query.id" clearable placeholder="请输入" />
      </el-form-item>
      <el-form-item label="物料编码">
        <el-input v-model="filterDrawer.query.materialCode" clearable placeholder="请输入" />
      </el-form-item>
      <el-form-item label="水表名称">
        <el-input v-model="filterDrawer.query.waterName" clearable placeholder="请输入" />
      </el-form-item>
      <el-form-item label="水表类型">
        <el-select v-model="filterDrawer.query.bindType" clearable placeholder="请选择" style="width:100%">
          <el-option v-for="item in bindTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="接入渠道">
        <el-select v-model="filterDrawer.query.waterType" clearable placeholder="请选择" style="width:100%">
          <el-option v-for="item in waterChannelOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="异常类型">
        <el-select v-model="filterDrawer.query.abnormal" clearable placeholder="请选择" style="width:100%">
          <el-option v-for="item in abnormalOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="在线状态">
        <el-select v-model="filterDrawer.query.onlineStatus" clearable placeholder="请选择" style="width:100%">
          <el-option v-for="item in onlineOptions" :key="item.value" :label="item.label" :value="item.value" />
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
import { WaterBindType, WaterChannelType, WaterAbnormalType, WaterOnlineStatus } from '@/utils/enums/water'

export default {
  props: {
    filterDrawer: { type: Object, required: true },
    managerNames: { type: Array, default: () => [] }
  },
  computed: {
    bindTypeOptions () { return Object.values(WaterBindType) },
    waterChannelOptions () { return Object.values(WaterChannelType) },
    abnormalOptions () { return Object.values(WaterAbnormalType) },
    onlineOptions () { return Object.values(WaterOnlineStatus) }
  },
  methods: {
    closeDialog () {
      this.filterDrawer.show = false
    },
    onManagerChange () {},
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
