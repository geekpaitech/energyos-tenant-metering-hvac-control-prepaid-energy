<template>
  <el-dialog
    :title="editDialog.type ? '设置' : '新增'"
    :close-on-click-modal="false"
    :visible.sync="editDialog.show"
    width="540px"
    @open="initDialog"
    @close="closeDialog"
  >
    <el-form ref="formName" :model="queryData" :rules="rules" label-width="130px">
      <el-form-item v-if="editDialog.type" label="电表编号">
        <el-input v-model="queryData.id" disabled />
      </el-form-item>
      <el-form-item label="电表序列号" prop="serial">
        <el-input v-model="queryData.serial" placeholder="请输入" :disabled="editDialog.type" />
      </el-form-item>
      <el-form-item label="物料编码" prop="materialCode">
        <el-input v-model="queryData.materialCode" placeholder="请输入" />
      </el-form-item>
      <el-form-item label="项目编号" prop="managerId">
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
      <el-form-item label="电表名称" prop="meterName">
        <el-input v-model="queryData.meterName" placeholder="请输入" />
      </el-form-item>
      <el-form-item label="电表类型">
        <el-select v-model="queryData.bindType" clearable placeholder="请选择" style="width:100%">
          <el-option v-for="(item, k) in bindTypeOptions" :key="k" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="付费模式">
        <el-select v-model="queryData.logicPayType" clearable placeholder="请选择" style="width:100%">
          <el-option label="预付费" :value="0" />
          <el-option label="强控" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="CT">
        <el-input v-model="queryData.ct" placeholder="请输入">
          <el-button v-if="editDialog.type" slot="append" @click="onReadCT">读取CT</el-button>
        </el-input>
      </el-form-item>
      <el-form-item label="PT">
        <el-input v-model="queryData.pt" placeholder="请输入" />
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
  meterUpdataeMeterBase,
  meterAddMeter,
  meterReadAndRefreshCt,
  meterPageMeterInfo,
  adminDbGetManagerListByUser
} from '@/api/adminDb'
import { MeterBindType } from '@/utils/enums/meter'
import { mapManagerOptions } from '../utils'

const emptyForm = () => ({
  bindType: '',
  ct: '',
  pt: '',
  serial: '',
  meterName: '',
  logicPayType: '',
  managerId: '',
  materialCode: '',
  id: ''
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
        meterName: [{ required: true, message: '电表名称不能为空', trigger: 'blur' }],
        serial: [{ required: true, message: '电表序列号不能为空', trigger: 'blur' }],
        managerId: [{ required: true, message: '项目编号不能为空', trigger: 'change' }],
        materialCode: [{
          pattern: /^[a-zA-Z0-9]*$/,
          message: '物料编码只能包含大小写字母和数字',
          trigger: 'blur'
        }]
      }
    }
  },
  computed: {
    bindTypeOptions () {
      return Object.values(MeterBindType)
    }
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
        try {
          await this.$confirm(`确认${this.editDialog.type ? '设置' : '新增'}电表?`, '提示', { type: 'warning' })
        } catch (e) {
          return
        }
        this.submitting = true
        try {
          this.queryData.serial = (this.queryData.serial || '').trim()
          const { msg } = this.editDialog.type
            ? await meterUpdataeMeterBase(this.queryData)
            : await meterAddMeter(this.queryData)
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
        return
      }
      await this.getMeterInfo()
    },
    async getMeterInfo () {
      const { data: { dataList } } = await meterPageMeterInfo({
        id: this.editDialog.data.id,
        page: { size: 1, current: 1 }
      })
      const arr = dataList?.[0] || {}
      const form = emptyForm()
      Object.keys(form).forEach(key => {
        if (arr[key] !== undefined && arr[key] !== null && arr[key] !== '') {
          form[key] = arr[key]
        }
      })
      form.id = arr.id
      this.queryData = form
    },
    async onReadCT () {
      const { data, msg } = await meterReadAndRefreshCt({ meterId: this.editDialog.data.id })
      if (data !== undefined) this.queryData.ct = data
      this.$message.success(msg || '读取成功')
    }
  }
}
</script>
