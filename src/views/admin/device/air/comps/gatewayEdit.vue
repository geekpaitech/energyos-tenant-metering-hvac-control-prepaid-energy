<template>
  <el-dialog :title="editDialog.type ? '编辑' : '新增'" :visible.sync="editDialog.show" width="520px" append-to-body :close-on-click-modal="false" @open="initDialog">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="网关名称" prop="name"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="归属项目" prop="managerId">
        <el-select v-model="form.managerId" filterable clearable style="width: 100%" @change="handleManagerChange">
          <el-option v-for="item in managerOptions" :key="item.id" :label="item.unite" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="网关品牌" prop="mfrsNo">
        <el-select v-model="form.mfrsNo" clearable style="width: 100%">
          <el-option v-for="item in mfrsNoMap" :key="item.mfrsNo" :label="item.name" :value="item.mfrsNo" />
        </el-select>
      </el-form-item>
      <el-form-item label="网关MAC" prop="addr"><el-input v-model="form.addr" /></el-form-item>
      <el-form-item label="计量电表" prop="meterId">
        <el-select
          v-model="form.meterId"
          :disabled="!form.managerId"
          :placeholder="form.managerId ? '请选择' : '请先选择归属项目'"
          multiple
          clearable
          collapse-tags
          style="width: 100%"
        >
          <el-option v-for="item in meterList" :key="item.meterId" :label="item.unite" :value="item.meterId" />
        </el-select>
      </el-form-item>
      <el-form-item label="计费方案">
        <el-select
          v-model="form.priceId"
          :disabled="!form.managerId"
          :placeholder="form.managerId ? '请选择' : '请先选择归属项目'"
          clearable
          style="width: 100%"
        >
          <el-option v-for="item in priceList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="备注信息"><el-input v-model="form.remark" /></el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="editDialog.show = false">取消</el-button>
      <el-button type="primary" @click="onSubmit">确认</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { adminManagerGetManagerListByUser, airGatewayCreateAirGateway, airGatewayUpdateAirGateway, listAirMeterInfo } from '@/api/adminapi'
import { meterPriceList } from '@/api/meterPrice'

export default {
  props: { editDialog: { type: Object, required: true } },
  data () {
    return {
      form: { addr: '', meterId: [], managerId: '', priceId: '', remark: '', name: '', mfrsNo: '' },
      meterList: [],
      priceList: [],
      managerOptions: [],
      mfrsNoMap: [
        { name: '德姆瑞', mfrsNo: 'DMR' },
        { name: '飞奕', mfrsNo: 'FY' }
      ],
      rules: {
        name: [{ required: true, message: '请输入网关名称', trigger: 'blur' }],
        managerId: [{ required: true, message: '请选择归属项目', trigger: 'change' }],
        mfrsNo: [{ required: true, message: '请选择网关品牌', trigger: 'change' }],
        addr: [{ required: true, message: '请输入网关MAC', trigger: 'blur' }]
      }
    }
  },
  methods: {
    getDefaultForm () {
      return { addr: '', meterId: [], managerId: '', priceId: '', remark: '', name: '', mfrsNo: '' }
    },
    async fetchManagerOptions () {
      const res = await adminManagerGetManagerListByUser()
      const list = Array.isArray(res.data) ? res.data : []
      this.managerOptions = list.map(item => {
        const id = item.managerId || item.id
        const name = item.managerName || item.name
        return { ...item, id, unite: `(${id})${name}` }
      })
    },
    async initDialog () {
      await this.fetchManagerOptions()
      this.meterList = []
      this.priceList = []
      if (this.editDialog.type && this.editDialog.data) {
        const d = this.editDialog.data
        this.form = {
          ...this.getDefaultForm(),
          ...d,
          mfrsNo: d.mfrsNo || '',
          meterId: d.meterId ? String(d.meterId).split(',') : []
        }
      } else {
        this.form = this.getDefaultForm()
      }
      if (this.form.managerId) await this.handleManagerChange(this.form.managerId)
      this.$nextTick(() => {
        this.$refs.formRef && this.$refs.formRef.clearValidate()
      })
    },
    async handleManagerChange (managerId) {
      if (!managerId) {
        this.meterList = []
        this.priceList = []
        this.form.meterId = []
        this.form.priceId = ''
        return
      }
      const meterRes = await listAirMeterInfo({ managerId, gatewayId: this.editDialog.data?.id })
      this.meterList = (meterRes.data || []).map(item => ({ ...item, meterId: String(item.meterId), unite: `${item.meterName}(${item.serial})` }))
      const priceRes = await meterPriceList({ managerId, priceType: 1 })
      this.priceList = priceRes.data || []
    },
    async onSubmit () {
      this.$refs.formRef.validate(async valid => {
        if (!valid) return
        const payload = { ...this.form, meterId: Array.isArray(this.form.meterId) ? this.form.meterId.join(',') : '' }
        const res = this.editDialog.type ? await airGatewayUpdateAirGateway({ ...payload, id: this.editDialog.data.id }) : await airGatewayCreateAirGateway(payload)
        this.$message.success(res.msg || '操作成功')
        this.editDialog.show = false
        this.$emit('search')
      })
    }
  }
}
</script>
