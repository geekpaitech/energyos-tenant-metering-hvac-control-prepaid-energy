<template>
  <el-dialog
    :title="editDialog.type ? '设置水表' : '新增水表'"
    :close-on-click-modal="false"
    :visible.sync="editDialog.show"
    width="540px"
    @open="initDialog"
    @close="closeDialog"
  >
    <el-form ref="formName" :model="queryData" :rules="rules" label-width="130px">
      <el-form-item label="绑定项目" prop="managerId">
        <el-select
          v-model="queryData.managerId"
          :disabled="!!editDialog.data.managerId"
          filterable
          clearable
          placeholder="请选择"
          style="width:100%"
        >
          <el-option v-for="item in managerNames" :key="item.id" :label="item.unite" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="editDialog.type" label="水表编号">
        <el-input v-model="queryData.id" disabled />
      </el-form-item>
      <el-form-item v-if="!editDialog.type" label="接入渠道" prop="waterType">
        <el-select v-model="queryData.waterType" clearable placeholder="请选择" style="width:100%">
          <el-option v-for="item in waterChannelOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="设备号" prop="serial">
        <el-input v-model="queryData.serial" placeholder="请输入" :disabled="editDialog.type" />
      </el-form-item>
      <el-form-item label="物料编码" prop="materialCode">
        <el-input v-model="queryData.materialCode" placeholder="请输入" />
      </el-form-item>
      <el-form-item v-if="queryData.waterType === 'YYWL_YY'" label="厂家号">
        <el-input v-model="queryData.mfrsNo" placeholder="请输入" :disabled="editDialog.type" />
      </el-form-item>
      <el-form-item label="水表名称" prop="waterName">
        <el-input v-model="queryData.waterName" placeholder="请输入" />
      </el-form-item>
      <el-form-item label="水表类型">
        <el-select v-model="queryData.bindType" clearable placeholder="请选择" style="width:100%">
          <el-option v-for="item in bindTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="是否支持阀控">
        <el-select v-model="queryData.withSwitch" clearable placeholder="请选择" style="width:100%">
          <el-option v-for="item in withSwitchOptions" :key="String(item.value)" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="queryData.withSwitch" label="付费模式">
        <el-select v-model="queryData.logicPayType" clearable placeholder="请选择" style="width:100%">
          <el-option v-for="item in payTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="设备型号">
        <el-input v-model="queryData.waterModel" placeholder="请输入" />
      </el-form-item>
    </el-form>
    <span slot="footer">
      <el-button @click="closeDialog">取 消</el-button>
      <el-button type="primary" :loading="submitting" @click="onSubmit">确 认</el-button>
    </span>
  </el-dialog>
</template>

<script>
import {
  adminWaterAddMeter,
  adminWaterUpdateWater,
  adminDbGetManagerListByUser
} from '@/api/adminWater'
import { WaterBindType, WaterChannelType, WaterPayType, WaterSwitchSupport } from '@/utils/enums/water'
import { mapManagerOptions } from '../utils'

const emptyForm = () => ({
  managerId: '',
  id: '',
  waterType: '',
  serial: '',
  materialCode: '',
  mfrsNo: '',
  waterName: '',
  bindType: '',
  withSwitch: '',
  logicPayType: '',
  waterModel: ''
})

export default {
  props: {
    editDialog: {
      type: Object,
      default: () => ({ show: false, type: false, data: {} })
    }
  },
  data () {
    return {
      submitting: false,
      managerNames: [],
      queryData: emptyForm(),
      rules: {
        waterName: [{ required: true, message: '水表名称不能为空', trigger: 'blur' }],
        serial: [{ required: true, message: '设备号不能为空', trigger: 'blur' }],
        managerId: [{ required: true, message: '请选择项目', trigger: 'change' }],
        materialCode: [{
          pattern: /^[a-zA-Z0-9]*$/,
          message: '物料编码只能包含大小写字母和数字',
          trigger: 'blur'
        }]
      }
    }
  },
  computed: {
    bindTypeOptions () { return Object.values(WaterBindType) },
    waterChannelOptions () { return Object.values(WaterChannelType) },
    withSwitchOptions () { return Object.values(WaterSwitchSupport) },
    payTypeOptions () { return Object.values(WaterPayType) }
  },
  methods: {
    async loadManagers () {
      const { data } = await adminDbGetManagerListByUser()
      const list = Array.isArray(data) ? data : (data?.dataList || [])
      this.managerNames = mapManagerOptions(list)
    },
    onSubmit () {
      this.$refs.formName.validate(async valid => {
        if (!valid) return
        if (!this.editDialog.type && !this.queryData.waterType) {
          this.$message.warning('请选择接入渠道')
          return
        }
        try {
          await this.$confirm(`确认${this.editDialog.type ? '设置' : '新增'}水表?`, '提示', { type: 'warning' })
        } catch (e) {
          return
        }
        this.submitting = true
        try {
          this.queryData.serial = (this.queryData.serial || '').trim()
          const { msg } = this.editDialog.type
            ? await adminWaterUpdateWater(this.queryData)
            : await adminWaterAddMeter(this.queryData)
          this.$message.success(msg || '保存成功')
          this.$emit('search')
          this.closeDialog()
        } finally {
          this.submitting = false
        }
      })
    },
    closeDialog () {
      this.queryData = emptyForm()
      this.editDialog.show = false
    },
    async initDialog () {
      await this.loadManagers()
      if (!this.editDialog.type) {
        this.queryData = emptyForm()
        if (this.editDialog.data?.managerId) {
          this.queryData.managerId = this.editDialog.data.managerId
        }
      } else {
        const d = this.editDialog.data || {}
        this.queryData = {
          managerId: d.managerId,
          id: d.id,
          waterType: d.waterType,
          serial: d.serial,
          materialCode: d.materialCode || '',
          mfrsNo: d.mfrsNo || '',
          waterName: d.waterName,
          bindType: d.bindType,
          withSwitch: d.withSwitch,
          logicPayType: d.logicPayType,
          waterModel: d.waterModel || ''
        }
      }
      this.$nextTick(() => this.$refs.formName?.clearValidate())
    }
  }
}
</script>
